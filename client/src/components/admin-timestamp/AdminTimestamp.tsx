import { useRef } from 'react';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import * as stylex from '@stylexjs/stylex';

/**
 * A relative time ("2 hours ago") whose absolute time shows on hover (Astryx's card),
 * is its accessible name, and also shows while it has keyboard focus: Astryx's card
 * does not open on focus, so this adds a small card for sighted keyboard users. The
 * card toggles its `hidden` attribute directly: re-rendering Timestamp remounts its
 * <time> and would drop focus.
 */
export function AdminTimestamp({ value }: { value: string }) {
  const stamp = useAdminTimestamp(value);
  return <span onFocus={stamp.show} onBlur={stamp.hide} {...stylex.props(styles.wrap)}>
    <Timestamp value={value} format="relative" />
    <span ref={stamp.card} hidden aria-hidden="true" {...stylex.props(styles.card)}>{stamp.absolute}</span>
  </span>;
}

function useAdminTimestamp(value: string) {
  const card = useRef<HTMLSpanElement>(null);
  const absolute = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'long' }).format(new Date(value));
  return {
    card, absolute,
    show: () => { if (card.current) card.current.hidden = false; },
    hide: () => { if (card.current) card.current.hidden = true; },
  };
}

const styles = stylex.create({
  wrap: { position: 'relative', display: 'inline-block' },
  card: {
    position: 'absolute', top: 'calc(100% + 0.35rem)', insetInlineStart: 0, zIndex: 5, whiteSpace: 'nowrap',
    paddingBlock: '0.35rem', paddingInline: '0.6rem', borderRadius: 'var(--radius-inner)', fontSize: '0.85rem',
    backgroundColor: 'var(--color-background-popover)', color: 'var(--color-text-primary)',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-hairline)', boxShadow: '0 8px 24px -12px rgb(0 0 0 / 0.5)',
  },
});
