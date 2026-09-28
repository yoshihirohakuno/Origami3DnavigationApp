import { sonobeSolid } from '../engine/sonobe';
import { cappedAntiprism } from '../engine/antiprismScaffold';

// 3-sided rings, 4 levels, 36 intact square modules.
export const sonobeTwistedTowerModel = sonobeSolid('sonobe-twisted-tower', 'ねじれ結晶の塔', 'Twisted Crystal Tower', 5, cappedAntiprism(3, 4));
