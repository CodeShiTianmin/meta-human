import { View, Text, Input, ScrollView } from '@tarojs/components'
import './index.scss'

interface Props {
  value: string
  busy: boolean
  quickPrompts: string[]
  onInput: (v: string) => void
  onSend: (text: string) => void
}

export default function ChatBar({ value, busy, quickPrompts, onInput, onSend }: Props) {
  const canSend = !!value.trim() && !busy
  return (
    <View className='chatbar'>
      <ScrollView scrollX className='chatbar__quick' enhanced showScrollbar={false}>
        {quickPrompts.map((q) => (
          <View key={q} className={`chatbar__chip ${busy ? 'chatbar__chip--off' : ''}`} onClick={() => !busy && onSend(q)}>
            {q}
          </View>
        ))}
      </ScrollView>
      <View className='chatbar__row'>
        <Input
          className='chatbar__input'
          value={value}
          placeholder={busy ? '小机灵正在回复…' : '和小机灵说点什么吧'}
          placeholderClass='chatbar__placeholder'
          confirmType='send'
          maxlength={200}
          disabled={busy}
          adjustPosition
          cursorSpacing={12}
          onInput={(e) => onInput(e.detail.value)}
          onConfirm={() => canSend && onSend(value)}
        />
        <View className={`chatbar__send ${canSend ? '' : 'chatbar__send--off'}`} onClick={() => canSend && onSend(value)}>
          <Text className='chatbar__send-icon'>➤</Text>
        </View>
      </View>
    </View>
  )
}
