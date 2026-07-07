import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OrigamiModel } from '../engine/types';
import type { FoldState } from '../engine/fold';

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
};

const CAMERA_POS = new THREE.Vector3(0, -2.4, 4.0);

/**
 * 折り紙の3D表示を担当する(React非依存)。
 * 毎フレーム FoldState を受け取ってジオメトリを組み直す。
 */
export class PaperScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private frontMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private edgeLines!: THREE.LineSegments;
  /** 現在工程のガイド(折り線・矢印)。毎フレーム作り直す */
  private guideGroup = new THREE.Group();

  private model: OrigamiModel | null = null;
  /** 面ごとの三角形分割 [faceIndex, v0, v1, v2] */
  private tris: [number, number, number, number][] = [];
  /** 面の輪郭線の頂点ペア */
  private edgePairs: [number, number][] = [];

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
    this.tris = [];
    this.edgePairs = [];
    model.faces.forEach((face, fi) => {
      for (let i = 1; i < face.length - 1; i++) {
        this.tris.push([fi, face[0], face[i], face[i + 1]]);
      }
      for (let i = 0; i < face.length; i++) {
        this.edgePairs.push([face[i], face[(i + 1) % face.length]]);
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
    const pos = state.positions;

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (const mesh of [this.frontMesh, this.backMesh]) {
      const isFront = mesh === this.frontMesh;
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
        const col = isFront ? (hl ? COLOR_FRONT_HL : COLOR_FRONT) : hl ? COLOR_BACK_HL : COLOR_BACK;
        for (const [k, p] of [p0, p1, p2].entries()) {
          const idx = ti * 3 + k;
          pAttr.setXYZ(idx, p.x, p.y, p.z);
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
    this.edgePairs.forEach(([v0, v1], i) => {
      eAttr.setXYZ(i * 2, pos[v0].x, pos[v0].y, pos[v0].z);
      eAttr.setXYZ(i * 2 + 1, pos[v1].x, pos[v1].y, pos[v1].z);
    });
    eAttr.needsUpdate = true;
    this.edgeLines.geometry.computeBoundingSphere();

    this.updateFoldGuides(state);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
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
    this.camera.position.copy(CAMERA_POS);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resize(): void {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
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
