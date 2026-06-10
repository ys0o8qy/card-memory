# 扑克牌记忆训练工具 PRD / 架构设计

## 1. 背景

用户希望基于 PAO（Persona / Action / Object，人物 / 动作 / 物品）记忆法，训练自己在斗地主、升级、掼蛋等牌类游戏中记住出牌顺序和剩余牌状态。

这个产品的核心不是做一个普通 flashcard 工具，也不是一开始做完整牌类游戏模拟器，而是做一个“渐进式扑克牌记忆训练路径”。用户打开工具后应该能立即开始训练，先使用系统默认 PAO 映射，再根据个人习惯逐步修改映射。

第一版聚焦一副 54 张牌，但数据模型和训练配置必须为两副牌、游戏规则 Profile、主牌、级牌和重复牌计数预留扩展空间。

## 2. 产品定位

### 2.1 一句话定位

一个以 PAO 为编码方法、以训练路径为核心的扑克牌记忆训练器，帮助用户从短序列开始，逐步训练到整副牌顺序回忆和实战剩余牌判断。

### 2.2 核心用户价值

- 快速建立 54 张牌的默认 PAO 记忆编码。
- 从 13 张牌开始逐步提高训练强度，降低上手难度。
- 同时训练“顺序记忆”和“剩余牌判断”，贴近真实牌局。
- 在训练过程中发现不顺手的 PAO 映射，并支持个性化修改。
- 为未来两副牌和斗地主 / 升级 / 掼蛋等游戏化训练模式打基础。

## 3. 目标与非目标

### 3.1 MVP 目标

第一版需要支持：

1. 一副 54 张扑克牌训练，包括 52 张普通牌和大小王。
2. 默认 PAO 表，每张牌都有默认人物、动作、物品。
3. PAO 表可查看、搜索、编辑和恢复默认值。
4. PAO 熟悉训练：看到牌后回忆对应 PAO。
5. 顺序记忆训练：展示一段牌序，用户按顺序还原。
6. 剩余牌判断训练：展示已出牌，用户判断剩余牌或关键牌状态。
7. 渐进式难度：从 13 张开始，逐步增加到 27、36、54 张。
8. 训练结果记录：准确率、错位、遗漏、重复、耗时、常错牌。
9. 数据结构预留两副牌扩展能力。

### 3.2 MVP 产品边界

MVP 的产品体验必须保持“训练路径优先”，不要把架构扩展能力直接暴露成复杂配置。

原则：

1. 首次打开后，用户应该能在 30 秒内开始第一组 13 张训练。
2. 默认使用 `generic` Profile 和完整一副牌，不要求用户理解 DeckSpec、Game Profile、评分策略等概念。
3. 高级配置收在“自定义训练”入口，不出现在今日训练主路径。
4. PAO 编辑是辅助能力，不作为首次训练前置步骤。
5. 每次训练结束必须给出下一步建议，例如“继续 13 张限时训练”或“先复习 3 张常错牌”。
6. 架构预留能力不能阻塞首个可用训练闭环，复杂能力应按交付切片逐步开放。

### 3.3 MVP 交付切片

为控制范围，MVP 按可用闭环拆成三个切片：

| 切片 | 目标 | 必须包含 | 暂不包含 |
| --- | --- | --- | --- |
| M1 | 用户能完成第一组训练 | 默认 PAO、5 张 PAO 快速演示、13 张不限时顺序训练、结果页、单张 PAO 修改入口 | 剩余牌题、完整统计、混合训练 |
| M2 | 用户能渐进训练 | PAO 熟悉、13 / 27 / 36 / 54 张顺序训练、今日训练推荐、常错牌 | 游戏专项 Profile、两副牌 UI |
| M3 | 用户能练实战记牌 | 剩余牌判断、关键牌题、PlayEvent 出牌流、基础进度统计 | 完整斗地主 / 掼蛋 / 升级规则 |

首个可用版本优先交付 M1。M2 / M3 属于同一 MVP 范围，但不应阻塞 M1 验证。

### 3.4 非目标

第一版不做：

1. 完整斗地主、掼蛋、升级规则引擎。
2. 自动识别真实牌桌、拍照识牌或视频识别。
3. 多人在线对战。
4. 高复杂度记忆宫殿编辑器。
5. 社交排行榜。
6. 云端账号和跨设备同步。

这些能力可以作为后续阶段扩展，但不应阻塞第一版训练闭环。

## 4. 核心训练路径

训练路径优先于配置管理。用户首次进入工具时，系统应直接提供推荐训练，而不是要求先手动配置 PAO 表。

训练路径分为两种入口：

- **今日训练**：系统推荐的下一组训练，面向日常使用。
- **自由练习**：用户手动选择训练模式和难度，面向探索和专项练习。

默认体验以今日训练为主，自由练习不应干扰主路径。

### 4.1 阶段 1：PAO 熟悉

目标：建立牌面到 PAO 的即时反应。

流程：

1. 系统展示一张牌。
2. 用户在脑中回忆人物、动作、物品。
3. 用户点击显示答案。
4. 用户标记“记住 / 模糊 / 不记得”。
5. 系统记录熟悉度和反应时间。

训练结果用于发现薄弱牌面，并影响后续复习频率。

### 4.2 阶段 2：13 张短序列

目标：学习把短牌序编码成连续画面。

流程：

1. 系统随机展示 13 张牌。
2. 初始阶段不限时，后续可设置每张展示时间。
3. 用户完成记忆后进入回忆页面。
4. 用户通过点选牌面或拖拽排序还原顺序。
5. 系统评分：正确牌、顺序错位、遗漏、重复、耗时。

13 张是第一版的起点，因为它足够短，适合建立编码流程和训练信心。它不是为了对应某个具体游戏的固定手牌数量；斗地主、升级、掼蛋等游戏的手牌规模会在后续 Game Profile 中单独建模。

### 4.3 阶段 3：27 / 36 张中长序列

目标：提高工作记忆压力，并引入漏牌和剩余牌判断。

流程：

1. 系统展示 27 或 36 张牌。
2. 用户完成顺序回忆。
3. 系统额外提问：
   - 哪些牌没有出现？
   - 某个点数还剩几张？
   - 大小王、2、A、K 是否还在？

这个阶段开始连接“记住顺序”和“牌局判断”。

### 4.4 阶段 4：54 张整副牌

目标：完整一副牌顺序回忆。

流程：

1. 系统展示完整 54 张牌。
2. 用户还原完整顺序。
3. 系统展示详细评分：
   - 完全正确数量。
   - 位置正确数量。
   - 相对顺序正确度。
   - 错位距离。
   - 遗漏牌。
   - 重复选择。
   - 总耗时。

这个阶段更接近竞技记忆训练，但仍然服务于实战牌局能力。

### 4.5 阶段 5：实战记牌训练

目标：模拟真实出牌流，训练“已经出过什么、还剩什么、关键牌是否还在”。

第一版不实现完整游戏规则，但可以生成通用出牌流：

1. 单张连续出牌。
2. 按小组展示，例如每轮 1 到 5 张。
3. 随机插入对子、三张、顺子等简单组合。
4. 出牌后提问：
   - 某张牌是否已经出现？
   - 某点数还剩几张？
   - 大小王是否还在？
   - 是否还存在多张同点数或炸弹风险？

后续可以基于 Game Profile 扩展为斗地主、升级、掼蛋专项训练。

## 5. 难度系统

难度不设计成单一等级，而是由多个维度组合。

### 5.1 难度维度

| 维度 | MVP 值 | 后续扩展 |
| --- | --- | --- |
| 牌量 | 13 / 27 / 36 / 54 | 18 / 40 / 108 |
| 展示速度 | 不限时 / 3 秒 / 1 秒 | 连续播放 / 加速模式 |
| 回忆方式 | 点选 / 排序 | 手动输入 / 语音 |
| 考核目标 | 顺序 / 剩余牌 | 组合识别 / 风险判断 |
| 牌组范围 | 完整一副牌 | 单花色 / 双花色 / 去王 |
| 游戏 Profile | 通用 | 斗地主 / 升级 / 掼蛋 |

### 5.2 推荐等级

| 等级 | 牌量 | 速度 | 训练目标 |
| --- | --- | --- | --- |
| L1 | 13 | 不限时 | PAO 熟悉 + 简单顺序 |
| L2 | 13 | 3 秒 / 张 | 顺序回忆 |
| L3 | 27 | 3 秒 / 张 | 顺序 + 漏牌 |
| L4 | 36 | 1 秒 / 张 | 顺序 + 关键牌 |
| L5 | 54 | 不限时 | 完整牌序 |
| L6 | 54 | 3 秒 / 张 | 完整牌序 + 剩余牌 |
| L7 | 54 | 1 秒 / 张 | 实战压力 |

系统可以先开放手动选择难度，后续再做自动晋级。

### 5.3 晋级规则

第一版可以手动选择难度，但产品上仍需要定义推荐晋级规则，用于今日训练给出下一步建议。

建议规则：

| 当前阶段 | 晋级条件 | 未达标建议 |
| --- | --- | --- |
| PAO 熟悉 | 最近 20 张熟悉度达到 85% | 复习“不记得 / 模糊”的牌 |
| 13 张不限时 | 连续 3 次顺序准确率 >= 80% | 继续 13 张不限时 |
| 13 张限时 | 连续 3 次顺序准确率 >= 85% | 降低速度或复习常错牌 |
| 27 张 | 连续 3 次顺序准确率 >= 80%，剩余牌题准确率 >= 70% | 拆回 13 张专项练习 |
| 36 张 | 连续 3 次综合准确率 >= 80% | 继续 27 / 36 张 |
| 54 张 | 完整牌序准确率 >= 75%，关键牌题准确率 >= 80% | 继续整副牌不限时 |

晋级规则只影响推荐，不阻止用户在自由练习里选择更高难度。

### 5.4 难度配置校验

难度配置必须经过 domain 层校验，避免 UI 组合出无效训练。

典型规则：

- `DeckSpec` 解析后的合法牌面数量决定最大 `cardCount`，例如一副完整牌为 54，去掉大小王为 52。
- `deckCount = 1` 时，最大 `cardCount` 为 `selectedFaceCount`；`deckCount = 2` 时最大为 `selectedFaceCount * 2`。
- `pao_familiarity` 不需要 `recallInputMode = sort_cards`。
- `remaining_cards` 需要有可计算的完整牌组和已出牌集合。
- Game Profile 可以限制或覆盖默认牌组，例如掼蛋默认两副牌。

校验结果应返回结构化错误，而不是只在 UI 中禁用按钮。这样未来 CLI、测试和其他入口都能复用相同规则。

## 6. 功能需求

### 6.1 今日训练

用户进入产品后的默认页面。

功能：

- 展示当前推荐训练。
- 展示最近准确率和连续训练天数。
- 一键开始训练。
- 显示当前训练阶段，例如“13 张短序列 L2”。
- 提供进入 PAO 表和训练模式的入口。
- 展示一个明确的训练后建议，例如“今天先练 13 张限时”。
- 展示最多 3 张常错牌，不在首屏展示完整统计。

### 6.2 训练模式

支持选择训练类型：

1. PAO 熟悉训练。
2. 顺序记忆训练。
3. 剩余牌判断训练。
4. 混合训练。

M1 阶段只需要开放 PAO 熟悉和顺序记忆。剩余牌判断在 M3 开放。混合训练作为后续增强，不阻塞 MVP 主路径。

训练前可配置：

- 牌量。
- 展示速度。
- 是否包含大小王。
- 回忆方式。
- 是否优先抽取薄弱牌。
- 游戏 Profile。
- 牌组规格。

默认训练模式只展示前四项。`Game Profile`、`牌组规格`、`策略相关配置` 放入高级设置，避免用户第一次使用时被架构概念打断。

### 6.3 PAO 表

默认提供 54 张牌映射。

每张牌包含：

- 牌面。
- Persona：人物。
- Action：动作。
- Object：物品。
- 可选备注。
- 熟悉度。
- 最近错误时间。

功能：

- 查看完整 PAO 表。
- 按花色 / 点数筛选。
- 搜索人物、动作、物品。
- 编辑单张牌映射。
- 恢复单张默认值。
- 恢复全部默认值。
- 标记“不顺手”，供系统后续提示优化。

### 6.4 顺序记忆训练

训练流程：

1. 生成训练牌序。
2. 展示牌序。
3. 用户进入回忆。
4. 用户点选或拖拽牌面还原。
5. 系统评分并展示复盘。

评分项：

- 完全正确率。
- 位置正确率。
- 相对顺序正确率。
- 遗漏牌。
- 重复牌。
- 错位距离。
- 总耗时。

结果页必须给出可行动复盘：

- 错误位置对照：期望牌、用户选择、错位距离。
- 遗漏牌和多选牌。
- 最多 3 张建议复习的牌。
- 进入“修改这张牌 PAO”的快捷入口。
- 下一步训练建议。

### 6.5 剩余牌判断训练

训练流程：

1. 系统展示一段已出牌序列。
2. 用户回答问题。
3. 系统评分并解释。

题型：

- 某张牌是否已出。
- 某张牌是否还在。
- 某点数还剩几张。
- 大小王是否还在。
- 2 / A / K 还剩几张。
- 是否还存在多张同点数或炸弹风险。

结果页必须解释答案来源，例如“红桃 A 已出，所以 A 还剩 3 张”。解释逻辑来自 domain 层的剩余牌计算结果，不在 UI 中临时推导。

### 6.6 进度统计

展示：

- 总训练次数。
- 最近 7 天训练次数。
- 各训练模式准确率。
- 当前难度等级。
- 常错牌。
- 最慢反应牌。
- PAO 熟悉度分布。

第一版可以本地存储，暂不做账号系统。

### 6.7 首次使用引导

首次使用不要求用户配置 PAO。

流程：

1. 展示一句简短说明：这是用 PAO 训练扑克牌记忆的工具。
2. 直接开始 5 张 PAO 熟悉演示。
3. 演示后进入 13 张不限时训练。
4. 训练结束展示结果和 1 个下一步建议。
5. 在结果页提供“修改这张牌的 PAO”入口，而不是提前要求用户维护整张 PAO 表。

目标是让用户先形成“看牌 -> 想 PAO -> 回忆”的闭环，再逐步理解配置项。

## 7. 数据模型

### 7.1 建模原则

数据模型需要服务长期演进，而不是只服务第一版 UI。

核心原则：

- 牌面目录和实体牌分离：`CardFaceCatalog` 只包含合法牌面，`CardFace` 表示“黑桃 A”，`CardInstance` 表示“第 1 副牌里的黑桃 A”。
- 题目定义、训练实例、用户作答、评分结果分离：这样后续可以升级评分算法、回放训练过程、重算历史结果。
- PAO 默认模板和用户修改分离：默认表升级时不能覆盖用户自定义内容。
- Game Profile 作为配置对象，而不是散落在代码里的字符串判断。
- 出牌流使用事件模型，避免后续加入斗地主、掼蛋、升级时重写训练核心。

### 7.2 CardFaceCatalog 与 DeckSpec

`CardFaceCatalog` 描述合法牌面全集，`DeckSpec` 描述如何从合法牌面中选择实体牌。不要通过 `includeSuits x includeRanks` 的笛卡尔积直接生成牌面，因为大小王不属于普通花色和点数组合，直接组合会产生 `spade_small_joker` 或 `joker_A` 这类非法牌面。

```ts
type CardSelector =
  | { type: "all" }
  | { type: "face_ids"; faceIds: string[] }
  | { type: "standard_cards"; suits?: StandardSuit[]; ranks?: StandardRank[] }
  | { type: "jokers"; ranks?: JokerRank[] };

interface CardFaceCatalog {
  version: string;
  faces: CardFace[];
}

interface DeckSpec {
  deckCount: number;       // MVP UI 默认 1，后续可为 2
  selectors: CardSelector[];
  excludedFaceIds?: string[];
}
```

第一版完整一副牌可表示为：

```ts
const standardDeckSpec: DeckSpec = {
  deckCount: 1,
  selectors: [{ type: "all" }],
};
```

生成牌组时，系统先从 `CardFaceCatalog.faces` 中解析 selector，得到合法 `CardFace[]`，再按 `deckCount` 创建 `CardInstance[]`。

### 7.3 CardFace

表示牌面，不代表实体牌。

```ts
type Suit = "spade" | "heart" | "diamond" | "club" | "joker";
type StandardSuit = "spade" | "heart" | "diamond" | "club";
type StandardRank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "J" | "Q" | "K";
type JokerRank = "small_joker" | "big_joker";
type Rank = StandardRank | JokerRank;

interface CardFace {
  id: string;          // spade_A, heart_10, joker_big
  suit: Suit;
  rank: Rank;
  displayName: string; // 黑桃A、红桃10、小王
  sortOrder: number;
}
```

### 7.4 CardInstance

表示一张实体牌。第一版只有 `deck_1`，未来两副牌会有 `deck_2`。

```ts
interface CardInstance {
  id: string;      // deck_1:spade_A
  deckId: string;  // deck_1
  faceId: string;  // spade_A
}
```

UI 在多数训练中可以只展示牌面；但存储、评分和剩余牌计算必须使用 `CardInstance.id`，避免两副牌时相同 `faceId` 无法区分。

### 7.5 PAO 模板与用户覆盖

PAO 映射绑定在 `CardFace` 上，而不是 `CardInstance` 上。两副牌里的两张黑桃 A 默认共享同一个 PAO。

默认映射不直接写入用户数据。系统保存默认模板，用户只保存覆盖项。

```ts
interface PaoTemplate {
  id: string;          // default_zh_v1
  version: number;
  mappings: PaoTemplateEntry[];
}

interface PaoTemplateEntry {
  faceId: string;
  persona: string;
  action: string;
  object: string;
}

interface PaoMappingOverride {
  faceId: string;
  persona: string;
  action: string;
  object: string;
  note?: string;
  templateId: string;
  templateVersion: number;
  updatedAt: string;
}

interface ResolvedPaoMapping {
  faceId: string;
  persona: string;
  action: string;
  object: string;
  note?: string;
  source: "template" | "custom";
}
```

恢复默认值时删除对应 `PaoMappingOverride`，再从当前模板解析。默认模板升级时，未修改的牌面自动使用新模板；已修改的牌面保持用户覆盖。

### 7.6 GameProfile

Game Profile 用配置对象和策略注册点表达训练重点，而不是只用字符串枚举。Profile 分为稳定定义和运行时参数：定义描述某个游戏支持什么，运行时参数描述某一局训练的可变设置，例如升级/掼蛋的级牌、主花色、百搭牌。

```ts
type GameProfileId = "generic" | "doudizhu" | "shengji" | "guandan";

interface GameProfileDefinition {
  id: GameProfileId;
  displayName: string;
  defaultDeckSpec: DeckSpec;
  keyRanks: Rank[];
  keyFaceIds: string[];
  enabledQuestionTypes: RemainingCardQuestionType[];
  strategyRefs: {
    patternClassifier: string;
    questionGenerator: string;
    scoringStrategy: string;
  };
}

interface GameProfileRuntimeConfig {
  profileId: GameProfileId;
  levelRank?: StandardRank;
  trumpSuit?: StandardSuit;
  wildFaceIds?: string[];
  bombThresholds?: number[]; // 掼蛋可为 [4, 5, 6, 7, 8]
  scoringWeights: {
    sequence: number;
    remainingCards: number;
    keyCards: number;
  };
}
```

MVP 只需要实现 `generic`，但训练生成、题目生成和评分都通过 `GameProfileDefinition + GameProfileRuntimeConfig` 读取配置。后续加入斗地主、升级、掼蛋时，应新增 profile 配置和必要的题目生成器 / 组合识别器 / 评分器，而不是在通用逻辑里堆分支。

### 7.7 ExerciseDefinition

`ExerciseDefinition` 表示一次训练题目的定义。它描述“要生成什么题”，不保存用户作答。

```ts
type TrainingMode =
  | "pao_familiarity"
  | "sequence_recall"
  | "remaining_cards"
  | "mixed";

type RecallInputMode = "reveal" | "select_cards" | "sort_cards";

interface BaseExerciseDefinition {
  id: string;
  mode: TrainingMode;
  deckSpec: DeckSpec;
  gameProfileId: GameProfileId;
  gameProfileRuntimeConfig?: GameProfileRuntimeConfig;
  focusWeakCards: boolean;
}

interface PaoFamiliarityDefinition extends BaseExerciseDefinition {
  mode: "pao_familiarity";
  cardCount: number;
  revealAnswerManually: boolean;
}

interface SequenceRecallDefinition extends BaseExerciseDefinition {
  mode: "sequence_recall";
  cardCount: number;
  revealSecondsPerCard?: number;
  recallInputMode: Extract<RecallInputMode, "select_cards" | "sort_cards">;
}

interface RemainingCardsDefinition extends BaseExerciseDefinition {
  mode: "remaining_cards";
  seenCardCount: number;
  revealSecondsPerCard?: number;
  questionTypes: RemainingCardQuestionType[];
}

interface MixedExerciseDefinition extends BaseExerciseDefinition {
  mode: "mixed";
  steps: ExerciseStepDefinition[];
}

type ExerciseDefinition =
  | PaoFamiliarityDefinition
  | SequenceRecallDefinition
  | RemainingCardsDefinition
  | MixedExerciseDefinition;

type ExerciseStepDefinition =
  | SequenceRecallStepDefinition
  | RemainingCardsStepDefinition;

interface SequenceRecallStepDefinition {
  stepId: string;
  mode: "sequence_recall";
  cardCount: number;
  revealSecondsPerCard?: number;
  recallInputMode: Extract<RecallInputMode, "select_cards" | "sort_cards">;
}

interface RemainingCardsStepDefinition {
  stepId: string;
  mode: "remaining_cards";
  seenCardCount: number;
  revealSecondsPerCard?: number;
  questionTypes: RemainingCardQuestionType[];
}
```

这样可以避免一个扁平 `TrainingConfig` 同时承载所有模式，减少未来无效字段和条件分支。

混合训练的全局 `deckSpec`、`gameProfileId`、`focusWeakCards` 放在外层，step 只保留模式特有参数，避免一个混合训练内部出现多个互相冲突的牌组或游戏配置。

### 7.8 TrainingSession

`TrainingSession` 表示一次训练实例。它保存题目快照，保证用户之后查看历史时，不受默认 PAO、Game Profile 或生成算法更新影响。

```ts
interface TrainingSession {
  id: string;
  definition: ExerciseDefinition;
  generatedCards: CardInstance[];
  playEvents?: PlayEvent[];
  generatedQuestions?: RemainingCardQuestion[];
  generatorVersion: string;
  startedAt: string;
  completedAt?: string;
  attempts: ExerciseAttempt[];
  scoringResults: ScoringResult[];
}
```

### 7.9 ExerciseAttempt

`ExerciseAttempt` 保存用户原始作答，不只保存聚合后的正确 / 错误集合。

```ts
interface ExerciseAttempt {
  id: string;
  sessionId: string;
  stepId?: string;
  attemptIndex: number;
  actualCardIds?: string[];
  answerResults?: RemainingCardAnswer[];
  familiarityMarks?: PaoFamiliarityMark[];
  startedAt: string;
  submittedAt: string;
}

interface PaoFamiliarityMark {
  cardId: string;
  mark: "remembered" | "vague" | "forgotten";
  elapsedMs: number;
}
```

保存原始作答后，系统可以在评分算法升级时重算历史，也可以做更细的错位分析。

### 7.10 ScoringResult

`ScoringResult` 是评分器输出。它可以缓存展示所需的聚合结果，但不应替代原始作答。

```ts
interface ScoringResult {
  attemptId: string;
  scoringVersion: string;
  accuracy: number;
  metrics: Record<string, number>;
  elapsedMs: number;
  correctCardIds: string[];
  missingCardIds: string[];
  extraCardIds: string[];
  misplacedCardIds: string[];
  averageDisplacement?: number;
  positionResults?: PositionResult[];
  questionResults?: RemainingCardQuestionResult[];
}

interface PositionResult {
  expectedCardId?: string;
  actualCardId?: string;
  expectedIndex?: number;
  actualIndex?: number;
  status: "correct" | "missing" | "misplaced" | "extra";
  displacement?: number;
}
```

### 7.11 剩余牌题目与作答

```ts
type RemainingCardQuestionType =
  | "card_seen"
  | "card_remaining"
  | "rank_remaining_count"
  | "key_card_remaining"
  | "n_of_kind_possible"
  | "bomb_possible";

interface RemainingCardQuestion {
  id: string;
  questionType: RemainingCardQuestionType;
  prompt: string;
  targetFaceId?: string;
  targetRank?: Rank;
  expectedAnswer: string | number | boolean;
}

interface RemainingCardAnswer {
  questionId: string;
  actualAnswer: string | number | boolean;
  answeredAt: string;
}

interface RemainingCardQuestionResult {
  questionId: string;
  questionType: RemainingCardQuestionType;
  expectedAnswer: string | number | boolean;
  actualAnswer: string | number | boolean;
  isCorrect: boolean;
}
```

### 7.12 PlayEvent

`PlayEvent` 表示“出牌流”中的一次事件。即使第一版没有真实玩家，也应该用事件表达已出牌，而不是只保存一条扁平牌序。

```ts
interface PlayPattern {
  type: string;          // single, pair, triple, straight, bomb 等
  length?: number;
  rank?: Rank;
  attachments?: PlayPattern[];
  metadata?: Record<string, string | number | boolean>;
  classifierVersion: string;
}

interface PlayEvent {
  id: string;
  roundIndex: number;
  seat?: "self" | "left" | "partner" | "right" | string;
  cardIds: string[];
  pattern: PlayPattern;
  shownAt?: string;
}
```

这样未来可以加入“谁出了什么牌”“这一轮出牌类型是什么”“是否可能还有炸弹”等实战问题。

### 7.13 CardSkillStats

用于支持薄弱牌抽样和进度统计。

```ts
interface CardSkillStats {
  entityType: "card_face" | "rank" | "pattern";
  entityId: string;      // faceId、rank 或 pattern type
  profileId?: GameProfileId;
  mode?: TrainingMode;
  familiarityLevel: number;  // 0-100
  seenCount: number;
  errorCount: number;
  averageReactionMs?: number;
  lastSeenAt?: string;
  lastErrorAt?: string;
  reviewWeight: number;
}
```

`focusWeakCards` 应基于 `CardSkillStats` 计算抽样权重，而不是在生成器里写临时规则。

### 7.14 TrainingPlan 与 TrainingRecommendation

今日训练和晋级规则属于 domain 层能力，不应写在 UI 页面里。

```ts
interface DifficultyLevelDefinition {
  id: string;             // L1, L2...
  displayName: string;
  exerciseDefinition: ExerciseDefinition;
  promotionCriteria: PromotionCriteria;
  fallbackLevelId?: string;
}

interface PromotionCriteria {
  windowSize: number;
  minMetrics: Record<string, number>; // sequenceAccuracy, keyCardAccuracy 等
}

interface TrainingPlan {
  id: string;
  version: string;
  levels: DifficultyLevelDefinition[];
}

interface TrainingRecommendation {
  planId: string;
  planVersion: string;
  recommendedLevelId: string;
  recommendedExercise: ExerciseDefinition;
  reason: string;
  weakEntities: CardSkillStats[];
}
```

今日训练页只展示 `TrainingRecommendation`，不直接计算晋级。推荐器输入训练历史、`CardSkillStats` 和 `TrainingPlan`，输出下一组训练建议。

## 8. 架构设计

### 8.1 模块划分

建议按以下模块组织：

```text
src/
  domain/
    cards/
      cardFaces.ts
      deck.ts
      deckSpec.ts
      cardTypes.ts
    gameProfiles/
      genericProfile.ts
      gameProfileTypes.ts
    pao/
      defaultPaoMappings.ts
      paoTypes.ts
      paoService.ts
    training/
      trainingTypes.ts
      difficulty.ts
      exerciseDefinitions.ts
      exerciseGenerator.ts
      trainingPlan.ts
      recommendations.ts
      playEvents.ts
      scoringStrategies.ts
      remainingCards.ts
      cardSkillStats.ts
  storage/
    localStore.ts
    migrations.ts
    repositories.ts
  app/
    routes.tsx
    App.tsx
  ui/
    components/
    pages/
      TodayTrainingPage.tsx
      TrainingModePage.tsx
      PaoTablePage.tsx
      ProgressPage.tsx
```

### 8.2 Domain 层

Domain 层不依赖 UI。

职责：

- 定义牌、牌组、PAO、ExerciseDefinition、TrainingSession、ExerciseAttempt 和 ScoringResult。
- 定义 Game Profile 和 DeckSpec。
- 生成训练题目、牌序、出牌事件和剩余牌问题。
- 校验 ExerciseDefinition。
- 计算 TrainingRecommendation。
- 计算顺序回忆、剩余牌判断、PAO 熟悉度评分。
- 计算训练统计。

Domain 层应通过纯函数或无 UI 依赖的 service 暴露能力。UI 不应直接拼接牌组、不应直接计算剩余牌、不应直接写评分规则。

### 8.3 Storage 层

第一版使用浏览器本地存储。

职责：

- 保存用户 PAO 覆盖项。
- 保存训练历史。
- 保存用户当前难度和偏好。
- 保存 CardSkillStats。
- 保存本地数据 schemaVersion。

推荐使用一个轻量 repository 接口封装 LocalStorage 或 IndexedDB。第一版数据量很小，可以先用 LocalStorage；如果后续需要保存大量训练历史，再切换 IndexedDB。

长期维护重点不是具体存储介质，而是 schema 版本和迁移：

```ts
interface PersistedAppState {
  schemaVersion: number;
  paoOverrides: PaoMappingOverride[];
  sessions: TrainingSession[];
  cardSkillStats: CardSkillStats[];
  userPreferences: UserPreferences;
}

interface UserPreferences {
  activePaoTemplateId: string;
  activeGameProfileId: GameProfileId;
  currentDifficultyLevel: string;
  maxStoredSessions?: number;
}
```

每次修改持久化结构时，需要提供 migration。这样后续增加两副牌、Game Profile、评分版本时，不需要让用户清空本地数据。

Repository 接口需要从第一版开始隐藏存储介质差异，并预留分页、导出和历史清理能力：

- `listSessions({ cursor, limit })`。
- `saveSession(session)`。
- `deleteSessionsBefore(date)`。
- `exportState()`。
- `importState(state)`。

这样从 LocalStorage 切到 IndexedDB 时，UI 不需要重写。

### 8.4 UI 层

UI 层负责：

- 展示训练流程。
- 接收用户作答。
- 展示评分和复盘。
- 编辑 PAO 表。

UI 不直接计算评分，应调用 domain 层函数。

## 9. 核心算法

### 9.1 训练生成流程

输入：`ExerciseDefinition`、`GameProfileDefinition`、`GameProfileRuntimeConfig`、`CardSkillStats[]`。

输出：`TrainingSession`。

流程：

1. 校验 `ExerciseDefinition` 和 `DeckSpec`。
2. 根据 `DeckSpec` 创建完整 `CardInstance[]`。
3. 根据训练模式选择对应 generator。
4. 如果 `focusWeakCards = true`，根据 `CardSkillStats.reviewWeight` 提高薄弱牌抽样权重。
5. 生成题目快照：
   - 顺序训练生成 `generatedCards`。
   - 剩余牌训练生成 `playEvents` 和 `generatedQuestions`。
   - 混合训练生成多个 step 的题目快照。
6. 写入 `generatorVersion`。

题目生成器必须输出可复盘的数据快照，不能只把随机种子交给 UI。这样后续即使生成算法变化，历史训练仍能正确展示。

### 9.2 ExerciseDefinition 校验

校验器输入 `ExerciseDefinition`，输出结构化错误列表。

必须覆盖：

1. `cardCount` 或 `seenCardCount` 不超过 `DeckSpec` 最大牌数。
2. 题目中每张牌都必须来自 `DeckSpec` 解析后的合法 `CardFace[]`。
3. 不同 `mode` 只能使用对应配置字段。
4. Game Profile Definition 的默认 `DeckSpec` 和 Runtime Config 合并后仍然有效。
5. 剩余牌题型必须能从当前牌组和出牌流计算答案。

### 9.3 顺序评分

输入：

- `TrainingSession.generatedCards`
- `ExerciseAttempt.actualCardIds`

输出：`ScoringResult`。

评分逻辑：

1. 按位置比较，得到位置完全正确数量。
2. 找出遗漏牌。
3. 找出重复或多选牌。
4. 对出现但位置错误的牌计算错位距离。
5. 生成 `PositionResult[]`。
6. 计算 `accuracy`。
7. 写入 `scoringVersion`。

第一版 accuracy 可以使用：

```text
accuracy = 位置正确数量 / expected.length
```

后续可以加入相对顺序分，但必须通过新的 `scoringVersion` 区分，避免历史分数含义变化。

### 9.4 剩余牌计算

输入：

- `DeckSpec`
- `fullDeck: CardInstance[]`
- `playEvents: PlayEvent[]`

输出：

- `remainingCards`。
- `remainingCountByFaceId`。
- `remainingCountByRank`。
- `keyCardStatus`。
- `nOfKindPossibleByRank`。
- `bombStatusByRank`。

注意：第一版一副牌时，每个 `CardFace` 最多出现一次；未来两副牌时，必须按 `CardInstance` 计数，再汇总到 `faceId` 或 `rank`。不能只用 `faceId -> boolean` 表示是否出现。

### 9.5 CardSkillStats 更新

每次训练完成后，根据 `ExerciseAttempt` 和 `ScoringResult` 更新 `CardSkillStats`。

规则：

1. PAO 熟悉训练根据“记住 / 模糊 / 不记得”和反应时间更新熟悉度。
2. 顺序训练中遗漏、错位、重复选择的牌增加错误权重。
3. 剩余牌判断中涉及的目标牌或目标点数更新统计。
4. `reviewWeight` 由熟悉度、错误次数、最近错误时间和反应时间共同计算。

抽样算法只读取 `reviewWeight`，不直接耦合具体统计公式。这样后续可以调整复习策略，而不影响训练生成接口。

### 9.6 今日训练推荐

输入：

- `TrainingPlan`。
- 最近训练历史。
- `CardSkillStats[]`。
- 当前用户偏好。

输出：`TrainingRecommendation`。

规则：

1. 从当前难度等级读取最近 `windowSize` 次训练结果。
2. 用 `ScoringResult.metrics` 判断是否达到晋级条件。
3. 达标时推荐下一等级；未达标时推荐当前等级或 fallback 等级。
4. 如果存在高权重薄弱牌，推荐 PAO 熟悉或短序列专项练习。
5. 输出可展示的 `reason`，让用户知道为什么推荐这组训练。

推荐算法应通过 `TrainingPlan.version` 管理。调整晋级规则时，历史推荐不需要重算，但新的今日训练使用最新 plan。

## 10. 默认 PAO 映射策略

默认 PAO 表需要满足：

- 中文用户容易理解。
- 人物、动作、物品具象。
- 尽量避免过于抽象。
- 每张牌映射稳定，便于后续修改。

第一版可以先内置一套可用但不追求完美的默认表。产品重点是训练路径，不是默认 PAO 的文学质量。

默认 PAO 需要按模板版本管理：

- 系统内置 `PaoTemplate`。
- 用户只保存 `PaoMappingOverride`。
- 恢复默认值等于删除覆盖项。
- 模板升级时，未自定义牌面自动使用新默认值。
- 已自定义牌面保留用户覆盖，避免升级覆盖个人记忆体系。

后续可以支持：

- 批量导入 / 导出 PAO 表。
- 多套 PAO 模板。
- AI 辅助生成个性化 PAO。
- 根据用户常错牌提示优化映射。

## 11. 未来扩展：两副牌

两副牌扩展时，主要变化在 `DeckSpec`、`CardInstance`、剩余牌计数和 Game Profile 默认配置。

需要保持：

- PAO 仍绑定 CardFace。
- 两张相同牌面共享 PAO。
- 出现与剩余判断必须按 `CardInstance` 计数，再按 `faceId` 或 `rank` 汇总展示。
- UI 在必要时显示“第 1 副 / 第 2 副”，但训练场景中通常不要求用户区分实体来源。
- `TrainingSession` 必须保存题目中的具体 `CardInstance.id`，否则历史训练在两副牌下无法复盘。

对于掼蛋和升级，常见需求不是记住“第几副的黑桃 A”，而是记住“黑桃 A 已经出了几张，还剩几张”。

## 12. 未来扩展：Game Profile

Game Profile 用来调整训练重点，而不是一开始实现完整规则。它应该由 `GameProfileDefinition` 和 `GameProfileRuntimeConfig` 组成，至少包含默认牌组、关键牌、启用题型、策略引用、运行时参数和评分权重。

新增 Profile 的原则：

1. 先增加配置和题型生成能力。
2. 再增加必要的出牌组合识别。
3. 最后才考虑完整规则引擎。

不要在通用训练代码中写大量 `if profile === "guandan"` 之类的分支。应通过 `GameProfileDefinition.strategyRefs` 和专用 generator / classifier / scorer 扩展。

### 12.1 Generic

通用记牌：

- 顺序。
- 剩余牌。
- 点数计数。
- 默认一副 54 张。

### 12.2 斗地主

重点：

- 大小王。
- 2。
- A / K。
- 炸弹可能性。
- 单张和对子剩余。
- 默认一副 54 张；后续可以加入三人座位和地主牌上下文。

### 12.3 升级

重点：

- 主牌。
- 级牌。
- 副牌花色断门。
- 对子和拖拉机。
- 默认两副牌；主牌和级牌应作为 Profile 参数，不应写死。

### 12.4 掼蛋

重点：

- 两副牌计数。
- 级牌。
- 炸弹。
- 同点数剩余数量。
- 默认两副牌；级牌应作为 Profile 参数，不应写死。

## 13. 页面结构

### 13.1 今日训练页

首屏内容：

- 当前推荐训练。
- 开始按钮。
- 当前阶段。
- 最近准确率。
- 常错牌提醒。

### 13.2 训练页

包含四个状态：

1. 准备状态：显示配置摘要。
2. 记忆状态：逐张展示或列表展示牌序。
3. 回忆状态：用户作答。
4. 结果状态：评分和复盘。

### 13.3 PAO 表页

功能：

- 表格或卡片列表。
- 花色筛选。
- 搜索。
- 编辑弹窗。
- 恢复默认值。

### 13.4 进度页

功能：

- 总览统计。
- 按训练模式统计。
- 常错牌。
- 熟悉度分布。
- 难度进度。

## 14. 测试策略

### 14.1 Domain 单元测试

必须覆盖：

- 一副牌生成 54 张唯一实例。
- 使用去王 DeckSpec 后生成 52 张。
- 两副牌生成 108 张实例，且相同 faceId 有两个 CardInstance。
- cardCount 截取正确。
- ExerciseDefinition 校验能拦截无效 cardCount、无效题型和无效牌组配置。
- 顺序评分能识别正确、错位、遗漏、重复。
- 剩余牌计算正确。
- 两副牌模式下相同 faceId 的剩余计数正确。
- PlayEvent 可以正确汇总成已出牌和剩余牌状态。
- PaoTemplate + PaoMappingOverride 能正确解析最终 PAO。
- 默认模板升级不会覆盖用户自定义 PAO。
- CardSkillStats 能根据训练结果更新薄弱牌权重。
- TrainingRecommendation 能根据最近训练结果给出晋级、保持或回退建议。
- schema migration 能把旧版本本地数据迁移到当前结构。

### 14.2 UI 行为测试

按交付切片覆盖：

| 切片 | UI 行为测试 |
| --- | --- |
| M1 | 首次使用时用户可以完成 5 张 PAO 快速演示 |
| M1 | 用户可以完成一次 13 张不限时顺序训练 |
| M1 | 结果页展示错位、遗漏、多选和下一步建议 |
| M1 | 用户可以从结果页修改单张 PAO |
| M1 | 训练结果会被保存 |
| M2 | 用户可以完成 PAO 熟悉训练 |
| M2 | 今日训练能展示推荐训练和常错牌 |
| M2 | 用户可以选择 27 / 36 / 54 张顺序训练 |
| M3 | 用户可以完成一次剩余牌判断训练 |
| M3 | 剩余牌结果页能解释答案来源 |

### 14.3 回归风险

重点防止：

- 使用 faceId 代替 CardInstance 导致两副牌无法扩展。
- UI 直接写评分逻辑，导致训练模式之间重复和不一致。
- 默认 PAO 修改后覆盖用户自定义配置。
- 训练记录结构随功能扩展失控。
- Game Profile 退化成散落在代码各处的字符串判断。
- 评分算法升级后历史训练结果含义不一致。

## 15. MVP 实施顺序建议

### 15.1 M1：首个可用训练闭环

1. 建立 CardFaceCatalog、DeckSpec、CardInstance domain 模型。
2. 建立默认 PAO 模板和用户覆盖存储。
3. 建立最小 TrainingSession、ExerciseAttempt、ScoringResult 存储结构。
4. 实现 5 张 PAO 快速演示。
5. 实现 13 张不限时顺序记忆训练。
6. 实现顺序评分和结果页。
7. 实现结果页单张 PAO 修改入口。
8. 补充 M1 UI 行为测试和核心 domain 测试。

### 15.2 M2：渐进训练与今日推荐

1. 实现 PAO 熟悉训练。
2. 实现 CardSkillStats。
3. 实现 TrainingPlan 和 TrainingRecommendation。
4. 增加 27 / 36 / 54 张顺序训练。
5. 增加常错牌和基础进度统计。
6. 补充 schemaVersion 和 migration 测试。

### 15.3 M3：实战记牌训练

1. 实现 PlayEvent。
2. 实现剩余牌计算。
3. 实现剩余牌判断题生成和评分。
4. 实现关键牌题和炸弹风险题。
5. 补充两副牌 domain 测试，不一定开放 UI。
6. 补充剩余牌 UI 行为测试。

## 16. 成功标准

第一版完成后，用户应该可以：

1. 打开工具后先完成 5 张 PAO 快速演示，再进入 13 张牌训练。
2. 使用默认 PAO 表完成训练，不需要先配置。
3. 修改不顺手的 PAO 映射。
4. 从 13 张逐步训练到 54 张。
5. 在训练后看到自己错在哪里。
6. 练习判断剩余牌和关键牌状态。
7. 后续能在不重写核心模型的情况下扩展到两副牌。
8. 训练历史保留原始作答和评分版本，后续可以复盘或重算。

### 16.1 产品验收指标

MVP 不只以“功能存在”为完成标准，还应验证训练路径是否真的可用。

建议验收指标：

- 新用户首次进入后，能在 30 秒内开始第一组训练。
- 完成一次 13 张训练后，结果页能清楚展示错误、遗漏和下一步建议。
- 用户可以在结果页直接修改某张常错牌的 PAO。
- 用户不打开高级设置，也能完成 PAO 熟悉、顺序记忆、剩余牌判断三类训练。
- 今日训练能根据最近训练结果推荐下一组练习。
- 自由练习可以选择更高难度，但不会影响今日训练的推荐路径。

## 17. 当前决策记录

- 产品路线：训练路径优先。
- 第一版牌组：一副 54 张。
- 扩展要求：预留两副牌能力。
- 训练目标：顺序记忆和剩余牌判断都要。
- 难度方式：从 13 张开始逐步增加强度。
- PAO 策略：系统提供默认映射，用户可以修改。
- PAO 存储：默认模板和用户覆盖分离，避免升级覆盖自定义映射。
- 训练数据：题目定义、训练实例、用户作答、评分结果分离。
- 游戏规则：第一版不做完整规则引擎，先做通用训练和 Game Profile 配置对象。
- 出牌流：用 PlayEvent 表达，避免未来扩展真实牌局时重写数据结构。
- 今日训练：用 TrainingPlan 和 TrainingRecommendation 表达，不把推荐逻辑写在 UI。
- 本地数据：需要 schemaVersion 和 migration，避免长期使用后无法升级。

## 18. Review 迭代记录

| 轮次 | 视角 | 结论 | 文档处理 |
| --- | --- | --- | --- |
| 1 | 架构师 | 原始模型会在两副牌、Game Profile、评分重算上产生维护成本 | 拆分 DeckSpec、ExerciseDefinition、TrainingSession、ExerciseAttempt、ScoringResult、PlayEvent、PAO 模板覆盖 |
| 2 | 产品经理 | 架构能力不应打断训练路径 | 增加 MVP 产品边界、今日训练 / 自由练习、首次使用引导、晋级规则 |
| 3 | 架构师 | 今日训练推荐不应写在 UI | 增加 TrainingPlan、TrainingRecommendation 和推荐算法 |
| 4 | 产品经理 | MVP 有范围膨胀风险 | 增加 M1 / M2 / M3 交付切片 |
| 5 | 架构师 | 测试策略和实施顺序需要与交付切片对齐 | 按 M1 / M2 / M3 重写 UI 测试和实施顺序 |
| 6 | 产品经理 | M1 与首次引导对 PAO 快速演示的要求不一致 | 将 5 张 PAO 快速演示纳入 M1 |
| 7 | 架构师 | M1 测试和成功标准需要覆盖 PAO 快速演示 | 补充 M1 UI 测试，并更新成功标准 |
| 8 | 产品经理 | 未发现新的产品范围或体验层修改建议 | 无需修改 |
| 9 | 架构师 | 未发现新的结构性修改建议 | 无需修改 |
