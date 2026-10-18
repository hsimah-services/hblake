import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Button, Heading, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';

/**
 * A modal confirmation before deleting (WAI-ARIA alert dialog): focus moves in and Tab
 * and Shift+Tab stay inside, Escape or Cancel closes it without deleting, and focus
 * returns to whatever opened it. A native modal dialog alone lets Tab escape to the
 * browser, so the dialog keeps focus itself.
 */
export function ConfirmDelete({ isOpen, title, description, isPending = false, onCancel, onConfirm }: ConfirmDeleteProps) {
  const dialog = useConfirmDelete(isOpen, onCancel);
  return <dialog ref={dialog.element} role="alertdialog" aria-modal="true" aria-labelledby={dialog.titleId} aria-describedby={dialog.descriptionId}
    onCancel={dialog.escape} onKeyDown={dialog.keepFocus} {...stylex.props(styles.dialog)}>
    <Stack gap={3} align="stretch">
      <Heading level={2} id={dialog.titleId}>{title}</Heading>
      <Text id={dialog.descriptionId} color="secondary">{description}</Text>
      <Stack direction="horizontal" gap={2} align="center" xstyle={styles.actions}>
        <Button label="Cancel" onClick={onCancel} />
        <Button label="Delete" variant="destructive" clickAction={onConfirm} isLoading={isPending} />
      </Stack>
    </Stack>
  </dialog>;
}

export type ConfirmDeleteProps = { isOpen: boolean; title: string; description: string; isPending?: boolean; onCancel: () => void; onConfirm: () => void | Promise<void> };

function useConfirmDelete(isOpen: boolean, onCancel: () => void) {
  const element = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const titleId = useId(); const descriptionId = useId();
  useEffect(() => {
    const dialog = element.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) { trigger.current = document.activeElement as HTMLElement | null; dialog.showModal(); }
    if (!isOpen && dialog.open) {
      dialog.close();
      // Return focus to the opener while it still exists; a deleted row's button does not.
      if (trigger.current?.isConnected) trigger.current.focus();
    }
  }, [isOpen]);
  useEffect(() => () => { element.current?.close(); }, []);
  function escape(event: React.SyntheticEvent<HTMLDialogElement>) { event.preventDefault(); onCancel(); }
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const first = buttons[0]; const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return { element, titleId, descriptionId, escape, keepFocus };
}

const styles = stylex.create({
  dialog: {
    width: 'min(28rem, calc(100vw - 2rem))', boxSizing: 'border-box', padding: '1.25rem', borderRadius: 'var(--radius-container)',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-hairline)',
    backgroundColor: 'var(--color-background-surface)', color: 'var(--color-text-primary)',
    boxShadow: '0 24px 60px -24px rgb(0 0 0 / 0.6)',
    '::backdrop': { backgroundColor: 'rgb(0 0 0 / 0.45)' },
  },
  actions: { justifyContent: 'flex-end' },
});
