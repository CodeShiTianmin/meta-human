import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ThreePlatform } from './types'

export function createThreePlatform(canvas: HTMLCanvasElement, _width: number, _height: number): ThreePlatform {
  return {
    bundle: { THREE, GLTFLoader },
    canvas,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    requestAnimationFrame: (cb) => window.requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
    dispose: () => {}
  }
}
