#!/usr/bin/env python3
"""Generate RLCard Doudizhu play-event training data.

The pure helper functions in this file intentionally do not import RLCard so
they can be tested with Python's stdlib unittest in environments where RLCard
is not installed.
"""

from __future__ import annotations

import argparse
import datetime as dt
import importlib.metadata
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Sequence, Tuple


RANKS: Tuple[str, ...] = ("3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2", "BJ", "RJ")
STANDARD_RANKS: Tuple[str, ...] = RANKS[:13]
SLICE_TARGETS: Mapping[str, int] = {"L13": 13, "L26": 26, "L54": 54}
DEFAULT_QUERY_RANKS: Tuple[str, ...] = ("A", "2", "BJ", "RJ")
PASS_ALIASES = {"", "pass", "不出", "过", "none", "null"}
SEAT_ROLE_MAP: Mapping[int, str] = {
    0: "landlord",
    1: "farmer_left",
    2: "farmer_right",
}


def create_initial_inventory() -> Dict[str, int]:
    """Return Doudizhu rank inventory for a full 54-card deck."""
    inventory = {rank: 4 for rank in STANDARD_RANKS}
    inventory["BJ"] = 1
    inventory["RJ"] = 1
    return inventory


def normalize_rank(token: Any) -> str:
    value = str(token).strip()
    upper = value.upper()
    aliases = {
        "T": "10",
        "10": "10",
        "J": "J",
        "Q": "Q",
        "K": "K",
        "A": "A",
        "2": "2",
        "B": "BJ",
        "BJ": "BJ",
        "BLACKJOKER": "BJ",
        "BLACK_JOKER": "BJ",
        "R": "RJ",
        "RJ": "RJ",
        "REDJOKER": "RJ",
        "RED_JOKER": "RJ",
    }
    if upper in aliases:
        return aliases[upper]
    if upper in {"3", "4", "5", "6", "7", "8", "9"}:
        return upper
    raise ValueError(f"unknown Doudizhu rank token: {token!r}")


def normalize_action_cards(raw_action: Any) -> List[str]:
    """Convert a raw RLCard action into normalized rank strings.

    RLCard Doudizhu actions are commonly compact strings such as ``33344`` or
    ``BR``. This parser also accepts list-like actions and delimited strings.
    """
    if raw_action is None:
        return []
    if isinstance(raw_action, (list, tuple)):
        return [normalize_rank(card) for card in raw_action]

    raw = str(raw_action).strip()
    if raw.lower() in PASS_ALIASES:
        return []

    if re.search(r"[\s,;/|_]+", raw):
        tokens = [token for token in re.split(r"[\s,;/|_]+", raw) if token]
        return [normalize_rank(token) for token in tokens]

    cards: List[str] = []
    i = 0
    while i < len(raw):
        two = raw[i : i + 2].upper()
        if two in {"10", "BJ", "RJ"}:
            cards.append(normalize_rank(two))
            i += 2
            continue
        cards.append(normalize_rank(raw[i]))
        i += 1
    return cards


def classify_pattern(cards: Sequence[str], is_pass: bool = False) -> str:
    if is_pass:
        return "pass"
    if not cards:
        return "unknown"

    counts = Counter(cards)
    count_values = sorted(counts.values())
    unique = list(counts.keys())

    if len(cards) == 2 and set(cards) == {"BJ", "RJ"}:
        return "rocket"
    if len(cards) == 1:
        return "single"
    if len(cards) == 2 and count_values == [2]:
        return "pair"
    if len(cards) == 3 and count_values == [3]:
        return "triple"
    if len(cards) == 4 and count_values == [4]:
        return "bomb"
    if len(cards) == 4 and count_values == [1, 3]:
        return "triple_with_single"
    if len(cards) == 5 and count_values == [2, 3]:
        return "triple_with_pair"
    if _is_consecutive(unique) and len(cards) >= 5 and all(count == 1 for count in counts.values()):
        return "straight"
    if _is_consecutive(unique) and len(cards) >= 6 and all(count == 2 for count in counts.values()):
        return "pair_sequence"
    if _is_consecutive(unique) and len(cards) >= 6 and all(count == 3 for count in counts.values()):
        return "triple_sequence"
    return "raw_rlcard_action"


def _is_consecutive(ranks: Sequence[str]) -> bool:
    order = {rank: index for index, rank in enumerate(STANDARD_RANKS)}
    if any(rank not in order or rank == "2" for rank in ranks):
        return False
    positions = sorted(order[rank] for rank in ranks)
    return positions == list(range(positions[0], positions[0] + len(positions)))


def build_inventory_snapshots(events: Sequence[Mapping[str, Any]]) -> List[Dict[str, int]]:
    inventory: MutableMapping[str, int] = create_initial_inventory()
    snapshots: List[Dict[str, int]] = []

    for event in events:
        if event.get("action") == "play":
            for rank in event.get("cards", []):
                normalized = normalize_rank(rank)
                inventory[normalized] -= 1
                if inventory[normalized] < 0:
                    raise ValueError(
                        f"negative inventory for rank {normalized} after event {event.get('index')}",
                    )
        snapshots.append(dict(inventory))

    return snapshots


def choose_slice_end_index(events: Sequence[Mapping[str, Any]], target_played_count: int) -> Optional[int]:
    for event in events:
        if int(event.get("cumulativePlayedCardCount", 0)) >= target_played_count:
            return int(event["index"])
    return None


def make_training_sample(
    *,
    game_id: str,
    level: str,
    events: Sequence[Mapping[str, Any]],
    target_played_count: int,
    end_index: int,
    seed: int,
    game_metadata: Mapping[str, Any],
) -> Dict[str, Any]:
    slice_events = [dict(event) for event in events[: end_index + 1]]
    inventory_snapshots = build_inventory_snapshots(slice_events)
    final_inventory = inventory_snapshots[-1] if inventory_snapshots else create_initial_inventory()
    touched_ranks = sorted(
        {rank for event in slice_events for rank in event.get("cards", [])},
        key=lambda rank: RANKS.index(normalize_rank(rank)),
    )
    query_ranks = _dedupe_preserve_order([*DEFAULT_QUERY_RANKS, *touched_ranks])
    remaining_count = {rank: final_inventory[rank] for rank in query_ranks}
    exhausted_ranks = [rank for rank in RANKS if final_inventory[rank] == 0]
    possible_bomb_ranks = [rank for rank in STANDARD_RANKS if final_inventory[rank] == 4]
    observed_played_count = int(slice_events[-1]["cumulativePlayedCardCount"]) if slice_events else 0

    return {
        "sampleId": f"{game_id}_{level}",
        "gameId": game_id,
        "level": level,
        "targetPlayedCardCount": target_played_count,
        "observedPlayedCardCount": observed_played_count,
        "sliceEndEventIndex": end_index,
        "events": slice_events,
        "inventorySnapshots": inventory_snapshots,
        "questions": {
            "remainingCountRanks": query_ranks,
            "includeExhaustedRanks": True,
            "includePossibleBombRanks": True,
        },
        "answers": {
            "remainingCount": remaining_count,
            "exhaustedRanks": exhausted_ranks,
            "possibleBombRanks": possible_bomb_ranks,
        },
        "metadata": {
            "source": "rlcard_doudizhu",
            "seed": seed,
            "game": dict(game_metadata),
        },
    }


def _dedupe_preserve_order(values: Iterable[str]) -> List[str]:
    seen = set()
    result = []
    for value in values:
        normalized = normalize_rank(value)
        if normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


def generate_events_with_rlcard(game_seed: int) -> Tuple[List[Dict[str, Any]], Dict[str, Any], str]:
    rlcard, version = _import_rlcard_or_exit()
    rng = random.Random(game_seed)
    env = rlcard.make("doudizhu", config={"seed": game_seed, "allow_step_back": False})
    state, player_id = env.reset()
    events: List[Dict[str, Any]] = []
    cumulative = 0
    raw_actions: List[str] = []

    while not _is_env_over(env):
        legal_actions = _extract_legal_actions(state)
        if not legal_actions:
            raise RuntimeError(f"RLCard returned no legal actions for player {player_id}")

        action = rng.choice(legal_actions)
        raw_action = _decode_action(env, state, action)
        cards = normalize_action_cards(raw_action)
        is_pass = str(raw_action).strip().lower() in PASS_ALIASES
        played_count = 0 if is_pass else len(cards)
        cumulative += played_count
        event = {
            "index": len(events),
            "player": SEAT_ROLE_MAP.get(int(player_id), f"player_{player_id}") if _is_int_like(player_id) else f"player_{player_id}",
            "action": "pass" if is_pass else "play",
            "cards": cards,
            "pattern": classify_pattern(cards, is_pass=is_pass),
            "rawAction": raw_action,
            "playedCardCount": played_count,
            "cumulativePlayedCardCount": cumulative,
        }
        events.append(event)
        raw_actions.append(raw_action)
        state, player_id = env.step(action)

    build_inventory_snapshots(events)
    metadata = {
        "rlcardVersion": version,
        "seatMapping": {
            "0": "landlord",
            "1": "farmer_left",
            "2": "farmer_right",
        },
        "seatMappingNote": (
            "Best-effort mapping for RLCard Doudizhu seat ids. If a future RLCard "
            "version exposes explicit roles, prefer that metadata over this assumption."
        ),
        "rawActionCount": len(raw_actions),
        "finalCumulativePlayedCardCount": cumulative,
    }
    return events, metadata, version


def _import_rlcard_or_exit() -> Tuple[Any, str]:
    try:
        import rlcard  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: rlcard.\n"
            "Install it with:\n"
            "  python3 -m pip install -r requirements-doudizhu.txt\n"
            "Then rerun this generator."
        ) from exc

    try:
        version = importlib.metadata.version("rlcard")
    except importlib.metadata.PackageNotFoundError:
        version = getattr(rlcard, "__version__", "unknown")
    return rlcard, version


def _extract_legal_actions(state: Mapping[str, Any]) -> List[Any]:
    legal_actions = state.get("legal_actions", [])
    if isinstance(legal_actions, Mapping):
        return list(legal_actions.keys())
    return list(legal_actions)


def _decode_action(env: Any, state: Mapping[str, Any], action: Any) -> str:
    legal_actions = state.get("legal_actions", {})
    if isinstance(legal_actions, Mapping):
        mapped = legal_actions.get(action)
        if isinstance(mapped, str):
            return mapped

    raw_legal_actions = state.get("raw_legal_actions")
    if isinstance(raw_legal_actions, Mapping) and action in raw_legal_actions:
        return str(raw_legal_actions[action])

    for decoder_name in ("_decode_action", "decode_action"):
        decoder = getattr(env, decoder_name, None)
        if callable(decoder):
            try:
                return str(decoder(action))
            except Exception:
                pass

    try:
        from rlcard.games.doudizhu.utils import ID_2_ACTION  # type: ignore

        if isinstance(action, int) and 0 <= action < len(ID_2_ACTION):
            return str(ID_2_ACTION[action])
    except Exception:
        pass

    if isinstance(raw_legal_actions, Sequence) and not isinstance(raw_legal_actions, (str, bytes)):
        if action in raw_legal_actions:
            return str(action)
        if isinstance(action, int) and 0 <= action < len(raw_legal_actions):
            return str(raw_legal_actions[action])

    return str(action)


def _is_env_over(env: Any) -> bool:
    is_over = getattr(env, "is_over", None)
    if callable(is_over):
        return bool(is_over())
    return bool(is_over)


def _is_int_like(value: Any) -> bool:
    try:
        int(value)
        return True
    except (TypeError, ValueError):
        return False


def build_samples(games: int, seed: int) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    rng = random.Random(seed)
    samples: List[Dict[str, Any]] = []
    skipped: Dict[str, int] = {level: 0 for level in SLICE_TARGETS}
    dependency_version = None

    for game_number in range(1, games + 1):
        game_seed = rng.randrange(0, 2**31)
        game_id = f"game_{game_number:06d}"
        events, game_metadata, dependency_version = generate_events_with_rlcard(game_seed)
        game_metadata = {**game_metadata, "gameSeed": game_seed}

        for level, target in SLICE_TARGETS.items():
            if level == "L54":
                end_index = len(events) - 1
            else:
                end_index = choose_slice_end_index(events, target)
                if end_index is None:
                    skipped[level] += 1
                    continue
            samples.append(
                make_training_sample(
                    game_id=game_id,
                    level=level,
                    events=events,
                    target_played_count=target,
                    end_index=end_index,
                    seed=seed,
                    game_metadata=game_metadata,
                ),
            )

    samples_by_level = Counter(sample["level"] for sample in samples)
    manifest = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generator": Path(__file__).name,
        "source": "rlcard.make('doudizhu')",
        "gamesRequested": games,
        "seed": seed,
        "samplesWritten": len(samples),
        "samplesByLevel": {
            level: samples_by_level.get(level, 0)
            for level in SLICE_TARGETS
        },
        "skippedSlicesByLevel": skipped,
        "dependencyVersions": {"rlcard": dependency_version or "unknown"},
    }
    return samples, manifest


def write_outputs(samples: Sequence[Mapping[str, Any]], manifest: Mapping[str, Any], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    samples_path = out_dir / "samples.jsonl"
    with samples_path.open("w", encoding="utf-8") as handle:
        for sample in samples:
            handle.write(json.dumps(sample, ensure_ascii=False, sort_keys=True) + "\n")

    with (out_dir / "manifest.json").open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")

    (out_dir / "preview.md").write_text(render_preview(samples, manifest), encoding="utf-8")


def render_preview(samples: Sequence[Mapping[str, Any]], manifest: Mapping[str, Any], limit: int = 5) -> str:
    lines = [
        "# Doudizhu Training Data Preview",
        "",
        f"- Games requested: {manifest['gamesRequested']}",
        f"- Samples written: {manifest['samplesWritten']}",
        f"- Seed: {manifest['seed']}",
        f"- RLCard: {manifest['dependencyVersions']['rlcard']}",
        "",
    ]
    for sample in samples[:limit]:
        lines.extend(
            [
                f"## {sample['sampleId']}",
                "",
                f"- Level: {sample['level']} ({sample['observedPlayedCardCount']} played cards observed)",
                f"- Events: {len(sample['events'])}",
                f"- Remaining count: {sample['answers']['remainingCount']}",
                f"- Exhausted ranks: {', '.join(sample['answers']['exhaustedRanks']) or 'none'}",
                f"- Possible bomb ranks: {', '.join(sample['answers']['possibleBombRanks']) or 'none'}",
                "",
                "| # | Player | Action | Cards | Pattern | Played | Total |",
                "|---:|---|---|---|---|---:|---:|",
            ],
        )
        for event in sample["events"][:12]:
            cards = " ".join(event["cards"]) if event["cards"] else "-"
            lines.append(
                f"| {event['index']} | {event['player']} | {event['action']} | {cards} | "
                f"{event['pattern']} | {event['playedCardCount']} | {event['cumulativePlayedCardCount']} |",
            )
        if len(sample["events"]) > 12:
            lines.append(f"| ... | ... | ... | ... | ... | ... | ... |")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate RLCard Doudizhu JSONL training data.")
    parser.add_argument("--games", type=int, default=10, help="number of complete RLCard games to generate")
    parser.add_argument("--seed", type=int, default=42, help="master random seed")
    parser.add_argument("--out-dir", type=Path, default=Path("generated/doudizhu"), help="output directory")
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    if args.games <= 0:
        raise SystemExit("--games must be greater than 0")
    samples, manifest = build_samples(args.games, args.seed)
    write_outputs(samples, manifest, args.out_dir)
    print(f"Wrote {manifest['samplesWritten']} samples to {args.out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
