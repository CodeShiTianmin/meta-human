export const APP_NAME = 'MetaHuman'
export const AVATAR_NAME = '小机灵'

/** 测试用密钥，正式环境请在设置面板中替换 */
export const DEFAULT_DEEPSEEK_API_KEY = 'sk-0a37955bf58641468f208244362c6e3d'
export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
export const DEEPSEEK_MODELS = ['deepseek-chat', 'deepseek-reasoner'] as const
export type DeepSeekModel = typeof DEEPSEEK_MODELS[number]

export const DEEPSEEK_MODEL_INFO: Record<DeepSeekModel, { name: string; desc: string; emoji: string }> = {
  'deepseek-chat': { name: 'DeepSeek-V3', desc: '响应快，日常闲聊首选', emoji: '⚡' },
  'deepseek-reasoner': { name: 'DeepSeek-R1', desc: '深度推理，回答更严谨', emoji: '🧠' }
}

/** 3D 形象动画映射：不同模型自带的动画名不一样，按用途归类 */
export interface AvatarAnimations {
  /** 待机动画候选（按顺序取第一个存在的） */
  idle: string[]
  /** 说话时随机穿插的手势 */
  gestures: string[]
  /** 点击形象时的反应 */
  pokes: string[]
}

export interface AvatarPreset {
  id: string
  name: string
  tagline: string
  emoji: string
  /** 设置面板中的卡片渐变色 */
  gradient: string
  /** 打包进 H5 / App 的本地文件 */
  file: string
  /** 小程序等无法打包 glb 的环境使用的远程地址 */
  remoteUrl: string
  credit: string
  anim: AvatarAnimations
  /** 模型默认朝向修正（绕 Y 轴，弧度） */
  rotationY?: number
}

const THREE_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r186/examples/models/gltf'
const KHRONOS_CDN = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models'

/**
 * 内置形象均为开源模型：
 * - RobotExpressive（three.js 示例，CC0，Tomás Laulhé）
 * - Xbot / Soldier / Michelle（three.js 示例，Mixamo 角色）
 * - Fox（Khronos glTF 示例，CC-BY 4.0，PixelMannen / tomkranis）
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'robot',
    name: '小机灵',
    tagline: '表情丰富的小机器人',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg,#8f6bff,#ff7ac6)',
    file: 'RobotExpressive.glb',
    remoteUrl: `${THREE_CDN}/RobotExpressive/RobotExpressive.glb`,
    credit: 'RobotExpressive · three.js 示例 · CC0',
    anim: {
      idle: ['Idle'],
      gestures: ['Wave', 'Yes', 'ThumbsUp', 'Yes', 'No', 'Punch'],
      pokes: ['Jump', 'Dance', 'Wave', 'ThumbsUp', 'WalkJump']
    }
  },
  {
    id: 'xbot',
    name: '小白',
    tagline: '会点头摇头的机甲人',
    emoji: '🦾',
    gradient: 'linear-gradient(135deg,#9be7ff,#6b8cff)',
    file: 'Xbot.glb',
    remoteUrl: `${THREE_CDN}/Xbot.glb`,
    credit: 'Xbot · three.js 示例 · Mixamo',
    anim: {
      idle: ['idle'],
      gestures: ['agree', 'headShake', 'agree'],
      pokes: ['agree', 'headShake']
    }
  },
  {
    id: 'soldier',
    name: '阿兵',
    tagline: '英姿挺拔的战士',
    emoji: '🪖',
    gradient: 'linear-gradient(135deg,#7bd88f,#2f9e6b)',
    file: 'Soldier.glb',
    remoteUrl: `${THREE_CDN}/Soldier.glb`,
    credit: 'Soldier · three.js 示例 · Mixamo',
    anim: {
      idle: ['Idle'],
      gestures: [],
      pokes: ['Walk', 'Run']
    },
    rotationY: Math.PI
  },
  {
    id: 'michelle',
    name: '米雪儿',
    tagline: '停不下来的桑巴舞者',
    emoji: '💃',
    gradient: 'linear-gradient(135deg,#ffb88c,#ff5f9e)',
    file: 'Michelle.glb',
    remoteUrl: `${THREE_CDN}/Michelle.glb`,
    credit: 'Michelle · three.js 示例 · Mixamo',
    anim: {
      idle: ['SambaDance'],
      gestures: [],
      pokes: []
    }
  },
  {
    id: 'fox',
    name: '小狐',
    tagline: '好奇张望的小狐狸',
    emoji: '🦊',
    gradient: 'linear-gradient(135deg,#ffd27f,#ff8a4c)',
    file: 'Fox.glb',
    remoteUrl: `${KHRONOS_CDN}/Fox/glTF-Binary/Fox.glb`,
    credit: 'Fox · Khronos glTF 示例 · CC-BY 4.0',
    anim: {
      idle: ['Survey'],
      gestures: ['Walk'],
      pokes: ['Run', 'Walk']
    }
  }
]

export const DEFAULT_AVATAR_ID = AVATAR_PRESETS[0].id

/** 自定义 GLB 或未知模型时的通用动画推断 */
export const GENERIC_ANIMATIONS: AvatarAnimations = {
  idle: ['Idle', 'idle', 'Survey', 'Breathing', 'Stand'],
  gestures: ['Wave', 'Yes', 'No', 'ThumbsUp', 'agree', 'headShake', 'Talk', 'Talking'],
  pokes: ['Jump', 'Dance', 'Wave', 'ThumbsUp', 'Run', 'Walk']
}

export const LOCAL_MODEL_DIR = './static/models'

export function presetModelUrl(preset: AvatarPreset) {
  return process.env.TARO_ENV === 'h5' ? `${LOCAL_MODEL_DIR}/${preset.file}` : preset.remoteUrl
}

export function findAvatarPreset(id: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === id) || AVATAR_PRESETS[0]
}

export const DEFAULT_PERSONA = `你叫${AVATAR_NAME}，是一只活泼可爱、有点调皮的小机器人伙伴。` +
  '用简体中文回答，语气轻快友好，可以适度使用 emoji。' +
  '回答要精炼，不要使用 Markdown、列表或代码块。'

export const STORAGE_KEYS = {
  settings: 'metahuman.settings.v1',
  layout: 'metahuman.layout.v1',
  history: 'metahuman.history.v1'
} as const

export const QUICK_PROMPTS = [
  '介绍一下你自己',
  '讲个冷笑话',
  '今天心情怎么样？',
  '给我一句鼓励的话',
  '推荐一部电影'
]

export const GREETINGS = [
  `嗨！我是${AVATAR_NAME}，今天想聊点什么？✨`,
  '哇，你来啦！拖拖我、捏捏我，我都不介意～',
  '系统上线！随时准备好陪你聊天啦 🤖'
]
