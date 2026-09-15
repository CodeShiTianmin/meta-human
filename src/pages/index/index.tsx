import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCallback, useEffect, useRef, useState } from 'react'
import Avatar3D from '@/components/Avatar3D'
import DragBox from '@/components/DragBox'
import SpeechBubble from '@/components/SpeechBubble'
import SettingsPanel from '@/components/SettingsPanel'
import HistoryPanel from '@/components/HistoryPanel'
import ChatBar from '@/components/ChatBar'
import { chatCompletion, tidyReply, DeepSeekError, type ChatMessage } from '@/services/deepseek'
import {
  DEFAULT_SETTINGS,
  defaultLayout,
  getWindowSize,
  loadLayout,
  loadSettings,
  saveLayout,
  saveSettings,
  type Layout,
  type Rect,
  type Settings
} from '@/store/settings'
import { AVATAR_NAME, GREETINGS, QUICK_PROMPTS, STORAGE_KEYS } from '@/constants'
import type { AvatarMood } from '@/three/types'
import './index.scss'

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]

function loadHistory(): ChatMessage[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.history)
    const parsed = typeof raw === 'string' && raw ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(list: ChatMessage[]) {
  try {
    Taro.setStorageSync(STORAGE_KEYS.history, JSON.stringify(list.slice(-60)))
  } catch {
    // ignore
  }
}

function errorText(err: unknown): string {
  if (err instanceof DeepSeekError) {
    if (err.status === 401) return 'API Key 好像不对，去设置里检查一下吧～'
    if (err.status === 402) return '账户余额不足啦，充值后再来找我玩～'
    if (err.status === 429) return '请求太频繁了，让我喘口气再说～'
    if (err.status === 0) return err.message
    return `服务开小差了（${err.status}），稍后再试试～`
  }
  return '网络好像不太通畅，稍后再试试～'
}

export default function Index() {
  const [bounds, setBounds] = useState(getWindowSize)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [layout, setLayout] = useState<Layout>(loadLayout)
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory)

  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [fullText, setFullText] = useState('')
  const [shownText, setShownText] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState(false)

  const [editing, setEditing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [avatarReady, setAvatarReady] = useState(false)

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mood: AvatarMood = thinking ? 'thinking' : typing ? 'speaking' : 'idle'

  // ---------- 打字机 ----------
  const speak = useCallback((text: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setFullText(text)
    setShownText('')
    setTyping(true)
  }, [])

  useEffect(() => {
    if (!typing) return
    const chars = Array.from(fullText)
    let i = 0
    const tick = () => {
      i += 1
      setShownText(chars.slice(0, i).join(''))
      if (i >= chars.length) {
        setTyping(false)
        return
      }
      const ch = chars[i - 1]
      const pause = /[。！？!?…]/.test(ch) ? 6 : /[，,、；;：:]/.test(ch) ? 3 : 1
      typingTimer.current = setTimeout(tick, settings.typingSpeed * pause)
    }
    typingTimer.current = setTimeout(tick, 120)
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, typing])

  // 首次打招呼
  useEffect(() => {
    speak(pick(GREETINGS))
  }, [speak])

  useDidShow(() => setBounds(getWindowSize()))

  // ---------- 持久化 ----------
  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => saveHistory(messages), [messages])

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const updateLayout = useCallback((key: keyof Layout, rect: Rect, persist = false) => {
    setLayout((l) => {
      const next = { ...l, [key]: rect }
      if (persist) saveLayout(next)
      return next
    })
  }, [])

  const setAvatarSize = (size: number) => {
    const a = layout.avatar
    const cx = a.x + a.w / 2
    const cy = a.y + a.h / 2
    const x = Math.min(Math.max(0, Math.round(cx - size / 2)), Math.max(0, bounds.width - size))
    const y = Math.min(Math.max(0, Math.round(cy - size / 2)), Math.max(0, bounds.height - size))
    updateLayout('avatar', { x, y, w: size, h: size }, true)
  }

  const setBubbleWidth = (w: number) => {
    const b = layout.bubble
    const x = Math.min(Math.max(0, b.x), Math.max(0, bounds.width - w))
    updateLayout('bubble', { ...b, x, w }, true)
  }

  const resetLayout = () => {
    const l = defaultLayout()
    setLayout(l)
    saveLayout(l)
    Taro.showToast({ title: '已重置', icon: 'none' })
  }

  const clearHistory = () => {
    setMessages([])
    Taro.showToast({ title: '已清空', icon: 'none' })
  }

  // ---------- 对话 ----------
  const busy = thinking || typing
  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || thinking) return
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setTyping(false)
    setError(false)
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: text }
    const context = [...messages, userMsg].slice(-12)
    setMessages((m) => [...m, userMsg])
    setThinking(true)
    setShownText('')

    try {
      const system: ChatMessage = {
        role: 'system',
        content: `${settings.persona}\n你叫${AVATAR_NAME}。每次回复严格控制在 ${settings.maxChars} 个字以内。`
      }
      const reply = await chatCompletion({
        apiKey: settings.apiKey || DEFAULT_SETTINGS.apiKey,
        model: settings.model,
        messages: [system, ...context],
        maxTokens: Math.min(1000, Math.max(120, settings.maxChars * 3))
      })
      const tidy = tidyReply(reply, settings.maxChars) || '……（它害羞地什么也没说）'
      setMessages((m) => [...m, { role: 'assistant', content: tidy }])
      setThinking(false)
      speak(tidy)
    } catch (err) {
      setThinking(false)
      setError(true)
      speak(errorText(err))
    }
  }

  const themeClass = `theme-${settings.theme}`
  const statusText = thinking ? '思考中' : typing ? '说话中' : avatarReady ? '在线' : '加载中'

  return (
    <View className={`page ${themeClass} ${editing ? 'page--editing' : ''}`}>
      <View className='page__bg'>
        <View className='blob blob--a' />
        <View className='blob blob--b' />
        <View className='blob blob--c' />
        <View className='page__grid' />
      </View>

      <View className='topbar'>
        <View className='topbar__brand'>
          <View className='topbar__logo'>✦</View>
          <View>
            <Text className='topbar__title'>{AVATAR_NAME}</Text>
            <View className='topbar__status'>
              <View className={`topbar__dot topbar__dot--${mood}`} />
              <Text className='topbar__status-text'>{statusText}</Text>
            </View>
          </View>
        </View>
        <View className='topbar__actions'>
          <View className={`topbar__btn ${editing ? 'topbar__btn--on' : ''}`} onClick={() => setEditing((v) => !v)}>
            {editing ? '完成' : '布局'}
          </View>
          <View className='topbar__btn' onClick={() => setShowHistory(true)}>
            记录
          </View>
          <View className='topbar__btn' onClick={() => setShowSettings(true)}>
            设置
          </View>
        </View>
      </View>

      {editing && (
        <View className='hint'>
          <Text>拖动可移动 · 拉右下角圆点可缩放</Text>
        </View>
      )}

      <DragBox
        rect={layout.avatar}
        bounds={bounds}
        minW={120}
        minH={120}
        maxW={Math.min(bounds.width, 480)}
        maxH={Math.min(bounds.height, 480)}
        lockAspect
        quiet={!editing}
        className='avatar-box'
        onChange={(r) => updateLayout('avatar', r)}
        onChangeEnd={(r) => updateLayout('avatar', r, true)}
      >
        <View className='avatar-box__glow' />
        <Avatar3D
          width={layout.avatar.w}
          height={layout.avatar.h}
          modelUrl={settings.modelUrl}
          mood={mood}
          onReady={() => setAvatarReady(true)}
        />
        <View className='avatar-box__shadow' />
      </DragBox>

      <DragBox
        rect={layout.bubble}
        bounds={bounds}
        minW={160}
        minH={60}
        maxW={Math.min(bounds.width, 480)}
        autoHeight
        quiet={!editing}
        className='bubble-box'
        onChange={(r) => updateLayout('bubble', r)}
        onChangeEnd={(r) => updateLayout('bubble', r, true)}
      >
        <SpeechBubble
          name={AVATAR_NAME}
          text={shownText}
          typing={typing}
          thinking={thinking}
          fontSize={settings.fontSize}
          error={error}
        />
      </DragBox>

      <ChatBar value={input} busy={busy} quickPrompts={QUICK_PROMPTS} onInput={setInput} onSend={send} />

      <HistoryPanel visible={showHistory} messages={messages} onClose={() => setShowHistory(false)} />

      <SettingsPanel
        visible={showSettings}
        settings={settings}
        avatarSize={layout.avatar.w}
        bubbleWidth={layout.bubble.w}
        onSettings={patchSettings}
        onAvatarSize={setAvatarSize}
        onBubbleWidth={setBubbleWidth}
        onResetLayout={resetLayout}
        onClearHistory={clearHistory}
        onClose={() => setShowSettings(false)}
      />
    </View>
  )
}
