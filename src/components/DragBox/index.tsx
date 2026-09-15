import { View } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import { useRef, type CSSProperties, type PropsWithChildren } from 'react'
import type { Rect } from '@/store/settings'
import './index.scss'

interface Props {
  rect: Rect
  bounds: { width: number; height: number }
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  /** 拖拽缩放时保持宽高比 */
  lockAspect?: boolean
  /** 高度由内容决定（如气泡），不参与缩放 */
  autoHeight?: boolean
  resizable?: boolean
  /** 隐藏虚线边框（例如非编辑模式） */
  quiet?: boolean
  className?: string
  style?: CSSProperties
  onChange: (rect: Rect) => void
  onChangeEnd?: (rect: Rect) => void
}

type Mode = 'drag' | 'resize' | null

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function point(e: ITouchEvent) {
  const t = e.touches?.[0] || e.changedTouches?.[0]
  return { x: t?.clientX ?? 0, y: t?.clientY ?? 0 }
}

export default function DragBox(props: PropsWithChildren<Props>) {
  const {
    rect,
    bounds,
    minW = 80,
    minH = 80,
    maxW = Infinity,
    maxH = Infinity,
    lockAspect = false,
    autoHeight = false,
    resizable = true,
    quiet = false,
    className = '',
    style,
    onChange,
    onChangeEnd,
    children
  } = props

  const modeRef = useRef<Mode>(null)
  const startRef = useRef({ x: 0, y: 0, rect })
  const latestRef = useRef(rect)
  latestRef.current = rect

  const begin = (mode: Mode, e: ITouchEvent) => {
    modeRef.current = mode
    startRef.current = { ...point(e), rect: latestRef.current }
  }

  const onHandleStart = (e: ITouchEvent) => {
    e.stopPropagation()
    begin('resize', e)
  }

  const onStart = (e: ITouchEvent) => {
    if (modeRef.current === 'resize') return
    begin('drag', e)
  }

  const onMove = (e: ITouchEvent) => {
    const mode = modeRef.current
    if (!mode) return
    const p = point(e)
    const { x: sx, y: sy, rect: r0 } = startRef.current
    const dx = p.x - sx
    const dy = p.y - sy
    const effH = autoHeight ? r0.h || 0 : r0.h

    let next: Rect
    if (mode === 'drag') {
      next = {
        ...r0,
        x: clamp(r0.x + dx, 0, Math.max(0, bounds.width - r0.w)),
        y: clamp(r0.y + dy, 0, Math.max(0, bounds.height - effH))
      }
    } else {
      let w = clamp(r0.w + dx, minW, Math.min(maxW, bounds.width - r0.x))
      let h = autoHeight ? r0.h : clamp(r0.h + dy, minH, Math.min(maxH, bounds.height - r0.y))
      if (lockAspect && !autoHeight) {
        const ratio = r0.w / r0.h
        const size = Math.max(w, h * ratio)
        w = clamp(size, minW, Math.min(maxW, bounds.width - r0.x))
        h = clamp(w / ratio, minH, Math.min(maxH, bounds.height - r0.y))
        w = h * ratio
      }
      next = { ...r0, w: Math.round(w), h: Math.round(h) }
    }
    onChange(next)
  }

  const onEnd = () => {
    if (!modeRef.current) return
    modeRef.current = null
    onChangeEnd?.(latestRef.current)
  }

  const boxStyle: CSSProperties = {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.w}px`,
    ...(autoHeight ? {} : { height: `${rect.h}px` }),
    ...style
  }

  return (
    <View
      className={`dragbox ${quiet ? 'dragbox--quiet' : ''} ${className}`}
      style={boxStyle}
      catchMove
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      {children}
      {resizable && (
        <View className='dragbox__handle' onTouchStart={onHandleStart}>
          <View className='dragbox__handle-icon' />
        </View>
      )}
    </View>
  )
}
