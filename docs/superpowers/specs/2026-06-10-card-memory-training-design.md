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

### 3.2 非目标

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

13 张是第一版的起点，因为它接近斗地主单个玩家手牌规模，也足够短，适合建立信心。

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
   - 是否还有 4 张同点数未出？

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

## 6. 功能需求

### 6.1 今日训练

用户进入产品后的默认页面。

功能：

- 展示当前推荐训练。
- 展示最近准确率和连续训练天数。
- 一键开始训练。
- 显示当前训练阶段，例如“13 张短序列 L2”。
- 提供进入 PAO 表和训练模式的入口。

### 6.2 训练模式

支持选择训练类型：

1. PAO 熟悉训练。
2. 顺序记忆训练。
3. 剩余牌判断训练。
4. 混合训练。

训练前可配置：

- 牌量。
- 展示速度。
- 是否包含大小王。
- 回忆方式。
- 是否优先抽取薄弱牌。

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
- 是否还有四张同点数未出。

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

## 7. 数据模型

### 7.1 CardFace

表示牌面，不代表实体牌。

字段：

```ts
type Suit = "spade" | "heart" | "diamond" | "club" | "joker";
type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "J" | "Q" | "K"
  | "small_joker" | "big_joker";

interface CardFace {
  id: string;          // spade_A, heart_10, joker_big
  suit: Suit;
  rank: Rank;
  displayName: string; // 黑桃A、红桃10、小王
  sortOrder: number;
}
```

### 7.2 CardInstance

表示一张实体牌。第一版只有 deck_1，未来两副牌会有 deck_2。

```ts
interface CardInstance {
  id: string;      // deck_1:spade_A
  deckId: string;  // deck_1
  faceId: string;  // spade_A
}
```

### 7.3 PaoMapping

PAO 映射绑定在 CardFace 上，而不是 CardInstance 上。这样两副牌里的两张黑桃 A 可以共用同一个 PAO。

```ts
interface PaoMapping {
  faceId: string;
  persona: string;
  action: string;
  object: string;
  note?: string;
  isCustomized: boolean;
  updatedAt: string;
}
```

### 7.4 TrainingConfig

```ts
type TrainingMode = "pao_familiarity" | "sequence_recall" | "remaining_cards" | "mixed";
type RecallInputMode = "reveal" | "select_cards" | "sort_cards";

interface TrainingConfig {
  mode: TrainingMode;
  deckCount: number;       // MVP 固定为 1
  cardCount: number;       // 13 / 27 / 36 / 54
  includeJokers: boolean;
  revealSecondsPerCard?: number;
  recallInputMode: RecallInputMode;
  focusWeakCards: boolean;
  gameProfile: "generic" | "doudizhu" | "shengji" | "guandan";
}
```

### 7.5 TrainingSession

```ts
interface TrainingSession {
  id: string;
  config: TrainingConfig;
  generatedCards: CardInstance[];
  startedAt: string;
  completedAt?: string;
  result?: TrainingResult;
}
```

### 7.6 TrainingResult

```ts
interface TrainingResult {
  accuracy: number;
  elapsedMs: number;
  correctCardIds: string[];
  missingCardIds: string[];
  extraCardIds: string[];
  misplacedCardIds: string[];
  averageDisplacement?: number;
  questionResults?: RemainingCardQuestionResult[];
}
```

训练结果使用 CardInstance 的 id，而不是只使用 faceId。这样未来两副牌时，可以准确表达“两张黑桃 A 中出错了一张”。如果 UI 只需要展示牌面，可以在展示层再从 cardId 汇总到 faceId。

### 7.7 RemainingCardQuestionResult

```ts
interface RemainingCardQuestionResult {
  questionType:
    | "card_seen"
    | "card_remaining"
    | "rank_remaining_count"
    | "key_card_remaining"
    | "four_of_kind_possible";
  prompt: string;
  expectedAnswer: string | number | boolean;
  actualAnswer: string | number | boolean;
  isCorrect: boolean;
}
```

## 8. 架构设计

### 8.1 模块划分

建议按以下模块组织：

```text
src/
  domain/
    cards/
      cardFaces.ts
      deck.ts
      cardTypes.ts
    pao/
      defaultPaoMappings.ts
      paoTypes.ts
      paoService.ts
    training/
      trainingTypes.ts
      difficulty.ts
      sequenceGenerator.ts
      sequenceScoring.ts
      remainingCards.ts
  storage/
    localStore.ts
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

- 定义牌、牌组、PAO、训练配置和训练结果。
- 生成训练牌序。
- 计算顺序回忆评分。
- 生成剩余牌判断题。
- 计算训练统计。

### 8.3 Storage 层

第一版使用浏览器本地存储。

职责：

- 保存用户修改过的 PAO 映射。
- 保存训练历史。
- 保存用户当前难度和偏好。

推荐使用一个轻量 repository 接口封装 LocalStorage 或 IndexedDB。第一版数据量很小，可以先用 LocalStorage；如果后续需要保存大量训练历史，再切换 IndexedDB。

### 8.4 UI 层

UI 层负责：

- 展示训练流程。
- 接收用户作答。
- 展示评分和复盘。
- 编辑 PAO 表。

UI 不直接计算评分，应调用 domain 层函数。

## 9. 核心算法

### 9.1 牌序生成

输入：TrainingConfig。

输出：CardInstance[]。

规则：

1. 根据 deckCount 创建牌实例。
2. 根据 includeJokers 过滤大小王。
3. 洗牌。
4. 截取 cardCount。
5. 如果 focusWeakCards 为 true，则提高薄弱牌抽样权重。

### 9.2 顺序评分

输入：

- expected: CardInstance[]
- actual: CardInstance[]

输出 TrainingResult。

评分逻辑：

1. 按位置比较，得到位置完全正确数量。
2. 找出遗漏牌。
3. 找出重复或多选牌。
4. 对出现但位置错误的牌计算错位距离。
5. 计算 accuracy。

第一版 accuracy 可以使用：

```text
accuracy = 位置正确数量 / expected.length
```

后续可以加入相对顺序分。

### 9.3 剩余牌计算

输入：

- fullDeck: CardInstance[]
- seenCards: CardInstance[]

输出：

- remainingCards。
- remainingCountByRank。
- keyCardStatus。
- fourOfKindPossibleByRank。

注意：第一版一副牌时，每个 CardFace 最多出现一次；未来两副牌时，必须按 CardInstance 计数，不能只用 faceId 布尔值。

## 10. 默认 PAO 映射策略

默认 PAO 表需要满足：

- 中文用户容易理解。
- 人物、动作、物品具象。
- 尽量避免过于抽象。
- 每张牌映射稳定，便于后续修改。

第一版可以先内置一套可用但不追求完美的默认表。产品重点是训练路径，不是默认 PAO 的文学质量。

后续可以支持：

- 批量导入 / 导出 PAO 表。
- 多套 PAO 模板。
- AI 辅助生成个性化 PAO。
- 根据用户常错牌提示优化映射。

## 11. 未来扩展：两副牌

两副牌扩展时，主要变化在 CardInstance 和训练计数。

需要保持：

- PAO 仍绑定 CardFace。
- 两张相同牌面共享 PAO。
- 出现与剩余判断必须按实例计数。
- UI 在必要时显示“第 1 副 / 第 2 副”，但训练场景中通常不要求用户区分实体来源。

对于掼蛋和升级，常见需求不是记住“第几副的黑桃 A”，而是记住“黑桃 A 已经出了几张，还剩几张”。

## 12. 未来扩展：Game Profile

Game Profile 用来调整训练重点，而不是一开始实现完整规则。

### 12.1 Generic

通用记牌：

- 顺序。
- 剩余牌。
- 点数计数。

### 12.2 斗地主

重点：

- 大小王。
- 2。
- A / K。
- 炸弹可能性。
- 单张和对子剩余。

### 12.3 升级

重点：

- 主牌。
- 级牌。
- 副牌花色断门。
- 对子和拖拉机。

### 12.4 掼蛋

重点：

- 两副牌计数。
- 级牌。
- 炸弹。
- 同点数剩余数量。

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
- 关闭大小王后生成 52 张。
- cardCount 截取正确。
- 顺序评分能识别正确、错位、遗漏、重复。
- 剩余牌计算正确。
- 两副牌模式下相同 faceId 的计数正确。

### 14.2 UI 行为测试

覆盖：

- 用户可以完成一次 13 张顺序训练。
- 用户可以编辑 PAO 映射。
- 用户可以完成一次剩余牌判断训练。
- 训练结果会被保存。

### 14.3 回归风险

重点防止：

- 使用 faceId 代替 CardInstance 导致两副牌无法扩展。
- UI 直接写评分逻辑，导致训练模式之间重复和不一致。
- 默认 PAO 修改后覆盖用户自定义配置。
- 训练记录结构随功能扩展失控。

## 15. MVP 实施顺序建议

1. 建立牌和牌组 domain 模型。
2. 建立默认 PAO 表和编辑存储。
3. 实现 13 张顺序记忆训练。
4. 实现顺序评分和结果页。
5. 实现剩余牌判断训练。
6. 实现训练历史和基础统计。
7. 增加 27 / 36 / 54 张难度。
8. 补充两副牌 domain 测试，不一定开放 UI。

## 16. 成功标准

第一版完成后，用户应该可以：

1. 打开工具后直接开始 13 张牌训练。
2. 使用默认 PAO 表完成训练，不需要先配置。
3. 修改不顺手的 PAO 映射。
4. 从 13 张逐步训练到 54 张。
5. 在训练后看到自己错在哪里。
6. 练习判断剩余牌和关键牌状态。
7. 后续能在不重写核心模型的情况下扩展到两副牌。

## 17. 当前决策记录

- 产品路线：训练路径优先。
- 第一版牌组：一副 54 张。
- 扩展要求：预留两副牌能力。
- 训练目标：顺序记忆和剩余牌判断都要。
- 难度方式：从 13 张开始逐步增加强度。
- PAO 策略：系统提供默认映射，用户可以修改。
- 游戏规则：第一版不做完整规则引擎，先做通用训练和游戏 Profile 预留。
