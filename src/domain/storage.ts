import type { PaoMappingOverride } from "./pao";
import type { CardInstance } from "./cards";
import type { CardSkillStats, ScoringResult } from "./scoring";

const SCHEMA_VERSION = 1;

export interface UserPreferences {
  activePaoTemplateId: string;
  activeGameProfileId: string;
  currentDifficultyLevel: string;
  maxStoredSessions?: number;
}

export interface ExerciseAttempt {
  id: string;
  sessionId: string;
  stepId?: string;
  attemptIndex: number;
  actualCardIds?: string[];
  startedAt: string;
  submittedAt: string;
}

export interface TrainingSession {
  id: string;
  definition: Record<string, unknown>;
  generatedCards: CardInstance[];
  generatorVersion: string;
  startedAt: string;
  completedAt?: string;
  attempts: ExerciseAttempt[];
  scoringResults: ScoringResult[];
}

export interface PersistedAppState {
  schemaVersion: number;
  paoOverrides: PaoMappingOverride[];
  sessions: TrainingSession[];
  cardSkillStats: CardSkillStats[];
  userPreferences: UserPreferences;
}

export interface ListSessionsOptions {
  cursor?: number;
  limit?: number;
}

export interface ListSessionsResult {
  items: TrainingSession[];
  nextCursor: number | null;
}

export interface Repository {
  getState(): PersistedAppState;
  savePaoOverride(override: PaoMappingOverride): void;
  removePaoOverride(faceId: string): void;
  saveSession(session: TrainingSession): void;
  listSessions(options?: ListSessionsOptions): ListSessionsResult;
  saveCardSkillStats(stats: CardSkillStats[]): void;
  savePreferences(preferences: Partial<UserPreferences>): void;
  exportState(): string;
  importState(nextState: string | Partial<PersistedAppState>): void;
}

const DEFAULT_STATE: PersistedAppState = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  paoOverrides: [],
  sessions: [],
  cardSkillStats: [],
  userPreferences: Object.freeze({
    activePaoTemplateId: "default_zh_v1",
    activeGameProfileId: "generic",
    currentDifficultyLevel: "L1",
    maxStoredSessions: 100,
  }),
});

export function createMemoryRepository(
  initialState: Partial<PersistedAppState> = DEFAULT_STATE,
): Repository {
  let state = cloneState(initialState);
  return createRepositoryAdapter({
    read: () => state,
    write: (nextState) => {
      state = cloneState(nextState);
    },
  });
}

export function createLocalStorageRepository(
  storage = globalThis.localStorage,
  key = "card-memory-training-state",
): Repository {
  return createRepositoryAdapter({
    read: () => {
      const raw = storage.getItem(key);
      return raw ? migrateState(JSON.parse(raw) as Partial<PersistedAppState>) : cloneState(DEFAULT_STATE);
    },
    write: (nextState) => {
      storage.setItem(key, JSON.stringify(nextState));
    },
  });
}

function createRepositoryAdapter(driver: {
  read: () => PersistedAppState;
  write: (state: PersistedAppState) => void;
}): Repository {
  return {
    getState() {
      return cloneState(driver.read());
    },

    savePaoOverride(override) {
      const state = cloneState(driver.read());
      state.paoOverrides = [
        ...state.paoOverrides.filter((entry) => entry.faceId !== override.faceId),
        override,
      ];
      driver.write(state);
    },

    removePaoOverride(faceId) {
      const state = cloneState(driver.read());
      state.paoOverrides = state.paoOverrides.filter(
        (entry) => entry.faceId !== faceId,
      );
      driver.write(state);
    },

    saveSession(session) {
      const state = cloneState(driver.read());
      const maxStoredSessions = state.userPreferences.maxStoredSessions ?? 100;
      state.sessions = [
        ...state.sessions.filter((entry) => entry.id !== session.id),
        session,
      ].slice(-maxStoredSessions);
      driver.write(state);
    },

    listSessions({ cursor = 0, limit = 20 } = {}) {
      const sessions = cloneState(driver.read()).sessions;
      const items = sessions.slice(cursor, cursor + limit);
      const nextCursor =
        cursor + items.length < sessions.length ? cursor + items.length : null;
      return { items, nextCursor };
    },

    saveCardSkillStats(stats) {
      const state = cloneState(driver.read());
      const keys = new Set(stats.map(statKey));
      state.cardSkillStats = [
        ...state.cardSkillStats.filter((entry) => !keys.has(statKey(entry))),
        ...stats,
      ];
      driver.write(state);
    },

    savePreferences(preferences) {
      const state = cloneState(driver.read());
      state.userPreferences = {
        ...state.userPreferences,
        ...preferences,
      };
      driver.write(state);
    },

    exportState() {
      return JSON.stringify(driver.read(), null, 2);
    },

    importState(nextState) {
      const parsed =
        typeof nextState === "string" ? JSON.parse(nextState) : nextState;
      driver.write(migrateState(parsed as Partial<PersistedAppState>));
    },
  };
}

function migrateState(state: Partial<PersistedAppState>): PersistedAppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    paoOverrides: state.paoOverrides ?? [],
    sessions: state.sessions ?? [],
    cardSkillStats: state.cardSkillStats ?? [],
    userPreferences: {
      ...DEFAULT_STATE.userPreferences,
      ...(state.userPreferences ?? {}),
    },
  };
}

function cloneState(state: Partial<PersistedAppState>): PersistedAppState {
  return JSON.parse(JSON.stringify(migrateState(state))) as PersistedAppState;
}

function statKey(stat: CardSkillStats): string {
  return `${stat.entityType}:${stat.entityId}:${stat.profileId ?? ""}:${
    stat.mode ?? ""
  }`;
}
