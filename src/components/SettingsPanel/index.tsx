import { View, Text, Slider, Input, Textarea, ScrollView } from '@tarojs/components'
import type { CommonEvent } from '@tarojs/components'
import { DEEPSEEK_MODELS } from '@/constants'
import type { Settings } from '@/store/settings'
import './index.scss'

interface Props {
  visible: boolean
  settings: Settings
  avatarSize: number
  bubbleWidth: number
  onSettings: (patch: Partial<Settings>) => void
  onAvatarSize: (size: number) => void
  onBubbleWidth: (w: number) => void
  onResetLayout: () => void
  onClearHistory: () => void
  onClose: () => void
}

const THEMES: Array<{ key: Settings['theme']; label: string; colors: string }> = [
  { key: 'aurora', label: '极光', colors: 'linear-gradient(135deg,#c6b5ff,#ffd1ec,#bdf3ff)' },
  { key: 'sunset', label: '落日', colors: 'linear-gradient(135deg,#ffb88c,#ff8fb1,#c9a7ff)' },
  { key: 'ocean', label: '海洋', colors: 'linear-gradient(135deg,#9be7ff,#b3c7ff,#e0f7ff)' },
  { key: 'night', label: '星夜', colors: 'linear-gradient(135deg,#2b2a5a,#5b4b9e,#1c1b3a)' }
]

const sliderValue = (e: CommonEvent<{ value: number }>) => Number(e.detail.value)

function Row({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <View className='settings__row'>
      <View className='settings__row-head'>
        <Text className='settings__label'>{label}</Text>
        {value !== undefined && <Text className='settings__value'>{value}</Text>}
      </View>
      {children}
    </View>
  )
}

export default function SettingsPanel(props: Props) {
  const {
    visible,
    settings,
    avatarSize,
    bubbleWidth,
    onSettings,
    onAvatarSize,
    onBubbleWidth,
    onResetLayout,
    onClearHistory,
    onClose
  } = props

  return (
    <View className={`settings ${visible ? 'settings--open' : ''}`}>
      <View className='settings__mask' onClick={onClose} />
      <View className='settings__sheet'>
        <View className='settings__grabber' />
        <View className='settings__header'>
          <Text className='settings__title'>设置</Text>
          <View className='settings__close' onClick={onClose}>
            完成
          </View>
        </View>

        <ScrollView scrollY className='settings__scroll' enhanced showScrollbar={false}>
          <Text className='settings__section'>外观</Text>
          <Row label='形象大小' value={`${avatarSize}px`}>
            <Slider
              min={120}
              max={420}
              step={2}
              value={avatarSize}
              activeColor='#8f6bff'
              backgroundColor='#ece6ff'
              blockSize={22}
              blockColor='#fff'
              onChanging={(e) => onAvatarSize(sliderValue(e))}
              onChange={(e) => onAvatarSize(sliderValue(e))}
            />
          </Row>
          <Row label='对话框宽度' value={`${bubbleWidth}px`}>
            <Slider
              min={160}
              max={420}
              step={2}
              value={bubbleWidth}
              activeColor='#8f6bff'
              backgroundColor='#ece6ff'
              blockSize={22}
              blockColor='#fff'
              onChanging={(e) => onBubbleWidth(sliderValue(e))}
              onChange={(e) => onBubbleWidth(sliderValue(e))}
            />
          </Row>
          <Row label='文字大小' value={`${settings.fontSize}px`}>
            <Slider
              min={12}
              max={24}
              step={1}
              value={settings.fontSize}
              activeColor='#8f6bff'
              backgroundColor='#ece6ff'
              blockSize={22}
              blockColor='#fff'
              onChanging={(e) => onSettings({ fontSize: sliderValue(e) })}
              onChange={(e) => onSettings({ fontSize: sliderValue(e) })}
            />
          </Row>
          <Row label='主题'>
            <View className='settings__chips'>
              {THEMES.map((t) => (
                <View
                  key={t.key}
                  className={`settings__theme ${settings.theme === t.key ? 'settings__theme--on' : ''}`}
                  onClick={() => onSettings({ theme: t.key })}
                >
                  <View className='settings__theme-swatch' style={{ background: t.colors }} />
                  <Text>{t.label}</Text>
                </View>
              ))}
            </View>
          </Row>

          <Text className='settings__section'>对话</Text>
          <Row label='回复字数上限' value={`${settings.maxChars} 字`}>
            <Slider
              min={30}
              max={200}
              step={5}
              value={settings.maxChars}
              activeColor='#8f6bff'
              backgroundColor='#ece6ff'
              blockSize={22}
              blockColor='#fff'
              onChange={(e) => onSettings({ maxChars: sliderValue(e) })}
            />
          </Row>
          <Row label='说话速度' value={`${settings.typingSpeed} ms/字`}>
            <Slider
              min={10}
              max={120}
              step={5}
              value={settings.typingSpeed}
              activeColor='#8f6bff'
              backgroundColor='#ece6ff'
              blockSize={22}
              blockColor='#fff'
              onChange={(e) => onSettings({ typingSpeed: sliderValue(e) })}
            />
          </Row>
          <Row label='模型'>
            <View className='settings__chips'>
              {DEEPSEEK_MODELS.map((m) => (
                <View
                  key={m}
                  className={`settings__chip ${settings.model === m ? 'settings__chip--on' : ''}`}
                  onClick={() => onSettings({ model: m })}
                >
                  {m}
                </View>
              ))}
            </View>
          </Row>
          <Row label='DeepSeek API Key'>
            <Input
              className='settings__input'
              password
              value={settings.apiKey}
              placeholder='sk-...'
              onInput={(e) => onSettings({ apiKey: e.detail.value.trim() })}
            />
          </Row>
          <Row label='人设（System Prompt）'>
            <Textarea
              className='settings__textarea'
              value={settings.persona}
              maxlength={600}
              autoHeight
              onInput={(e) => onSettings({ persona: e.detail.value })}
            />
          </Row>

          <Text className='settings__section'>高级</Text>
          <Row label='3D 模型地址（GLB）'>
            <Input
              className='settings__input'
              value={settings.modelUrl}
              placeholder='https://.../model.glb'
              onInput={(e) => onSettings({ modelUrl: e.detail.value.trim() })}
            />
          </Row>
          <View className='settings__actions'>
            <View className='settings__btn' onClick={onResetLayout}>
              重置位置与大小
            </View>
            <View className='settings__btn settings__btn--danger' onClick={onClearHistory}>
              清空对话记录
            </View>
          </View>
          <View className='settings__footer'>
            <Text>3D 形象：RobotExpressive（three.js 示例，CC0）· 大模型：DeepSeek</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
