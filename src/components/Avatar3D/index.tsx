import { Canvas, View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { AvatarScene } from '@/three/AvatarScene'
import { createThreePlatform } from '@/three/platform'
import type { AvatarMood } from '@/three/types'
import './index.scss'

interface Props {
  width: number
  height: number
  modelUrl: string
  mood: AvatarMood
  onReady?: () => void
}

type Status = 'loading' | 'ready' | 'error'

let uid = 0

export default function Avatar3D({ width, height, modelUrl, mood, onReady }: Props) {
  const idRef = useRef(`avatar-canvas-${++uid}`)
  const sceneRef = useRef<AvatarScene | null>(null)
  const sizeRef = useRef({ width, height })
  const [status, setStatus] = useState<Status>('loading')
  const [progress, setProgress] = useState(0)
  const [attempt, setAttempt] = useState(0)

  sizeRef.current = { width, height }

  useEffect(() => {
    let cancelled = false
    let retries = 0
    setStatus('loading')
    setProgress(0)

    const boot = () => {
      if (cancelled) return
      Taro.createSelectorQuery()
        .select(`#${idRef.current}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (cancelled) return
          const canvas = res?.[0]?.node as HTMLCanvasElement | undefined
          if (!canvas) {
            if (retries++ < 20) setTimeout(boot, 80)
            else setStatus('error')
            return
          }
          const { width: w, height: h } = sizeRef.current
          try {
            const platform = createThreePlatform(canvas, w, h)
            sceneRef.current = new AvatarScene(platform, {
              width: w,
              height: h,
              modelUrl,
              onProgress: (r) => !cancelled && setProgress(r),
              onReady: () => {
                if (cancelled) return
                setStatus('ready')
                onReady?.()
              },
              onError: (err) => {
                console.error('[Avatar3D] load failed', err)
                if (!cancelled) setStatus('error')
              }
            })
          } catch (err) {
            console.error('[Avatar3D] init failed', err)
            setStatus('error')
          }
        })
    }

    const timer = setTimeout(boot, 60)
    return () => {
      cancelled = true
      clearTimeout(timer)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, attempt])

  useEffect(() => {
    sceneRef.current?.setSize(width, height)
  }, [width, height])

  useEffect(() => {
    sceneRef.current?.setMood(mood)
  }, [mood, status])

  const poke = () => sceneRef.current?.poke()

  return (
    <View className='avatar3d' style={{ width: `${width}px`, height: `${height}px` }} onClick={poke}>
      <Canvas
        id={idRef.current}
        canvasId={idRef.current}
        type='webgl'
        className='avatar3d__canvas'
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {status === 'loading' && (
        <View className='avatar3d__overlay'>
          <View className='avatar3d__spinner' />
          <Text className='avatar3d__hint'>
            {progress > 0 ? `召唤中 ${Math.round(progress * 100)}%` : '召唤中…'}
          </Text>
        </View>
      )}
      {status === 'error' && (
        <View className='avatar3d__overlay' onClick={() => setAttempt((a) => a + 1)}>
          <Text className='avatar3d__emoji'>🤖</Text>
          <Text className='avatar3d__hint'>模型加载失败，点我重试</Text>
        </View>
      )}
    </View>
  )
}
