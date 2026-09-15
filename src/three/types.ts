import type * as ThreeNS from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type ThreeNamespace = typeof ThreeNS

export interface ThreeBundle {
  THREE: ThreeNamespace
  GLTFLoader: typeof GLTFLoader
}

/** 平台相关的 three 运行时（H5 直接用 three，小程序用 three-platformize） */
export interface ThreePlatform {
  bundle: ThreeBundle
  canvas: HTMLCanvasElement
  pixelRatio: number
  requestAnimationFrame: (cb: (time: number) => void) => number
  cancelAnimationFrame: (id: number) => void
  dispose: () => void
}

export type AvatarMood = 'idle' | 'thinking' | 'speaking'
