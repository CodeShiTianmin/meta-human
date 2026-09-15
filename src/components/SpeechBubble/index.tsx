import { View, Text } from '@tarojs/components'
import './index.scss'

interface Props {
  name: string
  text: string
  typing: boolean
  thinking: boolean
  fontSize: number
  error?: boolean
}

export default function SpeechBubble({ name, text, typing, thinking, fontSize, error }: Props) {
  return (
    <View className={`bubble ${error ? 'bubble--error' : ''} ${thinking ? 'bubble--thinking' : ''}`}>
      <View className='bubble__name'>
        <View className='bubble__dot' />
        <Text>{name}</Text>
        {typing && <Text className='bubble__status'>说话中</Text>}
        {thinking && <Text className='bubble__status'>思考中</Text>}
      </View>
      <View className='bubble__body'>
        {thinking ? (
          <View className='bubble__dots'>
            <View className='bubble__dots-i' />
            <View className='bubble__dots-i' />
            <View className='bubble__dots-i' />
          </View>
        ) : (
          <Text className='bubble__text' style={{ fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.55)}px` }}>
            {text}
            {typing && <Text className='bubble__caret'>▍</Text>}
          </Text>
        )}
      </View>
      <View className='bubble__tail' />
    </View>
  )
}
