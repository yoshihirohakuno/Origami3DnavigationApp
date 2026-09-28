import { sonobeSolid } from '../engine/sonobe';
import { cappedAntiprism } from '../engine/antiprismScaffold';

// 4-sided rings, 2 levels, 24 intact square modules.
export const sonobeCrownModel = sonobeSolid('sonobe-crown', '星のクラウン', 'Star Crown', 5, cappedAntiprism(4, 2));
