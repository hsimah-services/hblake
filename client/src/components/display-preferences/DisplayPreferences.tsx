import { ButtonGroup, IconButton } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { useColorMode } from '../../useColorMode';
import { useMotion } from '../../useMotion';

/** The colour mode and animation toggles: one Tab stop, arrow keys between them, 44px targets. */
export function DisplayPreferences() {
  const preferences = useDisplayPreferences();
  return <ButtonGroup label="Display preferences" xstyle={styles.group}>
    <IconButton label={preferences.colorLabel} tooltip={preferences.colorLabel} variant="ghost" icon={preferences.dark ? <DisplayPreferences_SunIcon /> : <DisplayPreferences_MoonIcon />} onClick={preferences.toggleColor} xstyle={styles.button} />
    <IconButton label={preferences.motionLabel} tooltip={preferences.motionLabel} variant="ghost" icon={preferences.reduced ? <DisplayPreferences_PlayIcon /> : <DisplayPreferences_PauseIcon />} onClick={preferences.toggleMotion} xstyle={styles.button} />
  </ButtonGroup>;
}

function DisplayPreferences_MoonIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
}

function DisplayPreferences_SunIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" /></svg>;
}

function DisplayPreferences_PauseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M10 9v6M14 9v6" /></svg>;
}

function DisplayPreferences_PlayIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="m10 8.5 5.5 3.5-5.5 3.5z" /></svg>;
}

function useDisplayPreferences() {
  const color = useColorMode(); const motion = useMotion();
  return {
    dark: color.dark, toggleColor: color.toggle, colorLabel: color.dark ? 'Switch to light mode' : 'Switch to dark mode',
    reduced: motion.reduced, toggleMotion: motion.toggle, motionLabel: motion.reduced ? 'Turn on animations' : 'Turn off animations',
  };
}

const styles = stylex.create({
  // One pill around both toggles, with a hairline divider between them. The buttons
  // round their own outer corners rather than the group clipping them, so focus
  // outlines stay visible.
  group: { flexShrink: 0, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-hairline)', borderRadius: '999px' },
  button: {
    justifyContent: 'center', minWidth: '44px', minHeight: '44px', paddingInline: 0, borderColor: 'var(--site-hairline)',
    color: 'var(--color-text-primary)',
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-ink) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-ink) 14%, transparent)' },
    transitionProperty: 'background-color', transitionDuration: 'var(--site-motion)',
    // Of-type, because each button's tooltip renders as a sibling inside the group.
    borderStartStartRadius: { default: 0, ':first-of-type': '999px' }, borderEndStartRadius: { default: 0, ':first-of-type': '999px' },
    borderStartEndRadius: { default: 0, ':last-of-type': '999px' }, borderEndEndRadius: { default: 0, ':last-of-type': '999px' },
  },
});
