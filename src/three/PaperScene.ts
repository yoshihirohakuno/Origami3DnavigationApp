import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OrigamiModel } from '../engine/types';
import { computeFoldState, type FoldState } from '../engine/fold';
import { paperTriangles } from '../engine/mesh';
import { renderFaceOffsets } from '../engine/renderLayers';

const COLOR_FRONT = new THREE.Color('#eda6a2'); // 紙の表(薄い赤)
const COLOR_FRONT_HL = new THREE.Color('#f5c2bd'); // 表・折る面ハイライト
const COLOR_BACK = new THREE.Color('#fbfaf7'); // 紙の裏(白)
const COLOR_BACK_HL = new THREE.Color('#ffffff');
const GUIDE_COLORS: Record<string, THREE.Color> = {
  valley: new THREE.Color('#38bdf8'),
  mountain: new THREE.Color('#f43f5e'),
  unfold: new THREE.Color('#94a3b8'),
  'inside-reverse': new THREE.Color('#f59e0b'),
  'outside-reverse': new THREE.Color('#a78bfa'),
  assemble: new THREE.Color('#c084fc'),
};

const CAMERA_POS = new THREE.Vector3(0, 0, 5);

/**
 * 折り紙の3D表示を担当する(React非依存)。
 * 折り状態が変わったときだけジオメトリを更新し、カメラ操作は毎フレーム反映する。
 */
export class PaperScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private frontMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private edgeLines!: THREE.LineSegments;
  /** 現在工程のガイド(折り線・矢印)。折り状態に合わせて更新する */
  private guideGroup = new THREE.Group();

  private model: OrigamiModel | null = null;
  private lastState: FoldState | null = null;
  /** 最初の折り状態が届くまでの当て(展開図の頂点) */
  private framePoints: THREE.Vector3[] = [];
  private autoFrame = true;
  private viewAngle = 0;
  /** オートフィットの注視点・距離(現在値と目標値。工程が変わるたびに寄せ引きする) */
  private fitCenter = new THREE.Vector3();
  private fitDistance = CAMERA_POS.length();
  private fitTargetCenter = new THREE.Vector3();
  private fitTargetDistance = CAMERA_POS.length();
  private lastFrameTime = 0;
  /** 面ごとの三角形分割 [faceIndex, v0, v1, v2] */
  private tris: [number, number, number, number][] = [];
  /** 面の輪郭線の頂点ペア */
  private edgePairs: [number, number, number][] = [];
  /** 2枚組み用:面→シート番号。null なら単一シート(グローバル色) */
  private faceSheet: number[] | null = null;
  /** シートごとの [表, 表HL, 裏, 裏HL] 色 */
  private sheetPalette: [THREE.Color, THREE.Color, THREE.Color, THREE.Color][] = [];

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.copy(CAMERA_POS);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 10;
    this.controls.addEventListener('start', () => { this.autoFrame = false; });

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(2, -1.5, 5);
    this.scene.add(dir);
    const dirBack = new THREE.DirectionalLight(0xffffff, 0.5);
    dirBack.position.set(-2, 1.5, -4);
    this.scene.add(dirBack);

    const matFront = new THREE.MeshStandardMaterial({
      side: THREE.FrontSide,
      vertexColors: true,
      roughness: 0.85,
      metalness: 0,
    });
    const matBack = new THREE.MeshStandardMaterial({
      side: THREE.BackSide,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
    });
    this.frontMesh = new THREE.Mesh(new THREE.BufferGeometry(), matFront);
    this.backMesh = new THREE.Mesh(new THREE.BufferGeometry(), matBack);
    this.edgeLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x0d0f13, transparent: true, opacity: 0.4 }),
    );
    this.scene.add(this.frontMesh, this.backMesh, this.edgeLines, this.guideGroup);

    this.resize();
  }

  setModel(model: OrigamiModel): void {
    this.model = model;
    this.lastState = null;
    const used = [...new Set(model.faces.flat())];
    const flat = computeFoldState(model, 0).positions;
    this.framePoints = used.map(vi => flat[vi]);
    this.resetCamera();
    // 2枚組みの色分けを準備(ハイライトは白へ寄せた明色)
    this.faceSheet = model.faceSheet ?? null;
    this.sheetPalette = (model.sheetColors ?? []).map(({ front, back }) => {
      const f = new THREE.Color(front);
      const b = new THREE.Color(back);
      const white = new THREE.Color('#ffffff');
      return [f, f.clone().lerp(white, 0.3), b, b.clone().lerp(white, 0.3)];
    });
    this.tris = paperTriangles(model);
    this.edgePairs = [];
    model.faces.forEach((face, fi) => {
      for (let i = 0; i < face.length; i++) {
        this.edgePairs.push([fi, face[i], face[(i + 1) % face.length]]);
      }
    });
    const triCount = this.tris.length;
    for (const mesh of [this.frontMesh, this.backMesh]) {
      const g = mesh.geometry;
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(triCount * 9), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(triCount * 9), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(triCount * 9), 3));
    }
    this.edgeLines.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(this.edgePairs.length * 6), 3),
    );
  }

  /** 現在の折り状態を反映して1フレーム描画する */
  update(state: FoldState): void {
    if (!this.model) return;
    if (state !== this.lastState) {
      this.updateGeometry(state);
      this.lastState = state;
      if (this.autoFrame) this.aimFrame();
    }
    if (this.autoFrame) this.easeFrame();
    this.controls.update();
    // Paper layers are much closer together than ordinary 3D objects. A fixed
    // 0.1–100 clip range loses their depth precision when the camera pulls back.
    const bounds = this.frontMesh.geometry.boundingSphere;
    if (bounds) {
      const distance = this.camera.position.distanceTo(bounds.center);
      const padding = Math.max(2.5, bounds.radius * 1.5);
      const near = Math.max(0.05, distance - padding), far = distance + padding;
      if (near !== this.camera.near || far !== this.camera.far) {
        this.camera.near = near;
        this.camera.far = far;
        this.camera.updateProjectionMatrix();
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  private updateGeometry(state: FoldState): void {
    const pos = state.positions;
    const offsets = renderFaceOffsets(this.model!, state);

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (const mesh of [this.frontMesh, this.backMesh]) {
      const isFront = mesh === this.frontMesh;
      const useFrontColor = isFront;
      const pAttr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const nAttr = mesh.geometry.getAttribute('normal') as THREE.BufferAttribute;
      const cAttr = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      this.tris.forEach(([fi, v0, v1, v2], ti) => {
        const p0 = pos[v0];
        const p1 = pos[v1];
        const p2 = pos[v2];
        a.subVectors(p1, p0);
        b.subVectors(p2, p0);
        n.crossVectors(a, b).normalize();
        const hl = state.movingFaces.has(fi) && state.fraction < 1;
        let col: THREE.Color;
        const pal = this.sheetPalette[this.faceSheet?.[fi] ?? 0];
        if (pal) {
          col = useFrontColor ? (hl ? pal[1] : pal[0]) : hl ? pal[3] : pal[2];
        } else {
          col = useFrontColor ? (hl ? COLOR_FRONT_HL : COLOR_FRONT) : hl ? COLOR_BACK_HL : COLOR_BACK;
        }
        for (const [k, p] of [p0, p1, p2].entries()) {
          const idx = ti * 3 + k;
          const offset = offsets[fi];
          pAttr.setXYZ(idx, p.x + offset.x, p.y + offset.y, p.z + offset.z);
          nAttr.setXYZ(idx, n.x, n.y, n.z);
          cAttr.setXYZ(idx, col.r, col.g, col.b);
        }
      });
      pAttr.needsUpdate = true;
      nAttr.needsUpdate = true;
      cAttr.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();
    }

    const eAttr = this.edgeLines.geometry.getAttribute('position') as THREE.BufferAttribute;
    this.edgePairs.forEach(([fi, v0, v1], i) => {
      const offset = offsets[fi];
      eAttr.setXYZ(i * 2, pos[v0].x + offset.x, pos[v0].y + offset.y, pos[v0].z + offset.z);
      eAttr.setXYZ(i * 2 + 1, pos[v1].x + offset.x, pos[v1].y + offset.y, pos[v1].z + offset.z);
    });
    eAttr.needsUpdate = true;
    this.edgeLines.geometry.computeBoundingSphere();

    this.updateFoldGuides(state);

  }

  /** 現在工程の各折りごとに、折り線(点線)と折る方向の矢印を描く */
  private updateFoldGuides(state: FoldState): void {
    // 前フレームのガイドを破棄(clearだけではGPUリソースが残る)
    for (const child of this.guideGroup.children) {
      const obj = child as THREE.Mesh | THREE.Line;
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }
    this.guideGroup.clear();
    if (state.fraction >= 1) return;

    // 折りが多い工程(基本形のたたみ込み等)は矢印を省略して折り線だけ示す
    const showArrows = state.guides.length <= 3;

    for (const guide of state.guides) {
      const color = GUIDE_COLORS[guide.type];

      const [p1, p2] = guide.axisLine;
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const foldLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          p1.clone().addScaledVector(dir, -0.12),
          p2.clone().addScaledVector(dir, 0.12),
        ]),
        new THREE.LineDashedMaterial({ color, dashSize: 0.09, gapSize: 0.055 }),
      );
      foldLine.computeLineDistances();
      this.guideGroup.add(foldLine);
      if (!showArrows) continue;

      const curve = new THREE.CatmullRomCurve3(guide.arrowPath);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.018, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
      );
      const tipPos = guide.arrowPath[guide.arrowPath.length - 1];
      const prev = guide.arrowPath[guide.arrowPath.length - 2];
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.16, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      );
      tip.position.copy(tipPos);
      tip.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(tipPos, prev).normalize(),
      );
      this.guideGroup.add(tube, tip);
    }
  }

  resetCamera(): void {
    // 作品ごとの推奨カメラ角度(垂直軸まわりの水平回転)を反映する
    this.setViewAngle(this.model?.cameraAngle ?? 0);
  }

  /** 水平回転角(度)を指定してカメラを配置する(検証・デバッグ用にも使う) */
  setViewAngle(angleDeg: number): void {
    this.viewAngle = angleDeg;
    this.autoFrame = true;
    const angle = THREE.MathUtils.degToRad(angleDeg);
    const base = this.model?.cameraPos ?? [CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z];
    // 距離はオートフィットが決めるので、cameraPos と cameraAngle は見る向きの指定として使う
    this.camera.position
      .set(
        base[0] * Math.cos(angle) + base[2] * Math.sin(angle),
        base[1],
        -base[0] * Math.sin(angle) + base[2] * Math.cos(angle),
      )
      .add(this.controls.target);
    this.aimFrame();
    this.fitCenter.copy(this.fitTargetCenter);
    this.fitDistance = this.fitTargetDistance;
    this.easeFrame();
  }

  /**
   * 工程ごとのオートフィット:いまの形が画面に収まる注視点と最小距離を決める。
   * 見る向き(cameraAngle / cameraPos)はそのまま、寄り引きと注視点だけを動かすので、
   * 2枚が横に並ぶ工程でも見切れず、組み上がるにつれて自然に寄っていく。
   */
  private aimFrame(): void {
    const used = this.model ? [...new Set(this.model.faces.flat())] : [];
    const points = this.lastState ? used.map(vi => this.lastState!.positions[vi]) : this.framePoints;
    if (!points.length) return;

    const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    if (direction.lengthSq() < 1e-8) direction.copy(CAMERA_POS);
    direction.normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
    const up = direction.clone().cross(right);
    const tangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));

    // 折り種バッジと「正面」ボタンが重なる上辺は厚めに余白をとる
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    const padTop = Math.min(66, h * 0.16), padBottom = Math.min(24, h * 0.08), padSide = Math.min(24, w * 0.06);
    const usableW = Math.max(0.3, (w - padSide * 2) / w), usableH = Math.max(0.3, (h - padTop - padBottom) / h);

    const center = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
    let distance = this.controls.minDistance;
    for (const p of points) {
      const relative = p.clone().sub(center);
      const span = Math.max(
        Math.abs(relative.dot(right)) / (this.camera.aspect * usableW),
        Math.abs(relative.dot(up)) / usableH,
      );
      distance = Math.max(distance, relative.dot(direction) + 1.05 * span / tangent);
    }
    // 余白が上下で違うので、形の中心が余白の中央に来るよう注視点をずらす
    this.fitTargetCenter.copy(center).addScaledVector(up, -((padBottom - padTop) / h) * distance * tangent);
    this.fitTargetDistance = distance;
  }

  /** オートフィットの目標へなめらかに寄せる(工程を送るたびにカメラがすっと動く) */
  private easeFrame(): void {
    const now = performance.now();
    const dt = this.lastFrameTime ? Math.min((now - this.lastFrameTime) / 1000, 0.1) : 0;
    this.lastFrameTime = now;
    const k = 1 - Math.exp(-7 * dt);
    this.fitCenter.lerp(this.fitTargetCenter, k);
    this.fitDistance += (this.fitTargetDistance - this.fitDistance) * k;

    const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    if (direction.lengthSq() < 1e-8) direction.copy(CAMERA_POS);
    direction.normalize();
    this.controls.maxDistance = Math.max(10, this.fitDistance * 2);
    this.controls.target.copy(this.fitCenter);
    this.camera.position.copy(this.fitCenter).addScaledVector(direction, this.fitDistance);
  }

  resize(): void {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.model && this.autoFrame) this.setViewAngle(this.viewAngle);
  }

  dispose(): void {
    this.controls.dispose();
    this.renderer.dispose();
    this.frontMesh.geometry.dispose();
    this.backMesh.geometry.dispose();
    this.edgeLines.geometry.dispose();
    for (const child of this.guideGroup.children) {
      const obj = child as THREE.Mesh | THREE.Line;
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }
  }
}
