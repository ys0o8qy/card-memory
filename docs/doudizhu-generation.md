# Doudizhu RLCard Training Data Generation

This project treats Doudizhu memory training data as legal play-event sequences, not raw shuffled card order. The offline generator uses RLCard to run complete legal random-policy Doudizhu games, then slices each game by whole play events for memory-load levels.

## Install

```bash
python3 -m pip install -r requirements-doudizhu.txt
```

RLCard is only required for generation. The React/Vite app does not import RLCard or any Python package.

## Generate

```bash
python3 scripts/generate_doudizhu_rlcard.py --games 10 --seed 42 --out-dir generated/doudizhu
```

Outputs:

- `samples.jsonl`: one machine-readable `TrainingSample` per game slice.
- `preview.md`: compact human-readable preview for the first few samples.
- `manifest.json`: generation metadata, sample counts, seed, and RLCard version.

The default output directory is `generated/doudizhu`. The repository ignores `generated/` so larger generated datasets are not accidentally committed.

## Slice Levels

- `L13`: earliest complete event where cumulative played card count is at least 13.
- `L26`: earliest complete event where cumulative played card count is at least 26.
- `L54`: full generated game. Doudizhu games can finish before all 54 cards are played, so this level represents complete-game context rather than forcibly cutting at exactly 54 played cards.

Slices never cut through a move. If a game ends before `L13` or `L26`, that slice is skipped.

## Event Shape

Each play event contains:

- `index`
- `player`: `landlord`, `farmer_left`, `farmer_right`, or fallback `player_0` style labels.
- `action`: `play` or `pass`
- `cards`: normalized ranks: `3,4,5,6,7,8,9,10,J,Q,K,A,2,BJ,RJ`
- `pattern`: simple classification such as `single`, `pair`, `bomb`, `rocket`, `pass`, or fallback `raw_rlcard_action`
- `rawAction`
- `playedCardCount`
- `cumulativePlayedCardCount`

The generator currently uses a best-effort RLCard seat mapping of player `0` as landlord, player `1` as left farmer, and player `2` as right farmer. The mapping note is included in each sample's game metadata because this should be treated as a data-generation convention unless a future RLCard version exposes explicit role metadata.

## Answers

For each slice, the generator computes inventory snapshots from the full Doudizhu deck minus all cards played up to each event:

- ranks `3` through `A` and `2` start at `4`
- `BJ` and `RJ` start at `1`
- negative inventory raises an error

Training answers include:

- `remainingCount` for deterministic ranks `A`, `2`, `BJ`, `RJ` plus ranks touched in the slice
- `exhaustedRanks`
- `possibleBombRanks`, defined as standard ranks with remaining count equal to `4`

## Test Helpers Without RLCard

The inventory and slicing helpers are stdlib-testable without RLCard:

```bash
python3 -m unittest tests/test_doudizhu_generator.py
```
