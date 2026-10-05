import type { LocalizedText } from './engine/types';

const base = 'https://www.origami-club.com/';
const diagrams: Record<string, string> = {
  pudding: 'easy/food/puddig/zu.gif',
  'santa-face': 'xmas/santaface3/zu.gif',
  'shirt': 'fashion/shirt/shirt/zu.gif',
  'baseball-jersey': 'fashion/baseball/baseball/zu.gif',
  'whale-shark': 'sea/whale-shark/zu.gif',
  'reindeer-face': 'xmas/reindeerface3/zu.gif',
  'blouse': 'fashion/blouse/biouse/zu.gif',
  'holly': 'xmas/holly/holly2/zu.gif',
  'pointed-santa': 'xmas/santa/santa2/zu.gif',
  'flounder': 'sea/flounder/zu.gif',
  'santa-cap': 'xmas/cap/cap2/zu.gif',
  house: 'easy/other/house2/house2/zu.gif',
  butterfly: 'easy/other/butterfly/butterfly/zu.gif',
  'soft-cream': 'easy/food/soft-cream2/zu.gif',
  watermelon: 'easy/food/watermelon2/zu.gif',
  egg: 'easy/other/egg/egg/zu.gif',
  octopus: 'easy/sea/octopus/zu.gif',
  pancake: 'easy/food/pancake/zu.gif',
  tv: 'easy/other/tv/tv/zu.gif',
  fuji: 'easy/other/fuji/fuji/zu.gif',
  owl: 'easy/animal/owl/owl/zu.gif',
  cicada: 'traditional/cicada/cicada/zu.gif',
  wallet: 'traditional/cly/zu.gif',
  shorts: 'easy/clothes/shorts/shorts/zu.gif',
  vest: 'easy/clothes/vest/vest/zu.gif',
  gloves: 'easy/clothes/gloves/gloves/zu.gif',
  shoes: 'rn-image/zu/shoes.gif',
  snail: 'easy/other/snail/snail/zu.gif',
  moon: 'easy/other/moon/moon/zu.gif',
  boy: 'easy/human-face/boy/zu.gif',
  girl: 'easy/human-face/girl/zu.gif',
  father: 'easy/human-face/father/zu.gif',
  mother: 'easy/human-face/mother/zu.gif',
  'water-bottle': 'easy/other/water-bottle/water-bottle/zu.gif',
  coffee: 'easy/food/coffee/zu.gif',
  tea: 'easy/food/tea/zu.gif',
  fukusuke: 'rn-image/zu/hukusuke.gif',
  cake: 'rn-image/zu/cake.gif',
  bat: 'holloween/bat2/bat2/zu.gif',
  'witch-hat': "holloween/witch's%20hat/witch's%20hat/zu.gif",
  franken: 'holloween/franken/franken/zu.gif',
  skull: 'holloween/skeleton/skeleton/zu.gif',
  acorn: 'easy/food/acom/acom2/zu.gif',
  bear: 'rn-image/zu/bear.gif', boots: 'rn-image/zu/boots.gif',
  box: 'traditional/box/zu.gif', bus: 'rn-image/zu/bus.gif',
  car: 'rn-image/zu/car.gif', cat: 'easy/animal-face/cat/zu.gif',
  chick: 'rn-image/zu/chick.gif', crane: 'rn-image/zu/crane.gif',
  cup: 'fun/cup/zu.gif', dog: 'rn-image/zu/dogfase.gif',
  elephant: 'rn-image/zu/elephant2.gif', envelope: 'rn-image/zu/letter.gif',
  fox: 'easy/animal-face/fox/zu.gif', heart: 'rn-image/zu/easyheart.gif',
  helmet: 'fun/kabuto/zu.gif', panda: 'easy/animal-face/panda/zu.gif',
  penguin: 'rn-image/zu/penguin.gif', piano: 'easy/other/piano/zu.gif',
  pizza: 'easy/food/pizza/zu.gif', rabbit: 'easy/animal-face/rabbit/zu.gif',
  riceball: 'rn-image/zu/riceball.gif', rocket: 'rn-image/zu/rocket.gif',
  ship: 'rn-image/zu/ship.gif', shuriken: 'fun/cross/zu.gif',
  sinkansen: 'rn-image/zu/sinkansen.gif', 'square-base': 'rn-image/zu/crane.gif',
  tadpole: 'rn-image/zu/tadpole.gif', tulip: 'rn-image/zu/tulips.gif',
  turtle: 'rn-image/zu/turtle.gif', 'waterbomb-base': 'fun/balloon/zu.gif',
  whale: 'rn-image/zu/whale.gif', yacht: 'easy/vehicle/yacht/yacht2/yacht.gif',
};

/** Development reference links for the audit tools; not displayed in the app. */
export const ORIGINAL_DESIGNS = new Set(['folding-fan']);
const externalReferences: Record<string,string> = {
  'fortune-teller': 'https://origami-resource-center.com/fortune-teller/',
  'jumping-frog': 'https://thepurpleyarn.com/how-make-a-paper-jumping-frog-step-by-step/',
};
export const referenceOf = (id: string): string | undefined => id.startsWith('sonobe-')
  ? 'https://make-origami.com/HelenaVerrill/sonobe.php'
  : externalReferences[id] ?? (diagrams[id] ? base + diagrams[id] : undefined);

/** Known differences found by direct diagram comparison, not a blanket accuracy claim. */
export const MODEL_NOTES: Record<string, LocalizedText> = {
  'jumping-frog': {ja:'縦横2対1の長方形1枚。二つの三角から四本の脚とばねを折ります。跳ぶ動作は画面では再現しません。',en:'One 2:1 rectangle. Two triangular bases form four legs and a spring. Jumping is not simulated.'},
  'fortune-teller': {ja:'正方形1枚。四隅を二度折り込み、指を入れる四つのふくろを開きます。',en:'One square. Fold the corners inward twice, then open four finger pockets.'},
  'folding-fan': {ja:'正方形1枚から作る放射折りの扇子。三角の頂点から広がる蛇腹を、二枚重ねで折ります。',en:'A radial fan from one square. Pleat both layers outward from the triangular pivot.'},



  'sonobe-icosahedron': { ja: '正方形30枚を使う組み立て作品です。差し込み時の紙のしなりは簡略化しています。', en: 'An assembly of thirty squares. Paper flex during pocket insertion is simplified.' },
  'santa-cap': { ja: '平面の帽子飾りに仕上がります。', en: 'This folds into a flat hat decoration.' },
  'pointed-santa': { ja: '帽子とひげを段折りで作る平面アレンジです。', en: 'A flat variation with a pleated hat and beard.' },
  crane: {
    ja: '首・尾を細く整える折りと、中割り折りの動きは簡略化して表示しています。',
    en: 'Narrowing the neck and tail and the inside-reverse motions are simplified.',
  },
  box: {
    ja: 'この作品は、浅い簡易トレイに仕上がります。',
    en: 'This model folds into a simple, shallow tray.',
  },
};
