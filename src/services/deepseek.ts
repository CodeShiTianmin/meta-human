import Taro from '@tarojs/taro'
import { DEEPSEEK_BASE_URL } from '@/constants'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  apiKey: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export class DeepSeekError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DeepSeekError'
    this.status = status
  }
}

export async function chatCompletion(opts: ChatOptions): Promise<string> {
  const { apiKey, model, messages, maxTokens = 200, temperature = 1.1 } = opts
  if (!apiKey) throw new DeepSeekError('尚未配置 DeepSeek API Key', 0)

  const res = await Taro.request<ChatCompletionResponse>({
    url: `${DEEPSEEK_BASE_URL}/chat/completions`,
    method: 'POST',
    timeout: 60000,
    header: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    data: {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false
    }
  })

  if (res.statusCode < 200 || res.statusCode >= 300) {
    const msg = res.data?.error?.message || `请求失败 (${res.statusCode})`
    throw new DeepSeekError(msg, res.statusCode)
  }
  const content = res.data?.choices?.[0]?.message?.content?.trim()
  if (!content) throw new DeepSeekError('模型没有返回内容', res.statusCode)
  return content
}

/** 去掉 Markdown 标记并裁剪到指定字数 */
export function tidyReply(text: string, maxChars: number): string {
  const plain = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_`#>]+/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
  const chars = Array.from(plain)
  if (chars.length <= maxChars) return plain
  return chars.slice(0, Math.max(1, maxChars - 1)).join('').replace(/[，,、；;：:\s]+$/, '') + '…'
}
