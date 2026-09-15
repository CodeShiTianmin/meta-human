import { View, Text, ScrollView } from '@tarojs/components'
import type { ChatMessage } from '@/services/deepseek'
import { AVATAR_NAME } from '@/constants'
import './index.scss'

interface Props {
  visible: boolean
  messages: ChatMessage[]
  onClose: () => void
}

export default function HistoryPanel({ visible, messages, onClose }: Props) {
  return (
    <View className={`history ${visible ? 'history--open' : ''}`}>
      <View className='history__mask' onClick={onClose} />
      <View className='history__panel'>
        <View className='history__header'>
          <Text className='history__title'>对话记录</Text>
          <View className='history__close' onClick={onClose}>
            ✕
          </View>
        </View>
        <ScrollView scrollY className='history__list' scrollIntoView='history-bottom' enhanced showScrollbar={false}>
          {messages.length === 0 && <Text className='history__empty'>还没有聊过天，去和{AVATAR_NAME}打个招呼吧～</Text>}
          {messages.map((m, i) => (
            <View key={i} className={`history__item history__item--${m.role}`}>
              <View className='history__bubble'>
                <Text>{m.content}</Text>
              </View>
            </View>
          ))}
          <View id='history-bottom' style={{ height: 8 }} />
        </ScrollView>
      </View>
    </View>
  )
}
