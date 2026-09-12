import type { LocalizedText } from './engine/types';

const base = 'https://www.origami-club.com/';
const diagrams: Record<string, string> = {
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
export const referenceOf = (id: string): string | undefined => diagrams[id] ? base + diagrams[id] : undefined;

/** Known differences found by direct diagram comparison, not a blanket accuracy claim. */
export const MODEL_NOTES: Record<string, LocalizedText> = {
  crane: {
    ja: '首・尾を細く整える折りと、中割り折りの動きは簡略化して表示しています。',
    en: 'Narrowing the neck and tail and the inside-reverse motions are simplified.',
  },
  box: {
    ja: 'この作品は、浅い簡易トレイに仕上がります。',
    en: 'This model folds into a simple, shallow tray.',
  },
};
