import { sonobeSolid } from '../engine/sonobe';
import { cappedAntiprism } from '../engine/antiprismScaffold';

// 5-sided rings, 3 levels, 45 intact square modules.
export const sonobePentagonalTowerModel = sonobeSolid('sonobe-pentagonal-tower', '五角の結晶塔', 'Pentagonal Crystal Tower', 5, cappedAntiprism(5, 3));
