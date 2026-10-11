import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Link, Button, Heading, Stack } from '@astryxdesign/core';
import { Markdown } from '../markdown/Markdown';

export function AdminDetail({ kind, row, edit, list, mutate }: AdminDetailProps) {
  const detail = useAdminDetail(row, list, mutate);
  return row ? <article><Heading level={1}>{row.title}</Heading>
    {detail.error && <p role="alert">{detail.error}</p>}
    <p>Status: {row.status}</p><p>Created: {row.createdAt}. Updated: {row.updatedAt}.</p>
    <Stack direction="horizontal" gap={4}><Link href={edit}>Edit</Link>
      <Button label={row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} clickAction={detail.publish} isLoading={detail.pending} />
      <Button label="Delete" onClick={detail.openDelete} />
    </Stack><Markdown content={row.content ?? ''} />{row.enquiryUrl && <a href={row.enquiryUrl}>Enquire</a>}
    <dialog ref={detail.dialog} aria-labelledby="delete-title" onClose={detail.restoreFocus} onKeyDown={detail.keepFocus}>
      <Heading level={2} id="delete-title">Delete {kind}?</Heading><p>This permanently removes the content.</p>
      <Button label="Cancel" onClick={detail.cancelDelete} /><Button label="Confirm delete" clickAction={detail.confirmDelete} isLoading={detail.pending} />
    </dialog>
  </article> : <Heading level={1}>Not found</Heading>;
}

function useAdminDetail(row: AdminDetailProps['row'], list: string, mutate: AdminDetailProps['mutate']) {
  const navigate = useNavigate();
  const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null); const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => () => { dialog.current?.close(); }, []);
  function openDelete() { trigger.current = document.activeElement as HTMLElement; dialog.current?.showModal(); }
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const first = buttons[0]; const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function restoreFocus() { trigger.current?.focus(); }
  function cancelDelete() { dialog.current?.close(); }
  async function publish() {
    if (!row) return; setPending(true); setError('');
    try { await mutate(row.status === 'PUBLISHED' ? 'unpublish' : 'publish', { id: row.id }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Publication failed.'); }
    finally { setPending(false); }
  }
  async function confirmDelete() {
    if (!row) return; setPending(true); setError('');
    try { await mutate('delete', { id: row.id }); dialog.current?.close(); navigate(list); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Delete failed.'); }
    finally { setPending(false); }
  }
  return { error, pending, dialog, openDelete, cancelDelete, confirmDelete, publish, restoreFocus, keepFocus };
}

type AdminDetailRow = { readonly id: string; readonly title: string; readonly status: string; readonly createdAt?: string | null; readonly updatedAt?: string | null; readonly content?: string | null; readonly enquiryUrl?: string | null };
type AdminDetailProps = { kind: string; row?: AdminDetailRow | null; edit: string; list: string; mutate: (action: string, input: Record<string, unknown>) => Promise<Record<string, unknown>> };
