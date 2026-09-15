import type {
  AnimationAction,
  AnimationMixer,
  Clock,
  Group,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  WebGLRenderer
} from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { AvatarMood, ThreeNamespace, ThreePlatform } from './types'

export interface AvatarSceneOptions {
  width: number
  height: number
  modelUrl: string
  onReady?: () => void
  onProgress?: (ratio: number) => void
  onError?: (err: unknown) => void
}

const IDLE = 'Idle'
const ONE_SHOT = new Set(['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp', 'Dance', 'WalkJump'])
const SPEAK_GESTURES = ['Wave', 'Yes', 'ThumbsUp', 'Yes', 'No', 'Punch']
const POKE_GESTURES = ['Jump', 'Dance', 'Wave', 'ThumbsUp', 'WalkJump']

const CAMERA_FOV = 32
const MODEL_HEIGHT_PADDING = 1.18

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

interface MorphMesh extends Mesh {
  morphTargetInfluences: number[]
  morphTargetDictionary: Record<string, number>
}

interface LegacyRenderer extends WebGLRenderer {
  outputEncoding?: number
}

/**
 * 负责渲染与驱动 3D 形象：
 * - 播放 GLB 自带的骨骼动画（Idle / Wave / Yes ...）
 * - 说话时叠加“张嘴”（morph target）与点头摆动
 * - 思考时歪头
 */
export class AvatarScene {
  private readonly THREE: ThreeNamespace
  private readonly platform: ThreePlatform
  private readonly opts: AvatarSceneOptions
  private renderer: WebGLRenderer
  private scene: Scene
  private camera: PerspectiveCamera
  private clock: Clock
  private mixer: AnimationMixer | null = null
  private actions: Record<string, AnimationAction> = {}
  private active: AnimationAction | null = null
  private model: Group | null = null
  private shadow: Mesh | null = null
  private head: Object3D | null = null
  private headRest: Quaternion | null = null
  private faces: MorphMesh[] = []
  private modelBaseY = 0
  private modelHeight = 4.8
  private modelWidth = 3.3

  private mood: AvatarMood = 'idle'
  private rafId = 0
  private disposed = false
  private ready = false
  private nextGestureAt = 0
  private talkOpen = 0
  private headOffsetX = 0
  private headOffsetZ = 0
  private brow = 0

  constructor(platform: ThreePlatform, opts: AvatarSceneOptions) {
    this.platform = platform
    this.opts = opts
    const { THREE } = platform.bundle
    this.THREE = THREE

    this.renderer = new THREE.WebGLRenderer({
      canvas: platform.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setClearColor(0x000000, 0)
    const legacy = Number(THREE.REVISION) < 152
    if (legacy) {
      // three r133 (three-platformize) 仍使用 outputEncoding
      ;(this.renderer as LegacyRenderer).outputEncoding = 3001
    } else {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace
    }

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)
    this.clock = new THREE.Clock()

    const k = Number(THREE.REVISION) < 155 ? 1 / Math.PI : 1
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9b8cd9, 2.6 * k)
    hemi.position.set(0, 20, 0)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.6 * k)
    key.position.set(4, 8, 6)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0xb9a6ff, 1.2 * k)
    rim.position.set(-6, 3, -5)
    this.scene.add(rim)

    this.setSize(opts.width, opts.height)
    this.loadModel(opts.modelUrl)
    this.loop()
  }

  get isReady() {
    return this.ready
  }

  private loadModel(url: string) {
    const { THREE, GLTFLoader } = this.platform.bundle
    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf: GLTF) => {
        if (this.disposed) return
        this.setupModel(gltf)
        this.ready = true
        this.opts.onReady?.()
      },
      (evt) => {
        if (evt.total > 0) this.opts.onProgress?.(evt.loaded / evt.total)
      },
      (err) => this.opts.onError?.(err)
    )

    const shadowGeo = new THREE.CircleGeometry(1, 40)
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x2a1f5c, transparent: true, opacity: 0.16 })
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat)
    this.shadow.rotation.x = -Math.PI / 2
    this.shadow.visible = false
    this.scene.add(this.shadow)
  }

  private setupModel(gltf: GLTF) {
    const { THREE } = this
    const model = gltf.scene
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    this.modelHeight = size.y
    this.modelWidth = Math.max(size.x, size.z)
    this.modelBaseY = -box.min.y - size.y / 2
    model.position.y = this.modelBaseY
    this.model = model
    this.scene.add(model)

    if (this.shadow) {
      this.shadow.position.y = this.modelBaseY + 0.01
      this.shadow.scale.set(this.modelWidth * 0.42, this.modelWidth * 0.3, 1)
      this.shadow.visible = true
    }

    model.traverse((obj) => {
      const mesh = obj as MorphMesh
      if (mesh.isMesh && mesh.morphTargetDictionary && 'Surprised' in mesh.morphTargetDictionary) {
        this.faces.push(mesh)
      }
      if (!this.head && /^head$/i.test(obj.name)) this.head = obj
    })
    if (this.head) this.headRest = this.head.quaternion.clone()

    this.mixer = new THREE.AnimationMixer(model)
    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip)
      this.actions[clip.name] = action
      if (ONE_SHOT.has(clip.name)) {
        action.clampWhenFinished = true
        action.loop = THREE.LoopOnce
      }
    }
    this.mixer.addEventListener('finished', () => {
      if (!this.disposed) this.fadeTo(IDLE, 0.35)
    })
    this.fadeTo(IDLE, 0)
    this.updateCamera()
  }

  private fadeTo(name: string, duration: number) {
    const next = this.actions[name]
    if (!next) return
    const prev = this.active
    if (prev && prev !== next) prev.fadeOut(duration)
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play()
    this.active = next
  }

  private isPlayingOneShot() {
    if (!this.active) return false
    const name = this.active.getClip().name
    return ONE_SHOT.has(name) && this.active.isRunning()
  }

  setMood(mood: AvatarMood) {
    if (this.mood === mood) return
    this.mood = mood
    if (mood === 'speaking') this.nextGestureAt = this.clock.elapsedTime + 0.4
  }

  /** 点击形象时的反应 */
  poke() {
    if (!this.ready || this.isPlayingOneShot()) return
    this.fadeTo(pick(POKE_GESTURES), 0.2)
  }

  setSize(width: number, height: number) {
    const w = Math.max(1, Math.round(width))
    const h = Math.max(1, Math.round(height))
    this.renderer.setPixelRatio(this.platform.pixelRatio)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.updateCamera()
  }

  private updateCamera() {
    const halfFov = this.THREE.MathUtils.degToRad(CAMERA_FOV / 2)
    const distH = (this.modelHeight * MODEL_HEIGHT_PADDING) / 2 / Math.tan(halfFov)
    const distW = (this.modelWidth * MODEL_HEIGHT_PADDING) / 2 / (Math.tan(halfFov) * this.camera.aspect)
    const dist = Math.max(distH, distW)
    this.camera.position.set(0, this.modelHeight * 0.08, dist)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  private loop = () => {
    if (this.disposed) return
    this.rafId = this.platform.requestAnimationFrame(this.loop)
    const dt = Math.min(this.clock.getDelta(), 0.1)
    const t = this.clock.elapsedTime
    this.tick(dt, t)
    this.renderer.render(this.scene, this.camera)
  }

  private tick(dt: number, t: number) {
    const { THREE, model, mixer } = this
    if (!model || !mixer) return
    const damp = THREE.MathUtils.damp

    if (this.head && this.headRest) this.head.quaternion.copy(this.headRest)
    mixer.update(dt)

    const speaking = this.mood === 'speaking'
    const thinking = this.mood === 'thinking'

    // 说话时随机穿插手势
    if (speaking && t >= this.nextGestureAt && !this.isPlayingOneShot()) {
      this.fadeTo(pick(SPEAK_GESTURES), 0.3)
      this.nextGestureAt = t + 2.6 + Math.random() * 2.2
    }

    // 身体轻微漂浮 / 摇摆
    const bob = Math.sin(t * (speaking ? 3.2 : 1.4)) * (speaking ? 0.05 : 0.035)
    model.position.y = this.modelBaseY + Math.max(0, bob)
    const swayTarget = speaking ? Math.sin(t * 1.9) * 0.05 : thinking ? 0.22 : Math.sin(t * 0.55) * 0.14
    model.rotation.y = damp(model.rotation.y, swayTarget, 3, dt)
    if (this.shadow) {
      const s = 1 - Math.max(0, bob) * 1.6
      this.shadow.scale.set(this.modelWidth * 0.42 * s, this.modelWidth * 0.3 * s, 1)
    }

    // 头部：说话点头，思考歪头
    const targetX = speaking ? Math.sin(t * 7.3) * 0.07 : thinking ? -0.12 : 0
    const targetZ = speaking ? Math.sin(t * 2.4) * 0.06 : thinking ? 0.24 : 0
    this.headOffsetX = damp(this.headOffsetX, targetX, 8, dt)
    this.headOffsetZ = damp(this.headOffsetZ, targetZ, 5, dt)
    if (this.head) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.headOffsetX, 0, this.headOffsetZ))
      this.head.quaternion.multiply(q)
    }

    // 表情：Surprised 当作“张嘴”，Sad 当作思考时的眉头
    const mouthTarget = speaking
      ? (0.5 + 0.5 * Math.sin(t * 12.5)) * (0.55 + 0.45 * Math.sin(t * 3.7 + 1)) * 0.75
      : 0
    this.talkOpen = damp(this.talkOpen, mouthTarget, speaking ? 22 : 8, dt)
    this.brow = damp(this.brow, thinking ? 0.35 : 0, 5, dt)
    for (const face of this.faces) {
      const dict = face.morphTargetDictionary
      const inf = face.morphTargetInfluences
      const s = dict.Surprised
      const sad = dict.Sad
      if (s !== undefined) inf[s] = Math.max(inf[s], this.talkOpen)
      if (sad !== undefined) inf[sad] = Math.max(inf[sad], this.brow)
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.platform.cancelAnimationFrame(this.rafId)
    this.mixer?.stopAllAction()
    this.scene.traverse((obj) => {
      const mesh = obj as Mesh
      if (mesh.isMesh) {
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => m?.dispose())
      }
    })
    this.renderer.dispose()
    this.platform.dispose()
  }
}
