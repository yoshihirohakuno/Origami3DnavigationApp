import { sonobeSolid } from '../engine/sonobe';
import { cappedAntiprism } from '../engine/antiprismScaffold';

// 3-sided rings, 3 levels, 27 intact square modules.
export const sonobeTriangularTowerModel = sonobeSolid('sonobe-triangular-tower', '三角の結晶塔', 'Triangular Crystal Tower', 5, cappedAntiprism(3, 3));
