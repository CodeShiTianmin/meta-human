export const APP_NAME = 'MetaHuman'
export const AVATAR_NAME = '小机灵'

/** 测试用密钥，正式环境请在设置面板中替换 */
export const DEFAULT_DEEPSEEK_API_KEY = 'sk-0a37955bf58641468f208244362c6e3d'
export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
export const DEEPSEEK_MODELS = ['deepseek-chat', 'deepseek-reasoner'] as const
export type DeepSeekModel = typeof DEEPSEEK_MODELS[number]

/**
 * 3D 形象：three.js 官方示例中的 RobotExpressive（CC0，作者 Tomás Laulhé）
 * H5 / App 使用打包进产物的本地文件，小程序无法打包 glb，走远程 CDN。
 */
export const LOCAL_MODEL_URL = './static/models/RobotExpressive.glb'
export const REMOTE_MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r186/examples/models/gltf/RobotExpressive/RobotExpressive.glb'
export const DEFAULT_MODEL_URL = process.env.TARO_ENV === 'h5' ? LOCAL_MODEL_URL : REMOTE_MODEL_URL

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
