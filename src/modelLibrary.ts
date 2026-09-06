import { dogModel } from './models/dog';
import { cupModel } from './models/cup';
import { tulipModel } from './models/tulip';
import { chickModel } from './models/chick';
import { squareBaseModel } from './models/squareBase';
import { craneModel } from './models/crane';
import { shurikenModel } from './models/shuriken';
import { catModel } from './models/cat';
import { foxModel } from './models/fox';
import { rabbitModel } from './models/rabbit';
import { pandaModel } from './models/panda';
import { whaleModel } from './models/whale';
import { bearModel } from './models/bear';
import { helmetModel } from './models/helmet';
import { heartModel } from './models/heart';
import { boxModel } from './models/box';
import { yachtModel } from './models/yacht';
import { penguinModel } from './models/penguin';
import { shipModel } from './models/ship';
import { rocketModel } from './models/rocket';
import { envelopeModel } from './models/envelope';
import { pianoModel } from './models/piano';
import { turtleModel } from './models/turtle';
import { sinkansenModel } from './models/sinkansen';
import { bootsModel } from './models/boots';
import { waterbombBaseModel } from './models/waterbombBase';
import { riceballModel } from './models/riceball';
import { tadpoleModel } from './models/tadpole';
import { carModel } from './models/car';
import { busModel } from './models/bus';
import { elephantModel } from './models/elephant';
import { pizzaModel } from './models/pizza';
import { acornModel } from './models/acorn';
import type { OrigamiModel, LocalizedText } from './engine/types';
import { withoutCreasePreparation } from './engine/withoutCreasePreparation';

// Source routes retain the original step numbers used by the layer compilers.
// All user-facing consumers share the shortened routes exported as MODELS.
const SOURCES: OrigamiModel[] = [
  tulipModel,
  dogModel,
  cupModel,
  chickModel,
  squareBaseModel,
  craneModel,
  shurikenModel,
  catModel,
  foxModel,
  rabbitModel,
  pandaModel,
  bearModel,
  whaleModel,
  helmetModel,
  heartModel,
  boxModel,
  yachtModel,
  penguinModel,
  shipModel,
  rocketModel,
  envelopeModel,
  pianoModel,
  turtleModel,
  sinkansenModel,
  bootsModel,
  waterbombBaseModel,
  riceballModel,
  tadpoleModel,
  carModel,
  busModel,
  elephantModel,
  pizzaModel,
  acornModel,
];

function wording(text: LocalizedText): LocalizedText {
  return {
    ja: text.ja.replaceAll('まんなかの折り目', '紙の中心線')
      .replaceAll('よこの折り目', 'よこの中心線')
      .replaceAll('折りすじに沿って', '表示の折り線に沿って')
      .replaceAll('左右の折りすじ', '左右の折り線'),
    en: text.en.replace(/\b(center|middle|horizontal) crease\b/g, '$1 line')
      .replaceAll('along the creases', 'along the displayed fold lines')
      .replaceAll('side creases', 'side fold lines'),
  };
}

function initialSide(model: OrigamiModel): LocalizedText {
  const face = model.faces.find(f => f.length >= 3)!;
  const area = face.reduce((sum, vi, i) => {
    const p = model.vertices[vi], q = model.vertices[face[(i + 1) % face.length]];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  return area > 0
    ? { ja: '色の面を上にして始めます。', en: 'Start with the colored side up.' }
    : { ja: '白い面を上にして始めます。', en: 'Start with the white side up.' };
}

export const MODELS: OrigamiModel[] = SOURCES.map(source => {
  const short = withoutCreasePreparation(source);
  if (short === source) return source;
  const steps = short.steps.map(step => ({ ...step, description: wording(step.description),
    ...(step.caution ? { caution: wording(step.caution) } : {}) }));
  if (source.id === 'envelope') steps[0].description = {
    ja: '下のふちと紙の中心線の間を3等分し、下から3分の1の線で折り上げます。',
    en: 'Divide the space between the bottom edge and the center line into thirds. Fold up along the lowest third line.',
  };
  if (source.id === 'turtle') {
    steps[0].description = { ja: '右上の角を、左上と右下を結ぶ対角線に平行な線で左下へ折ります。',
      en: 'Fold the top-right corner down along a line parallel to the top-left-to-bottom-right diagonal.' };
    steps[0].caution = { ja: '角の先は、左下と右上を結ぶ対角線の上に来ます。うらの色が出ます。',
      en: 'The corner lands on that diagonal, showing the reverse side.' };
    steps[1].description = { ja: '左下と右上を結ぶ対角線で、半分に折ります。',
      en: 'Fold in half along the bottom-left-to-top-right diagonal.' };
  }
  if (source.id === 'whale') steps[0].caution = {
    ja: '辺が紙の中心線にぴったり重なります。右が細くとがって、尾になります。',
    en: 'The edges meet the center line. The right end becomes the pointed tail.',
  };
  if (source.id === 'piano') steps[1].description = {
    ja: steps[1].description.ja,
    en: 'Fold the top-left corner along the line from the midpoint of the left edge to the midpoint of the top edge.',
  };
  if (source.id === 'riceball') steps[1].caution = {
    ja: '先ほどの折りで短くなっているので上を全部は覆わず、上が白・下がのりの三角になります。',
    en: steps[1].caution!.en,
  };
  // Preserve the starting side when the old first step was just preparation.
  if (short.steps[0] !== source.steps[0]) {
    const side = initialSide(source), caution = steps[0].caution;
    steps[0].caution = {
      ja: side.ja + (caution ? ' ' + caution.ja : ''),
      en: side.en + (caution ? ' ' + caution.en : ''),
    };
  }
  return { ...short, steps };
});
