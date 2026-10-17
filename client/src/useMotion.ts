import { use } from 'react';
import { MOTION_CONTEXT } from './Motion';

/** Whether animations are off, and a toggle that turns them on or off. */
export function useMotion() { return use(MOTION_CONTEXT); }
