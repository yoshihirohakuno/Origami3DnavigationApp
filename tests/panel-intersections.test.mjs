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
