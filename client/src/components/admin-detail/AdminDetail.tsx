import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge, Button, Heading, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { Markdown } from '../markdown/Markdown';
import { ConfirmDelete } from '../confirm-delete/ConfirmDelete';
import { AdminTimestamp } from '../admin-timestamp/AdminTimestamp';

export function AdminDetail({ kind, row, edit, list, mutate }: AdminDetailProps) {
  const detail = useAdminDetail(row, list, mutate);
  return row ? <article><Stack gap={4} align="stretch">
    <Stack direction="horizontal" gap={3} align="center" xstyle={styles.header}>
      <Heading level={1}>{row.title}</Heading>
      <Badge label={row.status === 'PUBLISHED' ? 'Published' : 'Draft'} variant={row.status === 'PUBLISHED' ? 'success' : 'neutral'} />
    </Stack>
    {detail.error && <p role="alert">{detail.error}</p>}
    <dl {...stylex.props(styles.facts)}>
      <AdminDetail_Fact label="Created" value={row.createdAt} />
      <AdminDetail_Fact label="Updated" value={row.updatedAt} />
      <AdminDetail_Fact label="Published" value={row.publishedAt} />
    </dl>
    <Stack direction="horizontal" gap={2} align="center" xstyle={styles.actions}>
      <Button href={edit} label="Edit" variant="primary" />
      <Button label={row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} clickAction={detail.publish} isLoading={detail.pending} />
      <Button label="Delete" variant="destructive" onClick={detail.ask} />
    </Stack>
    <section aria-label={`${kind} content`} {...stylex.props(styles.content)}><Markdown content={row.content ?? ''} />{row.enquiryUrl && <a href={row.enquiryUrl}>Enquire</a>}</section>
    <ConfirmDelete isOpen={detail.asking} onCancel={detail.cancel} onConfirm={detail.confirmDelete} isPending={detail.pending}
      title={`Delete “${row.title}”?`} description={`This permanently removes the ${kind.toLowerCase()}. It cannot be undone.`} />
  </Stack></article> : <Heading level={1}>Not found</Heading>;
}

function AdminDetail_Fact({ label, value }: { label: string; value?: string | null }) {
  return <div {...stylex.props(styles.fact)}><dt><Text color="secondary">{label}</Text></dt><dd {...stylex.props(styles.value)}>{value ? <AdminTimestamp value={value} /> : <Text color="secondary">Not yet</Text>}</dd></div>;
}

function useAdminDetail(row: AdminDetailProps['row'], list: string, mutate: AdminDetailProps['mutate']) {
  const navigate = useNavigate();
  const [error, setError] = useState(''); const [pending, setPending] = useState(false); const [asking, setAsking] = useState(false);
  async function publish() {
    if (!row) return; setPending(true); setError('');
    try { await mutate(row.status === 'PUBLISHED' ? 'unpublish' : 'publish', { id: row.id }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Publication failed.'); }
    finally { setPending(false); }
  }
  async function confirmDelete() {
    if (!row) return; setPending(true); setError('');
    try { await mutate('delete', { id: row.id }); setAsking(false); navigate(list); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Delete failed.'); setAsking(false); }
    finally { setPending(false); }
  }
  return { error, pending, asking, publish, confirmDelete, ask: () => { setAsking(true); }, cancel: () => { setAsking(false); } };
}

type AdminDetailRow = { readonly id: string; readonly title: string; readonly status: string; readonly createdAt?: string | null; readonly updatedAt?: string | null; readonly publishedAt?: string | null; readonly content?: string | null; readonly enquiryUrl?: string | null };
type AdminDetailProps = { kind: string; row?: AdminDetailRow | null; edit: string; list: string; mutate: (action: string, input: Record<string, unknown>) => Promise<Record<string, unknown>> };

const styles = stylex.create({
  header: { flexWrap: 'wrap' },
  facts: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem 2rem', margin: 0 },
  fact: { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  value: { margin: 0 },
  actions: { flexWrap: 'wrap' },
  content: { borderTop: '1px solid var(--site-hairline)', paddingTop: '1rem', maxWidth: '52rem' },
});
