import { isGuideFold } from './fold';
import type { FoldStep, OrigamiModel, LocalizedText } from './types';

type Caption = [ja: string, en: string];
type Plan = { captions: Caption[]; groups?: number[][]; checkpoint?: number };
const pair = (ja: string, en: string): Plan => ({ captions: [
  [`一方の${ja}`, `On one side, ${en}`], [`反対側の${ja}`, `On the other side, ${en}`],
] });
const pocket = (front: string, shape: string, en: string): Plan => ({ checkpoint: .5, captions: [
  [`${front}ふくろに指を入れ、口を開きます。`, `Open ${en} pocket halfway.`],
  [`開いたふくろの中央を押さえ、${shape}つぶします。`, `Press the center of the open pocket and squash it flat.`],
] });

/** Keys are the crease-preparation-free source step numbers, BEFORE expansion.
 * Every multi-guide step is reviewed here. Layer translations and coordinate
 * reference rotations stay with their physical fold, never become user steps. */
const PLANS: Record<string, Record<number, Plan>> = {
  dog: { 2: pair('角を下へ折って、たれ耳にします。', 'fold the corner down into a floppy ear.') },
  'square-base': { 3: pocket('手前の', '四角く', 'the front'), 5: pocket('反対側の', '四角く', 'the opposite') },
  crane: {
    3: pocket('手前の', '四角く', 'the front'), 5: pocket('反対側の', '四角く', 'the opposite'),
    6: { checkpoint: .5, captions: [
      ['手前の1枚の下の角を持ち上げ、ふくろを開きます。', 'Lift the bottom point of the front layer and open the pocket.'],
      ['持ち上げた角を上へ伸ばし、左右を内側へたたんで細いひし形にします。', 'Extend the point upward and tuck the sides inward into a narrow diamond.'],
    ] },
    7: { checkpoint: .5, captions: [
      ['反対側の1枚も、下の角を持ち上げて開きます。', 'Lift and open the bottom point of the opposite layer.'],
      ['こちらも左右を内側へたたみ、細いひし形にします。', 'Tuck these sides inward into a narrow diamond too.'],
    ] },
    8: { captions: [
      ['下の先を1本、斜めの折り線で途中まで持ち上げます。', 'Lift one lower point halfway along the diagonal crease.'],
      ['同じ折り線で最後まで折り上げ、首にします。', 'Finish folding along the same crease to form the neck.'],
    ] },
    9: { captions: [
      ['もう1本の下の先を、反対向きの折り線で持ち上げます。', 'Lift the other lower point along the opposite diagonal crease.'],
      ['同じ折り線で最後まで折り上げ、尾にします。', 'Finish folding along that crease to form the tail.'],
    ] },
    11: { captions: [
      ['手前の大きな1枚を開き、片方の羽にします。', 'Open the front large flap into one wing.'],
      ['反対側の大きな1枚も開き、鶴の完成です。', 'Open the opposite large flap into the second wing to finish.'],
    ] },
  },
  shuriken: {
    1: { captions: [
      ['朱の紙の左のふちを中心線へ折ります。', 'Fold the left edge of the vermilion sheet to the center line.'],
      ['朱の紙の右のふちを中心線へ折ります。', 'Fold its right edge to the center line.'],
      ['藍の紙の右のふちを中心線へ折ります。', 'Fold the right edge of the indigo sheet to the center line.'],
      ['藍の紙の左のふちを中心線へ折ります。', 'Fold its left edge to the center line.'],
    ] },
    2: { captions: [
      ['朱の紙を中心線で半分に折り、細い帯にします。', 'Fold the vermilion sheet in half into a slim strip.'],
      ['藍の紙も中心線で半分に折り、細い帯にします。', 'Fold the indigo sheet in half into a slim strip.'],
    ] },
    3: { captions: [
      ['朱の帯の上の端を、斜め45°に折ります。', 'Fold the top of the vermilion strip at 45°.'],
      ['朱の帯の下の端を、斜め45°に折ります。', 'Fold the bottom of the vermilion strip at 45°.'],
      ['藍の帯の上の端を、朱とは鏡写しに折ります。', 'Fold the top of the indigo strip, mirroring the vermilion one.'],
      ['藍の帯の下の端も、朱とは鏡写しに折ります。', 'Fold its bottom end in the mirrored direction too.'],
    ] },
    4: { captions: [
      ['朱の上の端を、斜めのふちと直角の線で折り返します。', 'Fold the top of the vermilion strip back perpendicular to its slanted edge.'],
      ['朱の下の端を、反対向きに折り返します。', 'Fold its bottom end back in the opposite direction.'],
      ['藍の上の端を、朱とは鏡写しに折り返します。', 'Fold the top of the indigo strip back in the mirrored direction.'],
      ['藍の下の端も、反対向きに折り返します。', 'Fold its bottom end back in the opposite direction.'],
    ] },
    7: { captions: [
      ['朱の三角の先を1つ折り、藍のポケットへ差し込みます。', 'Fold one vermilion triangular tip into an indigo pocket.'],
      ['朱のもう1つの先を、反対のポケットへ差し込みます。', 'Tuck the other vermilion tip into the opposite pocket.'],
    ] },
    9: { captions: [
      ['藍の三角の先を1つ折り、朱のポケットへ差し込みます。', 'Fold one indigo triangular tip into a vermilion pocket.'],
      ['藍のもう1つの先も差し込み、手裏剣の完成です。', 'Tuck the other indigo tip in to finish the shuriken.'],
    ] },
  },
  fox: { 3: pair('角を上へ折り上げ、とがった耳にします。', 'fold the corner up into a pointed ear.') },
  rabbit: { 3: pair('角をあご先から中央へ折り上げ、長い耳にします。', 'fold the corner up from the chin toward the center into a long ear.') },
  panda: { 1: pair('角を中央へ折ります。', 'fold the corner toward the center.'),
    3: pair('ふちを後ろへ折り、顔の幅を整えます。', 'fold the edge behind to shape the face.') },
  bear: { 2: pair('角を、たてに近い線で内へ折ります。', 'fold the corner inward along the near-vertical line.'),
    3: pair('交差した先を外へ折り返し、耳にします。', 'fold the crossed tip outward into an ear.'),
    4: pair('耳の先を内へ折り、丸くします。', 'fold the ear tip inward to round it.'),
    7: { captions: [
      ['マズルの先を後ろへ折ります。', 'Fold the muzzle tip behind.'],
      ['残った下の先を後ろへ折り、あごを平らにします。', 'Fold the remaining bottom tip behind to flatten the chin.'],
    ] } },
  whale: { 1: pair('右の辺を、紙の中心線に合わせて裏側へ折ります。', 'fold the right edge behind to the center line.') },
  helmet: { 2: pair('角を中央へ向け、手前に折り下げます。', 'fold the corner down toward the center.'),
    4: pair('先を斜め外へ折り、つのにします。', 'fold the tip diagonally outward into a horn.') },
  heart: { 3: pair('はしを斜め上へ折り上げ、山を作ります。', 'fold the edge diagonally upward into a lobe.'),
    4: pair('とがった角を後ろへ折ります。', 'fold the pointed corner behind.'),
    5: pair('山の先を後ろへ折り、丸みをつけます。', 'fold the lobe tip behind to round it.') },
  box: {
    1: { captions: [['上のふちを90°立てます。', 'Raise the top wall to 90°.'], ['下のふちを90°立てます。', 'Raise the bottom wall to 90°.']] },
    // A wall and its two corner gussets form one connected motion.
    2: { groups: [[0, 3, 5], [1, 2, 4]], captions: [
      ['左の壁を立て、隣の角を三角にたたみます。', 'Raise the left wall while folding its corner gussets.'],
      ['右の壁を立て、こちらの角も三角にたたみます。', 'Raise the right wall with its corner gussets.'],
    ] },
    3: { groups: [[0, 1], [2, 3], [4, 5], [6, 7]], captions: [
      ['右上の三角の耳を、壁の内側へたたみます。', 'Tuck the top-right gusset inside the wall.'],
      ['左上の三角の耳を、壁の内側へたたみます。', 'Tuck the top-left gusset inside the wall.'],
      ['右下の三角の耳を、壁の内側へたたみます。', 'Tuck the bottom-right gusset inside the wall.'],
      ['左下の三角の耳もたたんで、箱の完成です。', 'Tuck the bottom-left gusset in to finish the tray.'],
    ] },
  },
  penguin: { 4: pair('下の角を中央へ合わせて折ります。', 'fold the lower corner to the center.'),
    5: pair('はしを外へ折り返し、はねにします。', 'fold the edge outward into a wing.') },
  rocket: { 3: pair('上の角を中央へ折ります。', 'fold the top corner to the center.'),
    4: pair('ふちを中央へ折ります。', 'fold the edge to the center.'),
    5: pair('下のはしを外へ折り返し、尾翼にします。', 'fold the lower edge outward into a tail fin.') },
  envelope: { 2: pair('帯の下の角を斜めに折ります。', 'fold the lower corner of the band diagonally.'),
    3: pair('ふちを内側へ折ります。', 'fold the edge inward.'),
    4: pair('上の角を中央へ折ります。', 'fold the top corner to the center.') },
  piano: { 1: pair('ふちを内側へ折ります。', 'fold the edge inward.') },
  sinkansen: { 1: { captions: [['上のふちを内側へ折ります。', 'Fold the top edge inward.'], ['下のふちを内側へ折ります。', 'Fold the bottom edge inward.']] } },
  'waterbomb-base': { 3: pocket('手前の', '三角に', 'the front'), 5: pocket('反対側の', '三角に', 'the opposite') },
  riceball: { 3: pair('下の角を後ろへ折ります。', 'fold the lower corner behind.'),
    4: { captions: [['上の角を後ろへ折ります。', 'Fold the top corner behind.'],
      ['下の角を1つ、小さく後ろへ折ります。', 'Fold one lower corner a little behind.'],
      ['もう1つの下の角も折って、おむすびの完成です。', 'Fold the other lower corner behind to finish.']] } },
  tadpole: { 3: pocket('手前の', '平らに', 'the front') },
  car: { 2: pair('帯のはしを下へ折ります。', 'fold the end of the band down.') },
  bus: {
    1: { captions: [['上のふちを内側へ折ります。', 'Fold the top edge inward.'], ['下のふちを内側へ折ります。', 'Fold the bottom edge inward.']] },
    2: { captions: [['左上の角を外へ折ります。', 'Fold the top-left corner outward.'], ['右上の角を外へ折ります。', 'Fold the top-right corner outward.'],
      ['左下の角を外へ折ります。', 'Fold the bottom-left corner outward.'], ['右下の角を外へ折ります。', 'Fold the bottom-right corner outward.']] },
    3: { captions: [['左上の角の先を小さく折ります。', 'Fold the top-left tip a little.'], ['右上の角の先を小さく折ります。', 'Fold the top-right tip a little.'],
      ['左下の角の先を小さく折ります。', 'Fold the bottom-left tip a little.'], ['右下の角の先を小さく折ります。', 'Fold the bottom-right tip a little.']] },
    5: pair('上の角を中割り折りします。', 'inside-reverse the top corner.'),
  },
  elephant: { 3: pocket('左下の', '平らに', 'the lower-left') },
  pizza: {
    1: { captions: [['白い面を上にして、上の角を中心へ折ります。', 'Start white side up and fold the top corner to the center.'], ['下の角を中心へ折ります。', 'Fold the bottom corner to the center.']] },
    2: pair('角を中心へ折ります。', 'fold the corner to the center.'),
    4: { captions: [['右上の角を、もう一度中心へ折ります。', 'Fold the top-right corner to the center again.'], ['左下の角を、中心へ折ります。', 'Fold the bottom-left corner to the center.']] },
    5: pair('残った角を中心へ折ります。', 'fold the remaining corner to the center.'),
    6: { captions: [['上の先を少し後ろへ折ります。', 'Fold the top tip a little behind.'], ['下の先を少し後ろへ折ります。', 'Fold the bottom tip a little behind.']] },
    7: pair('先を後ろへ折り、ふちを整えます。', 'fold the tip behind to shape the edge.'),
  },
  acorn: { 3: pair('ふちを後ろへ折り、どんぐりを細くします。', 'fold the edge behind to narrow the acorn.'),
    4: pair('下の角を少し後ろへ折ります。', 'fold the lower corner a little behind.') },
};

const COUPLED: Record<string, Record<number, string>> = {
  cup: { 6: 'The front and back walls share material seams and must bow together.' },
  tadpole: { 4: 'Two layers of the same tail fold, with a small thickness relief.' },
};

function groupsFor(step: FoldStep): number[][] {
  const groups: number[][] = [];
  let pending: number[] = [];
  step.folds.forEach((op, i) => {
    // A hidden rotation before a guide updates its original coordinate references.
    if (!isGuideFold(op) && op.angle !== 0) { pending.push(i); return; }
    if (isGuideFold(op)) { groups.push([...pending, i]); pending = []; }
    else if (groups.length) groups.at(-1)!.push(i);
    else pending.push(i);
  });
  if (pending.length) groups.at(-1)!.push(...pending);
  return groups;
}

export function separateFoldSteps(model: OrigamiModel): OrigamiModel {
  let changed = false;
  const steps = model.steps.flatMap((step, i): FoldStep[] => {
    const plan = PLANS[model.id]?.[i + 1];
    if (!plan) {
      if (step.folds.filter(isGuideFold).length > 1 && !COUPLED[model.id]?.[i + 1]) {
        throw new Error(`${model.id} step ${i + 1}: unreviewed simultaneous folds`);
      }
      return [step];
    }
    changed = true;
    const groups = plan.checkpoint ? [step.folds.map((_, j) => j), step.folds.map((_, j) => j)]
      : plan.groups ?? groupsFor(step);
    if (groups.length !== plan.captions.length) throw new Error(`${model.id} step ${i + 1}: action count changed`);
    return groups.map((group, j) => {
      const [ja, en] = plan.captions[j];
      const description: LocalizedText = { ja, en };
      const initialSide = step.caution && /面を上|side up/.test(step.caution.ja + step.caution.en);
      return { folds: plan.checkpoint ? step.folds : group.map(index => step.folds[index]), description,
        // Do not repeat a plural instruction or a completion claim on earlier stages.
        ...(j === groups.length - 1 && step.caution && !initialSide ? { caution: step.caution } : {}),
        ...(j === 0 && initialSide
          ? { caution: step.caution } : {}),
        ...(plan.checkpoint ? { motionRange: [j ? plan.checkpoint : 0, j ? 1 : plan.checkpoint] as [number, number] } : {}),
      };
    });
  });
  return changed ? { ...model, steps } : model;
}
