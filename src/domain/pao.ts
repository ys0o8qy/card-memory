import { CARD_FACE_CATALOG, labelForFace, type Rank, type Suit } from "./cards";

export interface PaoTemplateEntry {
  faceId: string;
  persona: string;
  action: string;
  object: string;
}

export interface PaoTemplate {
  id: string;
  version: number;
  mappings: readonly PaoTemplateEntry[];
}

export interface PaoMappingOverride extends PaoTemplateEntry {
  note?: string;
  templateId: string;
  templateVersion: number;
  updatedAt: string;
}

export interface ResolvedPaoMapping extends PaoTemplateEntry {
  note?: string;
  source: "template" | "custom";
}

const PERSONAS_BY_RANK: Record<Rank, string> = {
  A: "航海家",
  2: "魔术师",
  3: "画家",
  4: "厨师",
  5: "侦探",
  6: "医生",
  7: "歌手",
  8: "运动员",
  9: "工程师",
  10: "宇航员",
  J: "骑士",
  Q: "女王",
  K: "国王",
  small_joker: "小丑",
  big_joker: "巨人",
};

const ACTIONS_BY_SUIT: Record<Suit, string> = {
  spade: "挥动",
  heart: "拥抱",
  diamond: "打磨",
  club: "敲击",
  joker: "变出",
};

const OBJECTS_BY_SUIT: Record<Suit, string> = {
  spade: "长剑",
  heart: "玫瑰",
  diamond: "钻石",
  club: "木槌",
  joker: "礼帽",
};

export const DEFAULT_PAO_TEMPLATE: PaoTemplate = Object.freeze({
  id: "default_zh_v1",
  version: 1,
  mappings: Object.freeze(
    CARD_FACE_CATALOG.faces.map((face) =>
      Object.freeze({
        faceId: face.id,
        persona:
          face.suit === "joker"
            ? PERSONAS_BY_RANK[face.rank]
            : `${labelForFace(face.id)}${PERSONAS_BY_RANK[face.rank]}`,
        action: ACTIONS_BY_SUIT[face.suit],
        object: OBJECTS_BY_SUIT[face.suit],
      }),
    ),
  ),
});

export function resolvePaoMappings(
  template: PaoTemplate,
  overrides: readonly PaoMappingOverride[] = [],
): Map<string, ResolvedPaoMapping> {
  const resolved = new Map<string, ResolvedPaoMapping>();

  for (const entry of template.mappings) {
    resolved.set(entry.faceId, {
      ...entry,
      source: "template",
    });
  }

  for (const override of overrides) {
    resolved.set(override.faceId, {
      faceId: override.faceId,
      persona: override.persona,
      action: override.action,
      object: override.object,
      note: override.note,
      source: "custom",
    });
  }

  return resolved;
}

export function createPaoOverride(
  faceId: string,
  mapping: Pick<PaoTemplateEntry, "persona" | "action" | "object"> & {
    note?: string;
  },
  now = new Date(),
): PaoMappingOverride {
  return {
    faceId,
    persona: mapping.persona.trim(),
    action: mapping.action.trim(),
    object: mapping.object.trim(),
    note: mapping.note?.trim() || "",
    templateId: DEFAULT_PAO_TEMPLATE.id,
    templateVersion: DEFAULT_PAO_TEMPLATE.version,
    updatedAt: now.toISOString(),
  };
}
