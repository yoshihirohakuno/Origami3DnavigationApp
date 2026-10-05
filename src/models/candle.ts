import { flatSequence } from '../engine/flatSequence';

// easy/other/candle2/candle/zu.gif. Omit only panel 1's crease preparation.
// Panel 2: side points and bottom point meet the center (x=±.5, y=-.5).
// Panel 3's horizontal shaping crease has no fractional mark: measured y≈.175
// in panel 3; the exposed flame in panels 4/5 implies y≈.19. Use .185.
// Panel 4's side lines are at the quarter points of the folded width (x=±.25).
const lift = .185;
export const candleModel = flatSequence({
  id:'candle',name:{ja:'キャンドル',en:'Candle'},difficulty:2,
  sheetColors:[{front:'#efab56',back:'#fffaf0'}],
}, [[0,1],[-1,0],[0,-1],[1,0]], false, [
  { moves:[{line:[[-.5,-1],[-.5,1]],side:1}],
    description:{ja:'左の角を紙の中心へ折ります。',en:'Fold the left point to the center of the paper.'},
    caution:{ja:'正方形1枚を、色の面を上にしてひし形に置きます。色の面が炎、白い面がろうそくの本体になります。',en:'Place one square as a diamond, colored side up. The colored side makes the flame; the white side makes the candle body.'} },
  { moves:[{line:[[.5,-1],[.5,1]],side:-1}],
    description:{ja:'右の角も紙の中心へ折ります。',en:'Fold the right point to the center too.'} },
  { moves:[{line:[[-1,-.5],[1,-.5]],side:-1}],
    description:{ja:'下の角を紙の中心へ折ります。上の角は残しておきます。',en:'Fold the bottom point to the center. Leave the top point unfolded.'} },
  { moves:[{line:[[-1,lift],[1,lift]],side:-1}],
    description:{ja:'下側を折り上げ、上の色の三角を少しだけ残します。',en:'Fold the lower section up, leaving a small colored triangle showing at the top.'},
    caution:{ja:'先の小さい三角が炎になります。表示の折り線に合わせ、左右のふちをそろえます。',en:'The small triangle becomes the flame. Follow the displayed fold line and align the side edges.'} },
  { moves:[{line:[[-.25,-1],[-.25,1]],side:1,type:'mountain'}],
    description:{ja:'左のふちを、中央に合わせるように後ろへ折ります。',en:'Fold the left edge behind toward the center.'} },
  { moves:[{line:[[.25,-1],[.25,1]],side:-1,type:'mountain'}],
    description:{ja:'右のふちも後ろへ折り、細いキャンドルにして完成です。',en:'Fold the right edge behind as well to finish the slim candle.'},
    caution:{ja:'炎の色が上に見える、平らな飾りになります。',en:'The result is a flat decoration with a colored flame showing at the top.'} },
],1e-9);
candleModel.renderLayerSeparation=.00004;
