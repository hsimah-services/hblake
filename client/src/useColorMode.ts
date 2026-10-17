import { use } from 'react';
import { COLOR_MODE_CONTEXT } from './ColorMode';

/** The active colour scheme and a toggle that switches to the other one. */
export function useColorMode() { return use(COLOR_MODE_CONTEXT); }
