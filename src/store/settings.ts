import Taro from '@tarojs/taro'
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_ID,
  DEFAULT_DEEPSEEK_API_KEY,
  DEFAULT_PERSONA,
  GENERIC_ANIMATIONS,
  STORAGE_KEYS,
  findAvatarPreset,
  presetModelUrl,
  type AvatarAnimations,
  type AvatarPreset,
  type DeepSeekModel
} from '@/constants'

export interface Settings {
  apiKey: string
  model: DeepSeekModel
  persona: string
  /** 内置形象 id */
  avatarId: string
  /** 自定义 GLB 地址，非空时覆盖内置形象 */
  customModelUrl: string
  /** 回复最多显示的字数 */
  maxChars: number
  /** 打字机效果每个字的间隔（ms） */
  typingSpeed: number
  /** 气泡字号（px） */
  fontSize: number
  /** 主题 */
  theme: 'aurora' | 'sunset' | 'ocean' | 'night'
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Layout {
  avatar: Rect
  bubble: Rect
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: DEFAULT_DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
  persona: DEFAULT_PERSONA,
  avatarId: DEFAULT_AVATAR_ID,
  customModelUrl: '',
  maxChars: 80,
  typingSpeed: 45,
  fontSize: 15,
  theme: 'aurora'
}

export interface ResolvedAvatar {
  /** 当前形象的唯一标识，用于判断是否需要重建场景 */
  key: string
  url: string
  preset: AvatarPreset | null
  anim: AvatarAnimations
  rotationY: number
}

/** 根据设置解析出实际要加载的模型与动画映射 */
export function resolveAvatar(s: Settings): ResolvedAvatar {
  const custom = s.customModelUrl.trim()
  if (custom) {
    const known = AVATAR_PRESETS.find((p) => custom === p.remoteUrl || custom === presetModelUrl(p))
    return {
      key: `custom:${custom}`,
      url: custom,
      preset: known ?? null,
      anim: known?.anim ?? GENERIC_ANIMATIONS,
      rotationY: known?.rotationY ?? 0
    }
  }
  const preset = findAvatarPreset(s.avatarId)
  return {
    key: `preset:${preset.id}`,
    url: presetModelUrl(preset),
    preset,
    anim: preset.anim,
    rotationY: preset.rotationY ?? 0
  }
}

export function getWindowSize() {
  const info = Taro.getWindowInfo ? Taro.getWindowInfo() : Taro.getSystemInfoSync()
  return { width: info.windowWidth, height: info.windowHeight }
}

export function defaultLayout(): Layout {
  const { width, height } = getWindowSize()
  const avatarSize = Math.min(Math.round(width * 0.72), 320)
  const bubbleW = Math.min(Math.round(width * 0.78), 360)
  const avatarY = Math.round(height * 0.34)
  return {
    avatar: {
      x: Math.round((width - avatarSize) / 2),
      y: avatarY,
      w: avatarSize,
      h: avatarSize
    },
    bubble: {
      x: Math.round((width - bubbleW) / 2),
      y: Math.max(96, avatarY - 130),
      w: bubbleW,
      h: 0
    }
  }
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key)
    if (!raw) return fallback
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    Taro.setStorageSync(key, JSON.stringify(value))
  } catch {
    // ignore storage failures (private mode etc.)
  }
}

interface LegacySettings extends Settings {
  /** v1 早期版本只有一个模型地址字段 */
  modelUrl?: string
}

export function loadSettings(): Settings {
  const { modelUrl, ...s } = read<LegacySettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  if (modelUrl && !s.customModelUrl) {
    const isPreset = AVATAR_PRESETS.some((p) => modelUrl === p.remoteUrl || modelUrl === presetModelUrl(p))
    if (!isPreset) s.customModelUrl = modelUrl
  }
  return s
}

export const saveSettings = (s: Settings) => write(STORAGE_KEYS.settings, s)

export const loadLayout = () => read<Layout>(STORAGE_KEYS.layout, defaultLayout())
export const saveLayout = (l: Layout) => write(STORAGE_KEYS.layout, l)
