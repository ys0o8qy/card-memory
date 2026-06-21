import {
  CARD_FACE_CATALOG,
  type Rank,
  type StandardRank,
} from "./cards";

export interface PaoTemplateEntry {
  faceId: string;
  domain?: "权" | "情" | "财" | "技" | "特殊";
  numberHook?: string;
  persona: string;
  action: string;
  object: string;
  reason?: string;
  scene?: string;
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

export interface PaoLadderLevel {
  id: "strong-hooks" | "court-cards" | "weak-hook-fill";
  name: string;
  ranks: readonly StandardRank[];
}

export interface PaoLadderItem {
  level: PaoLadderLevel;
  faceId: string;
  domain: NonNullable<PaoTemplateEntry["domain"]>;
  rank: StandardRank;
  numberHook: string;
  persona: string;
  reason?: string;
}

export const PAO_LADDER_LEVELS: readonly PaoLadderLevel[] = Object.freeze([
  Object.freeze({
    id: "strong-hooks",
    name: "Level 1｜强钩子数字",
    ranks: Object.freeze(["3", "6", "7", "8", "10"] satisfies StandardRank[]),
  }),
  Object.freeze({
    id: "court-cards",
    name: "Level 2｜角色牌",
    ranks: Object.freeze(["A", "J", "Q", "K"] satisfies StandardRank[]),
  }),
  Object.freeze({
    id: "weak-hook-fill",
    name: "Level 3｜补全弱钩子",
    ranks: Object.freeze(["2", "4", "5", "9"] satisfies StandardRank[]),
  }),
]);

const CURATED_STANDARD_MAPPINGS = [
  {
    faceId: "spade_A",
    domain: "权",
    numberHook: "第一 / 开端 / 顶级",
    persona: "秦始皇",
    action: "盖玉玺统一天下",
    object: "传国玉玺",
    reason: "A 是第一；秦始皇是第一个皇帝；黑桃代表皇权与统治",
    scene: "秦始皇盖玉玺统一天下，手里/身边出现「传国玉玺」",
  },
  {
    faceId: "spade_2",
    domain: "权",
    numberHook: "二 / 双雄",
    persona: "刘邦",
    action: "斩白蛇起义",
    object: "赤霄剑",
    reason: "2 可理解为楚汉双雄之一；刘邦是帝王权力线的开端人物之一",
    scene: "刘邦斩白蛇起义，手里/身边出现「赤霄剑」",
  },
  {
    faceId: "spade_3",
    domain: "权",
    numberHook: "山 / 三国 / 三弟",
    persona: "张飞",
    action: "三声怒吼退曹军",
    object: "丈八蛇矛",
    reason: "3 对应三国、三结义、三弟；张飞又是强战争人物",
    scene: "张飞三声怒吼退曹军，手里/身边出现「丈八蛇矛」",
  },
  {
    faceId: "spade_4",
    domain: "权",
    numberHook: "死 / 刑罚",
    persona: "包拯",
    action: "拍案判死刑",
    object: "狗头铡",
    reason: "4 谐音死；包拯、铡刀、死刑三者绑定很强",
    scene: "包拯拍案判死刑，手里/身边出现「狗头铡」",
  },
  {
    faceId: "spade_5",
    domain: "权",
    numberHook: "五 / 武",
    persona: "武松",
    action: "景阳冈打虎",
    object: "哨棒",
    reason: "5 谐音武；武松名字自带“武”，动作画面强",
    scene: "武松景阳冈打虎，手里/身边出现「哨棒」",
  },
  {
    faceId: "spade_6",
    domain: "权",
    numberHook: "刘 / 六",
    persona: "刘备",
    action: "三顾茅庐请诸葛亮",
    object: "草鞋",
    reason: "6 谐音刘；刘备是三国权力集团核心人物",
    scene: "刘备三顾茅庐请诸葛亮，手里/身边出现「草鞋」",
  },
  {
    faceId: "spade_7",
    domain: "权",
    numberHook: "七擒",
    persona: "诸葛亮",
    action: "七擒孟获",
    object: "羽扇",
    reason: "七擒直接绑定 7；诸葛亮代表权谋与战争",
    scene: "诸葛亮七擒孟获，手里/身边出现「羽扇」",
  },
  {
    faceId: "spade_8",
    domain: "权",
    numberHook: "八旗",
    persona: "康熙",
    action: "检阅八旗兵",
    object: "龙椅",
    reason: "8 对应八旗；康熙代表清代帝王权力",
    scene: "康熙检阅八旗兵，手里/身边出现「龙椅」",
  },
  {
    faceId: "spade_9",
    domain: "权",
    numberHook: "九五至尊",
    persona: "皇帝",
    action: "坐上龙椅称帝",
    object: "龙袍",
    reason: "9 对应九五至尊；皇帝是权力最高符号",
    scene: "皇帝坐上龙椅称帝，手里/身边出现「龙袍」",
  },
  {
    faceId: "spade_10",
    domain: "权",
    numberHook: "十面",
    persona: "韩信",
    action: "布十面埋伏",
    object: "兵符",
    reason: "10 对应十面埋伏；韩信代表战争布局和军权",
    scene: "韩信布十面埋伏，手里/身边出现「兵符」",
  },
  {
    faceId: "spade_J",
    domain: "权",
    numberHook: "少年 / 小将",
    persona: "赵云",
    action: "抱阿斗冲阵",
    object: "阿斗襁褓",
    reason: "J 是小将；赵云是最典型的战场少年/小将形象",
    scene: "赵云抱阿斗冲阵，手里/身边出现「阿斗襁褓」",
  },
  {
    faceId: "spade_Q",
    domain: "权",
    numberHook: "女性核心 / 女王",
    persona: "武则天",
    action: "戴凤冠批奏折",
    object: "凤冠",
    reason: "Q 是女王；武则天是中国最典型女皇",
    scene: "武则天戴凤冠批奏折，手里/身边出现「凤冠」",
  },
  {
    faceId: "spade_K",
    domain: "权",
    numberHook: "王者 / 最高权威",
    persona: "成吉思汗",
    action: "弯弓射雕",
    object: "蒙古弯弓",
    reason: "K 是王者；成吉思汗是征服型王者代表",
    scene: "成吉思汗弯弓射雕，手里/身边出现「蒙古弯弓」",
  },
  {
    faceId: "heart_A",
    domain: "情",
    numberHook: "爱情开端",
    persona: "白娘子",
    action: "断桥借伞",
    object: "油纸伞",
    reason: "A 是爱情开端；白蛇传断桥借伞是经典爱情起点",
    scene: "白娘子断桥借伞，手里/身边出现「油纸伞」",
  },
  {
    faceId: "heart_2",
    domain: "情",
    numberHook: "二 / 一对恋人",
    persona: "梁祝",
    action: "双双化蝶",
    object: "蝴蝶",
    reason: "2 代表一对恋人；梁祝是中国爱情双人锚点",
    scene: "梁祝双双化蝶，手里/身边出现「蝴蝶」",
  },
  {
    faceId: "heart_3",
    domain: "情",
    numberHook: "山",
    persona: "梁山伯",
    action: "追祝英台化蝶",
    object: "蝴蝶",
    reason: "3 对应山；梁山伯名字带“山”，且属于爱情故事",
    scene: "梁山伯追祝英台化蝶，手里/身边出现「蝴蝶」",
  },
  {
    faceId: "heart_4",
    domain: "情",
    numberHook: "死 / 殉情",
    persona: "祝英台",
    action: "投坟殉情",
    object: "红绣鞋",
    reason: "4 对应死；祝英台殉情是强情绪画面",
    scene: "祝英台投坟殉情，手里/身边出现「红绣鞋」",
  },
  {
    faceId: "heart_5",
    domain: "情",
    numberHook: "吾 / 我执",
    persona: "贾宝玉",
    action: "摔通灵宝玉",
    object: "通灵宝玉",
    reason: "5 可取“吾/我执”；贾宝玉代表痴情与执念",
    scene: "贾宝玉摔通灵宝玉，手里/身边出现「通灵宝玉」",
  },
  {
    faceId: "heart_6",
    domain: "情",
    numberHook: "流 / 流泪",
    persona: "林黛玉",
    action: "葬花流泪",
    object: "花锄",
    reason: "6 取“流”；林黛玉流泪葬花是悲情核心画面",
    scene: "林黛玉葬花流泪，手里/身边出现「花锄」",
  },
  {
    faceId: "heart_7",
    domain: "情",
    numberHook: "七夕",
    persona: "织女",
    action: "织云锦等牛郎",
    object: "织布机",
    reason: "7 对应七夕；织女是七夕爱情核心人物",
    scene: "织女织云锦等牛郎，手里/身边出现「织布机」",
  },
  {
    faceId: "heart_8",
    domain: "情",
    numberHook: "八戒",
    persona: "猪八戒",
    action: "背媳妇回高老庄",
    object: "九齿钉耙",
    reason: "8 对应八戒；红桃这里取情欲/滑稽爱情线",
    scene: "猪八戒背媳妇回高老庄，手里/身边出现「九齿钉耙」",
  },
  {
    faceId: "heart_9",
    domain: "情",
    numberHook: "久 / 长久",
    persona: "杨过",
    action: "等小龙女十六年",
    object: "玄铁重剑",
    reason: "9 谐音久；杨过等待小龙女，代表长久深情",
    scene: "杨过等小龙女十六年，手里/身边出现「玄铁重剑」",
  },
  {
    faceId: "heart_10",
    domain: "情",
    numberHook: "十年",
    persona: "苏轼",
    action: "写《江城子》悼亡",
    object: "词卷",
    reason: "10 对应“十年生死两茫茫”；悼亡情感极强",
    scene: "苏轼写《江城子》悼亡，手里/身边出现「词卷」",
  },
  {
    faceId: "heart_J",
    domain: "情",
    numberHook: "少年 / 青年恋人",
    persona: "牛郎",
    action: "牵老牛过银河",
    object: "老牛",
    reason: "J 是青年男性；牛郎是爱情故事里的青年恋人",
    scene: "牛郎牵老牛过银河，手里/身边出现「老牛」",
  },
  {
    faceId: "heart_Q",
    domain: "情",
    numberHook: "女性核心",
    persona: "小龙女",
    action: "挥白绫等杨过",
    object: "白绫",
    reason: "Q 是女性情感核心；小龙女和杨过的等待关系强",
    scene: "小龙女挥白绫等杨过，手里/身边出现「白绫」",
  },
  {
    faceId: "heart_K",
    domain: "情",
    numberHook: "情圣 / 才子",
    persona: "唐伯虎",
    action: "点秋香",
    object: "桃花扇",
    reason: "K 是情场大佬/才子；唐伯虎点秋香是风流才子锚点",
    scene: "唐伯虎点秋香，手里/身边出现「桃花扇」",
  },
  {
    faceId: "diamond_A",
    domain: "财",
    numberHook: "财富第一",
    persona: "财神",
    action: "撒金元宝",
    object: "金元宝",
    reason: "A 是财富第一符号；财神和方片财富领域最直接",
    scene: "财神撒金元宝，手里/身边出现「金元宝」",
  },
  {
    faceId: "diamond_2",
    domain: "财",
    numberHook: "富二代",
    persona: "王思聪",
    action: "吃热狗刷黑卡",
    object: "热狗",
    reason: "2 对应富二代；王思聪是大众熟悉的富二代锚点",
    scene: "王思聪吃热狗刷黑卡，手里/身边出现「热狗」",
  },
  {
    faceId: "diamond_3",
    domain: "财",
    numberHook: "山",
    persona: "钟睒睒",
    action: "灌农夫山泉",
    object: "农夫山泉瓶",
    reason: "3 对应山；农夫山泉带“山”，且钟睒睒是商业人物",
    scene: "钟睒睒灌农夫山泉，手里/身边出现「农夫山泉瓶」",
  },
  {
    faceId: "diamond_4",
    domain: "财",
    numberHook: "事 / 搞事",
    persona: "罗永浩",
    action: "拿锤子直播带货",
    object: "锤子手机",
    reason: "4 取“事/搞事”；罗永浩创业、直播、锤子都很有画面",
    scene: "罗永浩拿锤子直播带货，手里/身边出现「锤子手机」",
  },
  {
    faceId: "diamond_5",
    domain: "财",
    numberHook: "五粮液",
    persona: "五粮液酒商",
    action: "倒五粮液收钱",
    object: "五粮液瓶",
    reason: "5 直接对应五粮液；财富、消费品和酒瓶画面明确",
    scene: "五粮液酒商倒五粮液收钱，手里/身边出现「五粮液瓶」",
  },
  {
    faceId: "diamond_6",
    domain: "财",
    numberHook: "刘",
    persona: "刘强东",
    action: "穿红衣送京东快递",
    object: "京东快递箱",
    reason: "6 谐音刘；刘强东和京东商业绑定强",
    scene: "刘强东穿红衣送京东快递，手里/身边出现「京东快递箱」",
  },
  {
    faceId: "diamond_7",
    domain: "财",
    numberHook: "奇",
    persona: "周鸿祎",
    action: "360 度扫毒开怼",
    object: "360 安全卫士图标",
    reason: "7 取“奇”；奇虎 360 对应周鸿祎，科技商业属性强",
    scene: "周鸿祎360 度扫毒开怼，手里/身边出现「360 安全卫士图标」",
  },
  {
    faceId: "diamond_8",
    domain: "财",
    numberHook: "发",
    persona: "马化腾",
    action: "发微信红包",
    object: "微信红包",
    reason: "8 谐音发；发红包、发财和方片领域完全匹配",
    scene: "马化腾发微信红包，手里/身边出现「微信红包」",
  },
  {
    faceId: "diamond_9",
    domain: "财",
    numberHook: "久 / 长期",
    persona: "巴菲特",
    action: "喝可乐长期持股",
    object: "可口可乐",
    reason: "9 谐音久；巴菲特代表长期主义和投资财富",
    scene: "巴菲特喝可乐长期持股，手里/身边出现「可口可乐」",
  },
  {
    faceId: "diamond_10",
    domain: "财",
    numberHook: "一亿 / 10^8",
    persona: "王健林",
    action: "举一亿支票定小目标",
    object: "一亿支票",
    reason: "10 可联想到 10^8；“先挣一个亿”财富梗很强",
    scene: "王健林举一亿支票定小目标，手里/身边出现「一亿支票」",
  },
  {
    faceId: "diamond_J",
    domain: "财",
    numberHook: "年轻新贵",
    persona: "张一鸣",
    action: "用算法刷抖音",
    object: "抖音界面",
    reason: "J 是年轻新贵；张一鸣代表新一代科技商业人物",
    scene: "张一鸣用算法刷抖音，手里/身边出现「抖音界面」",
  },
  {
    faceId: "diamond_Q",
    domain: "财",
    numberHook: "商界女王",
    persona: "陶华碧",
    action: "炒老干妈辣酱",
    object: "老干妈瓶",
    reason: "Q 是商界女性；陶华碧和老干妈物品绑定极强",
    scene: "陶华碧炒老干妈辣酱，手里/身边出现「老干妈瓶」",
  },
  {
    faceId: "diamond_K",
    domain: "财",
    numberHook: "科技财富王者",
    persona: "比尔·盖茨",
    action: "敲 Windows 代码",
    object: "Windows 电脑",
    reason: "K 是财富科技王者；盖茨是全球商业科技符号",
    scene: "比尔·盖茨敲 Windows 代码，手里/身边出现「Windows 电脑」",
  },
  {
    faceId: "club_A",
    domain: "技",
    numberHook: "第一工匠",
    persona: "鲁班",
    action: "锯木造机关",
    object: "曲尺",
    reason: "A 是第一工匠；鲁班是中国手艺/工匠第一锚点",
    scene: "鲁班锯木造机关，手里/身边出现「曲尺」",
  },
  {
    faceId: "club_2",
    domain: "技",
    numberHook: "二郎",
    persona: "二郎神",
    action: "睁天眼劈山",
    object: "三尖两刃刀",
    reason: "2 对应二郎；二郎神技能和法术画面强",
    scene: "二郎神睁天眼劈山，手里/身边出现「三尖两刃刀」",
  },
  {
    faceId: "club_3",
    domain: "技",
    numberHook: "三丰",
    persona: "张三丰",
    action: "打太极",
    object: "太极图",
    reason: "3 对应三丰；张三丰代表武学技能",
    scene: "张三丰打太极，手里/身边出现「太极图」",
  },
  {
    faceId: "club_4",
    domain: "技",
    numberHook: "四大名捕",
    persona: "无情",
    action: "坐轮椅发暗器",
    object: "暗器",
    reason: "4 对应四大名捕；无情的暗器技能辨识度高",
    scene: "无情坐轮椅发暗器，手里/身边出现「暗器」",
  },
  {
    faceId: "club_5",
    domain: "技",
    numberHook: "五毒",
    persona: "五毒教主",
    action: "放毒虫",
    object: "毒虫瓶",
    reason: "5 对应五毒；毒术属于江湖技能",
    scene: "五毒教主放毒虫，手里/身边出现「毒虫瓶」",
  },
  {
    faceId: "club_6",
    domain: "技",
    numberHook: "六脉神剑",
    persona: "段誉",
    action: "伸手发六脉神剑",
    object: "手指剑气",
    reason: "6 对应六脉神剑；段誉和该技能强绑定",
    scene: "段誉伸手发六脉神剑，手里/身边出现「手指剑气」",
  },
  {
    faceId: "club_7",
    domain: "技",
    numberHook: "七伤拳",
    persona: "谢逊",
    action: "挥拳震碎石头",
    object: "屠龙刀",
    reason: "7 对应七伤拳；谢逊和七伤拳、屠龙刀画面强",
    scene: "谢逊挥拳震碎石头，手里/身边出现「屠龙刀」",
  },
  {
    faceId: "club_8",
    domain: "技",
    numberHook: "八卦掌",
    persona: "董海川",
    action: "绕圈打八卦掌",
    object: "八卦盘",
    reason: "8 对应八卦掌；董海川是八卦掌代表人物",
    scene: "董海川绕圈打八卦掌，手里/身边出现「八卦盘」",
  },
  {
    faceId: "club_9",
    domain: "技",
    numberHook: "九阴真经",
    persona: "黄药师",
    action: "吹箫施展奇门",
    object: "玉箫",
    reason: "9 对应九阴真经/奇门武学；黄药师、玉箫画面鲜明",
    scene: "黄药师吹箫施展奇门，手里/身边出现「玉箫」",
  },
  {
    faceId: "club_10",
    domain: "技",
    numberHook: "十步杀一人",
    persona: "李白侠客",
    action: "十步拔剑",
    object: "长剑",
    reason: "10 对应“十步杀一人”；江湖侠客感强",
    scene: "李白侠客十步拔剑，手里/身边出现「长剑」",
  },
  {
    faceId: "club_J",
    domain: "技",
    numberHook: "少年侠客",
    persona: "郭靖",
    action: "弯弓射雕",
    object: "弓箭",
    reason: "J 是少年侠客；郭靖成长线和射雕动作明确",
    scene: "郭靖弯弓射雕，手里/身边出现「弓箭」",
  },
  {
    faceId: "club_Q",
    domain: "技",
    numberHook: "女侠 / 智技女性",
    persona: "黄蓉",
    action: "打狗棒布阵",
    object: "打狗棒",
    reason: "Q 是女侠/智技型女性；黄蓉与打狗棒绑定强",
    scene: "黄蓉打狗棒布阵，手里/身边出现「打狗棒」",
  },
  {
    faceId: "club_K",
    domain: "技",
    numberHook: "武林王者",
    persona: "乔峰",
    action: "打出降龙十八掌",
    object: "酒碗",
    reason: "K 是武林王者；乔峰、降龙十八掌、酒碗画面极强",
    scene: "乔峰打出降龙十八掌，手里/身边出现「酒碗」",
  },
] satisfies readonly PaoTemplateEntry[];

const JOKER_MAPPINGS = [
  {
    faceId: "joker_small",
    domain: "特殊",
    numberHook: "小王 / 扰动",
    persona: "小丑",
    action: "变出",
    object: "礼帽",
    reason: "表中未定义大小王；保留 54 张训练所需的兜底 PAO",
    scene: "小丑变出礼帽",
  },
  {
    faceId: "joker_big",
    domain: "特殊",
    numberHook: "大王 / 王牌",
    persona: "巨人",
    action: "变出",
    object: "礼帽",
    reason: "表中未定义大小王；保留 54 张训练所需的兜底 PAO",
    scene: "巨人变出礼帽",
  },
] satisfies readonly PaoTemplateEntry[];

const CURATED_MAPPING_BY_FACE_ID = new Map(
  [...CURATED_STANDARD_MAPPINGS, ...JOKER_MAPPINGS].map((entry) => [
    entry.faceId,
    entry,
  ]),
);

export const DEFAULT_PAO_TEMPLATE: PaoTemplate = Object.freeze({
  id: "default_zh_v1",
  version: 2,
  mappings: Object.freeze(
    CARD_FACE_CATALOG.faces.map((face) => {
      const mapping = CURATED_MAPPING_BY_FACE_ID.get(face.id);
      if (!mapping) {
        throw new Error(`Missing default PAO mapping for ${face.id}`);
      }
      return Object.freeze(mapping);
    }),
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
    const templateEntry = resolved.get(override.faceId);
    resolved.set(override.faceId, {
      ...templateEntry,
      faceId: override.faceId,
      domain: override.domain ?? templateEntry?.domain,
      numberHook: override.numberHook ?? templateEntry?.numberHook,
      persona: override.persona,
      action: override.action,
      object: override.object,
      reason: override.reason ?? templateEntry?.reason,
      scene: override.scene ?? templateEntry?.scene,
      note: override.note,
      source: "custom",
    });
  }

  return resolved;
}

export function getPaoLadderLevelForRank(
  rank: Rank,
): PaoLadderLevel | undefined {
  return PAO_LADDER_LEVELS.find((level) =>
    level.ranks.includes(rank as StandardRank),
  );
}

export function buildPaoLadderItems(
  mappings: ReadonlyMap<string, ResolvedPaoMapping>,
  levelId: PaoLadderLevel["id"],
): PaoLadderItem[] {
  const level = PAO_LADDER_LEVELS.find((candidate) => candidate.id === levelId);
  if (!level) return [];

  return CARD_FACE_CATALOG.faces.flatMap((face) => {
    if (face.suit === "joker") return [];
    if (!level.ranks.includes(face.rank as StandardRank)) return [];

    const mapping = mappings.get(face.id);
    if (!mapping?.domain || mapping.domain === "特殊" || !mapping.numberHook) {
      return [];
    }

    return [
      {
        level,
        faceId: face.id,
        domain: mapping.domain,
        rank: face.rank as StandardRank,
        numberHook: mapping.numberHook,
        persona: mapping.persona,
        reason: mapping.reason,
      },
    ];
  });
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
