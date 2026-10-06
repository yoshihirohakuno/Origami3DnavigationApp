import { Vector3 } from 'three';
import { computeFoldState } from '../engine/fold';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';
import { createBeetleBodyShell } from './beetleBodyStudy';
import { createBeetlePleatedCore } from './beetlePleatedCore';

/** Private study of actual narrow panel folds on the back. This does not
 * establish that the beetle's pocket opens like the source model. */
export function createBeetleCurvedBodyStudy() {
  const angle = 8;
  const core = createBeetlePleatedCore(11, 'half', { narrowLegs: true, tuckLegEdges: true });
  const body = createBeetleBodyShell(core.model, .15);
  let model = structuredClone(body.model);
  const opening = model.steps.pop()!;
  for (const fold of opening.folds) model.steps.push({ ...opening, folds: [fold] });
  const curveStart = model.steps.length;
  const initial = computeFoldState(model, curveStart).positions;
  const crease = new Vector3(0, 1, 0);
  const creaseFractions = [.15, .3, .45, .6, .75];
  for (const [pageIndex, page] of body.beetleBodyPages.entries()) {
    const seed = page.reduce((best, i) => Math.abs(initial[i].x) > Math.abs(initial[best].x) ? i : best, page[0]);
    const across = initial[seed].clone().sub(initial[0]);
    across.y = 0;
    const width = across.length();
    across.normalize();
    const direction = Math.sign(across.z * crease.clone().cross(across).z) as 1 | -1;
    const origin = initial[0].clone();
    let previous = 0;
    for (const fraction of creaseFractions) {
      const distance = width * fraction;
      origin.addScaledVector(across, distance - previous);
      const remaining = computeFoldState(model, model.steps.length).positions[seed].clone().sub(origin).dot(across);
      if (remaining <= 1e-8) throw new Error(`Back page ${pageIndex}: crease ${distance} exceeds seed ${seed}, gap ${remaining}`);
      model = foldSpatialFlap(model, seed, origin, crease, across, angle, direction, {
        description: { ja: `背中の${pageIndex + 1}枚目を細い折り面で少しずつ丸くします。`, en: `Round back layer ${pageIndex + 1} with a narrow panel fold.` },
        caution: { ja: '曲面を折り面で近似する未完成の比較試作です。袋の開口はまだ確認できていません。', en: 'Unfinished faceted curvature study. Pocket opening remains unverified.' },
      });
      across.applyAxisAngle(crease, direction * angle * Math.PI / 180);
      previous = distance;
    }
  }
  model.id = 'beetle-curved-body-study';
  model.name = { ja: 'カブトムシ・背中の曲面試作', en: 'Beetle faceted curved-back study' };
  return { model, curveStart, body, core, creaseFractions };
}

export const beetleCurvedBody = createBeetleCurvedBodyStudy();
export const beetleCurvedBodyStudy = beetleCurvedBody.model;
