import unittest
from unittest.mock import patch
import json

from scripts.generate_doudizhu_rlcard import (
    _decode_action,
    build_inventory_snapshots,
    build_samples,
    classify_pattern,
    choose_slice_end_index,
    create_initial_inventory,
    generate_events_with_rlcard,
    make_training_sample,
)


class DoudizhuGeneratorHelperTest(unittest.TestCase):
    def test_decode_action_prefers_environment_decoder_for_integer_action_ids(self):
        class FakeEnv:
            def _decode_action(self, action_id):
                return {4: "7"}[action_id]

        state = {
            "legal_actions": {4: object()},
            "raw_legal_actions": ["3", "4", "5", "6", "6789TJ"],
        }

        self.assertEqual(_decode_action(FakeEnv(), state, 4), "7")

    def test_rlcard_seed_42_first_game_generates_consistent_inventory(self):
        try:
            import rlcard  # noqa: F401
        except ImportError:
            self.skipTest("rlcard is not installed")

        events, metadata, version = generate_events_with_rlcard(478163327)

        self.assertGreater(len(events), 0)
        build_inventory_snapshots(events)
        self.assertEqual(
            metadata["finalCumulativePlayedCardCount"],
            sum(event["playedCardCount"] for event in events),
        )
        self.assertLessEqual(metadata["finalCumulativePlayedCardCount"], 54)
        self.assertEqual(version, "1.2.0")

    def test_inventory_snapshots_subtract_played_cards_and_validate_counts(self):
        events = [
            {
                "index": 0,
                "action": "play",
                "cards": ["A", "A"],
                "playedCardCount": 2,
                "cumulativePlayedCardCount": 2,
            },
            {
                "index": 1,
                "action": "pass",
                "cards": [],
                "playedCardCount": 0,
                "cumulativePlayedCardCount": 2,
            },
            {
                "index": 2,
                "action": "play",
                "cards": ["BJ", "RJ", "2"],
                "playedCardCount": 3,
                "cumulativePlayedCardCount": 5,
            },
        ]

        snapshots = build_inventory_snapshots(events)

        self.assertEqual(snapshots[0]["A"], 2)
        self.assertEqual(snapshots[1]["A"], 2)
        self.assertEqual(snapshots[2]["BJ"], 0)
        self.assertEqual(snapshots[2]["RJ"], 0)
        self.assertEqual(snapshots[2]["2"], 3)

        with self.assertRaisesRegex(ValueError, "negative inventory"):
            build_inventory_snapshots(
                [
                    {
                        "index": i,
                        "action": "play",
                        "cards": ["BJ"],
                        "playedCardCount": 1,
                        "cumulativePlayedCardCount": i + 1,
                    }
                    for i in range(2)
                ],
            )

    def test_choose_slice_end_index_preserves_complete_events(self):
        events = [
            {"index": 0, "cumulativePlayedCardCount": 6},
            {"index": 1, "cumulativePlayedCardCount": 12},
            {"index": 2, "cumulativePlayedCardCount": 17},
            {"index": 3, "cumulativePlayedCardCount": 28},
        ]

        self.assertEqual(choose_slice_end_index(events, 13), 2)
        self.assertEqual(choose_slice_end_index(events, 26), 3)
        self.assertIsNone(choose_slice_end_index(events, 54))

    def test_rocket_classification_is_order_independent(self):
        self.assertEqual(classify_pattern(["BJ", "RJ"]), "rocket")
        self.assertEqual(classify_pattern(["RJ", "BJ"]), "rocket")

    def test_build_samples_manifest_is_json_serializable(self):
        events = [
            {
                "index": 0,
                "player": "landlord",
                "action": "play",
                "cards": ["A"] * 4,
                "pattern": "bomb",
                "rawAction": "AAAA",
                "playedCardCount": 4,
                "cumulativePlayedCardCount": 4,
            },
            {
                "index": 1,
                "player": "farmer_left",
                "action": "play",
                "cards": ["K"] * 4,
                "pattern": "bomb",
                "rawAction": "KKKK",
                "playedCardCount": 4,
                "cumulativePlayedCardCount": 8,
            },
        ]

        with patch(
            "scripts.generate_doudizhu_rlcard.generate_events_with_rlcard",
            return_value=(events, {"source": "unit"}, "test-version"),
        ):
            samples, manifest = build_samples(games=1, seed=42)

        self.assertEqual(len(samples), 1)
        self.assertEqual(samples[0]["level"], "L54")
        self.assertEqual(samples[0]["sliceEndEventIndex"], 1)
        self.assertEqual(samples[0]["observedPlayedCardCount"], 8)
        self.assertEqual(len(samples[0]["events"]), 2)
        self.assertEqual(manifest["samplesByLevel"], {"L13": 0, "L26": 0, "L54": 1})
        json.dumps(manifest)

    def test_make_training_sample_computes_questions_from_slice(self):
        events = [
            {
                "index": 0,
                "player": "landlord",
                "action": "play",
                "cards": ["A", "A", "A", "A"],
                "pattern": "bomb",
                "rawAction": "AAAA",
                "playedCardCount": 4,
                "cumulativePlayedCardCount": 4,
            },
            {
                "index": 1,
                "player": "farmer_left",
                "action": "play",
                "cards": ["BJ"],
                "pattern": "single",
                "rawAction": "BJ",
                "playedCardCount": 1,
                "cumulativePlayedCardCount": 5,
            },
        ]

        sample = make_training_sample(
            game_id="game_000001",
            level="L13",
            events=events,
            target_played_count=13,
            end_index=1,
            seed=42,
            game_metadata={"source": "unit"},
        )

        self.assertEqual(sample["sampleId"], "game_000001_L13")
        self.assertEqual(sample["observedPlayedCardCount"], 5)
        self.assertEqual(sample["answers"]["remainingCount"]["A"], 0)
        self.assertEqual(sample["answers"]["remainingCount"]["BJ"], 0)
        self.assertIn("A", sample["answers"]["exhaustedRanks"])
        self.assertNotIn("A", sample["answers"]["possibleBombRanks"])
        self.assertIn("K", sample["answers"]["possibleBombRanks"])
        self.assertEqual(sample["inventorySnapshots"][-1]["BJ"], 0)

    def test_create_initial_inventory_matches_doudizhu_deck_counts(self):
        inventory = create_initial_inventory()

        self.assertEqual(inventory["3"], 4)
        self.assertEqual(inventory["A"], 4)
        self.assertEqual(inventory["2"], 4)
        self.assertEqual(inventory["BJ"], 1)
        self.assertEqual(inventory["RJ"], 1)
        self.assertEqual(sum(inventory.values()), 54)


if __name__ == "__main__":
    unittest.main()
