# Card Memory Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for task-by-task execution, and run fresh verification before claiming completion.

**Goal:** Implement the PAO card-memory training tool described in `docs/superpowers/specs/2026-06-10-card-memory-training-design.md`.

**Architecture:** Use React + TypeScript on Vite for the interactive app. Keep card, PAO, scoring, recommendation, and persistence logic in small domain modules under `src/domain/`; keep training-flow orchestration in React components. Persistence is isolated behind a repository interface with `localStorage` and in-memory implementations.

**Tech Stack:** TypeScript, React, Vite, Vitest, native CSS.

## File Structure

- `package.json`: Vite, TypeScript, React, Vitest scripts.
- `index.html`: Vite root document.
- `src/main.tsx`: React root bootstrap.
- `src/App.tsx`: app navigation, training flows, PAO editing, progress views.
- `src/styles.css`: restrained training-tool UI styles.
- `src/domain/cards.ts`: card catalog, deck spec resolution, card instances, shuffling.
- `src/domain/pao.ts`: default PAO template and override resolution.
- `src/domain/scoring.ts`: sequence scoring, remaining-card calculation, training recommendation helper.
- `src/domain/storage.ts`: repository interface, localStorage repository, in-memory fallback.
- `tests/domain.test.ts`: Vitest domain tests for deck generation, scoring, PAO overrides, remaining cards, recommendations.

## Task 1: Domain Tests

**Files:**
- `tests/domain.test.ts`
- `package.json`
- `vite.config.ts`

- [x] Write Vitest tests covering standard 54-card decks, two-deck expansion, no-joker deck specs, sequence scoring, remaining cards, PAO overrides, recommendations, and repository persistence.
- [x] Verify the tests fail before the domain modules exist or before their APIs are implemented.
- [x] Keep tests focused on behavior, not UI implementation details.

## Task 2: Domain Implementation

**Files:**
- `src/domain/cards.ts`
- `src/domain/pao.ts`
- `src/domain/scoring.ts`
- `src/domain/storage.ts`

- [x] Implement immutable card-face catalog and deck specs that can support one-deck and two-deck training.
- [x] Implement PAO defaults, user overrides, and source tracking.
- [x] Implement sequence scoring with correct, missing, extra, and misplaced card buckets.
- [x] Implement remaining-card summary and rank-count question generation.
- [x] Implement repository interface with localStorage persistence and memory fallback.

## Task 3: React Training UI

**Files:**
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/styles.css`
- `src/vite-env.d.ts`

- [x] Build the React app shell with Today, Train, PAO, and Progress views.
- [x] Implement the default training path: 5-card PAO demo, 13-card sequence study, recall, result, and next-step guidance.
- [x] Add 27-card and 54-card sequence training entries for progressive difficulty.
- [x] Add remaining-card practice for rank-count recall.
- [x] Add PAO table editing and reset-to-default behavior.
- [x] Persist PAO overrides, sessions, preferences, and weak-card stats through the repository layer.

## Task 4: Verification

**Files:**
- `src/**/*.ts`
- `src/**/*.tsx`
- `tests/**/*.ts`
- `index.html`
- `package.json`
- `vite.config.ts`

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Scan for stale vanilla-DOM entry references and old mounting patterns.
- [x] Start Vite dev server and confirm key resources return HTTP 200.

## Current Follow-Ups

- Add browser-level interaction tests once a browser automation tool is available.
- Split `src/App.tsx` into view-specific components when the UI grows beyond the current MVP.
- Add explicit game profiles for Dou Dizhu, Shengji, and Guandan after the base one-deck training loop is stable.
