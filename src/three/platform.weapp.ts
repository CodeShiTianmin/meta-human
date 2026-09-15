import Taro from '@tarojs/taro'
import * as THREE from 'three-platformize'
import { WechatPlatform } from 'three-platformize/src/WechatPlatform'
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader'
import type { ThreeBundle, ThreePlatform } from './types'

interface WeappCanvas extends HTMLCanvasElement {
  requestAnimationFrame: (cb: (time: number) => void) => number
  cancelAnimationFrame: (id: number) => void
}

export function createThreePlatform(canvas: HTMLCanvasElement, width: number, height: number): ThreePlatform {
  const platform = new WechatPlatform(canvas, width, height)
  platform.patchXHR()
  THREE.PLATFORM.set(platform)
  const node = canvas as WeappCanvas
  const bundle = { THREE, GLTFLoader } as unknown as ThreeBundle
  return {
    bundle,
    canvas,
    pixelRatio: Math.min(Taro.getSystemInfoSync().pixelRatio || 1, 2),
    requestAnimationFrame: (cb) => node.requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => node.cancelAnimationFrame(id),
    dispose: () => THREE.PLATFORM.dispose()
  }
}
