# Lightweight UI Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight Storybook + Playwright UI automation for the card-memory trainer without strict pixel baseline checks.

**Architecture:** Export current React view components for story rendering, keep real app orchestration in `src/App.tsx`, and provide deterministic fixtures under `src/fixtures/`. Storybook renders isolated UI states for manual review; Playwright runs real browser smoke flows and writes screenshots to `test-results/lightweight-screenshots/` for human inspection.

**Tech Stack:** React, TypeScript, Vite, Storybook React Vite, Playwright.

---

## File Structure

- Modify `package.json`: add Storybook and Playwright scripts.
- Modify `.gitignore`: ignore Storybook build and Playwright output.
- Modify `src/App.tsx`: export pure view components and shared state types for stories.
- Create `src/fixtures/uiFixtures.ts`: deterministic cards, PAO mappings, scoring result, remaining-card exercise, repository state.
- Create `.storybook/main.ts`: Storybook React Vite config.
- Create `.storybook/preview.ts`: import app CSS and set fullscreen layout.
- Create `src/stories/AppViews.stories.tsx`: stories for Today, Train, PAO Table, PAO Editor, PAO Demo, Sequence Result, Remaining Question.
- Create `playwright.config.ts`: lightweight Playwright config using local Vite dev server.
- Create `tests/ui/app-smoke.spec.ts`: browser smoke tests and screenshots.

## Task 1: Tooling

- [x] Install Storybook React Vite and Playwright dev dependencies.
- [x] Add scripts: `storybook`, `build-storybook`, `test:ui`, `test:all`.
- [x] Ignore generated output: `storybook-static/`, `playwright-report/`, `test-results/`.

## Task 2: Storybook Fixtures And Stories

- [x] Export view components from `src/App.tsx`.
- [x] Add deterministic fixtures for common UI states.
- [x] Add stories for the key manual-review states.
- [x] Verify `npm run build-storybook`.

## Task 3: Lightweight UI Smoke Tests

- [x] Add Playwright config that serves Vite locally.
- [x] Add smoke flow for home page, PAO table, PAO demo, and PAO edit.
- [x] Save screenshots to `test-results/lightweight-screenshots/`.
- [x] Verify `npm run test:ui`.

## Task 4: Final Verification

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `npm run build-storybook`.
- [x] Run `npm run test:ui`.
