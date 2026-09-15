import Taro from '@tarojs/taro'
import {
  DEFAULT_DEEPSEEK_API_KEY,
  DEFAULT_MODEL_URL,
  DEFAULT_PERSONA,
  STORAGE_KEYS,
  type DeepSeekModel
} from '@/constants'

export interface Settings {
  apiKey: string
  model: DeepSeekModel
  persona: string
  modelUrl: string
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
  modelUrl: DEFAULT_MODEL_URL,
  maxChars: 80,
  typingSpeed: 45,
  fontSize: 15,
  theme: 'aurora'
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

export const loadSettings = () => read<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
export const saveSettings = (s: Settings) => write(STORAGE_KEYS.settings, s)

export const loadLayout = () => read<Layout>(STORAGE_KEYS.layout, defaultLayout())
export const saveLayout = (l: Layout) => write(STORAGE_KEYS.layout, l)
