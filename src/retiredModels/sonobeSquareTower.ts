import { sonobeSolid } from '../engine/sonobe';
import { cappedAntiprism } from '../engine/antiprismScaffold';

// 4-sided rings, 3 levels, 36 intact square modules.
export const sonobeSquareTowerModel = sonobeSolid('sonobe-square-tower', '四角の結晶塔', 'Square Crystal Tower', 5, cappedAntiprism(4, 3));
