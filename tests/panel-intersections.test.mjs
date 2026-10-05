import test from 'node:test';
import assert from 'node:assert/strict';
import {trianglesCross,intersectingPanels} from '../tools/panel-intersections.mjs';
const triangle=points=>points.map(([x,y,z])=>({x,y,z}));
const flat=triangle([[-1,-1,0],[1,-1,0],[0,1,0]]);
test('paper intersection diagnostic detects a transverse interior crossing',()=>{
 const upright=triangle([[0,-.5,-1],[0,-.5,1],[0,.5,1]]);
 assert.ok(trianglesCross(flat,upright));
 assert.ok(trianglesCross(upright,flat));
 assert.deepEqual(intersectingPanels([[0,0,1,2],[1,3,4,5]],[...flat,...upright]),[[0,1]]);
});
test('coplanar stacks, crease contact, and separated paper are not crossings',()=>{
 assert.ok(!trianglesCross(flat,flat));
 assert.ok(!trianglesCross(flat,triangle([[-1,-1,0],[1,-1,0],[0,-1,1]])));
 assert.ok(!trianglesCross(flat,triangle([[0,2,-1],[0,2,1],[0,3,1]])));
 assert.ok(!trianglesCross(flat,flat.map(p=>({...p,z:.01}))));
});
test('floating point drift at a crease is not reported as an interior crossing',()=>{
 const shifted=flat.map(p=>({...p,z:2e-9}));
 const hinged=triangle([[0,-.5,0],[0,.5,0],[0,-.5,1]]);
 assert.ok(!trianglesCross(shifted,hinged));
 const shallow=triangle([[-.5,0,-2e-9],[.5,0,-2e-9],[0,1,.001]]);
 assert.ok(!trianglesCross(flat,shallow),'a nearly touching hinge does not straddle both planes');
});

test('a noisy thin panel plane touching another panel hinge is not an interior crossing',()=>{
 const thin=triangle([[.03549136,-.65,1.38e-9],[.000085596,-.38,-4e-9],[0,-.380085596,0]]);
 const hinged=triangle([[.07380403,-.45738923,-3.3e-9],[-.10239346,-.55911688,.20478688],[0,-.5,0]]);
 assert.ok(!trianglesCross(thin,hinged));
 assert.ok(!trianglesCross(hinged,thin));
 const shallow=triangle([[0,-.5,-1.175e-8],[-.000493,-.73561,.02007],[-.0586,-.53383,-5.477e-9]]);
 const flatThin=triangle([[-.030124,-.67698,-1.83e-9],[0,-.604256,2.18e-9],[0,-.380086,0]]);
 assert.ok(!trianglesCross(flatThin,shallow),'shallow motion must not amplify numerical hinge drift');
});

test('a thin panel with a real crossing through both interiors is detected',()=>{
 const thin=triangle([[-1,0,0],[1,0,0],[0,.0001,0]]);
 const cutting=triangle([[0,-.0001,-1],[0,.0002,-1],[0,.00005,1]]);
 assert.ok(trianglesCross(thin,cutting));
 assert.ok(trianglesCross(cutting,thin));
});
