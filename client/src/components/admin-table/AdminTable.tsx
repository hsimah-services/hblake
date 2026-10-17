import { useEffect, useRef, useState } from 'react';
import { Table, proportional, pixel } from '@astryxdesign/core/Table';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge, Button, Heading, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { ConfirmDelete } from '../confirm-delete/ConfirmDelete';
import { AdminTimestamp } from '../admin-timestamp/AdminTimestamp';

/**
 * A content type's records as a table (spec/ui/admin.yml `list`): open, edit or delete
 * each one, add a new one, and page through with the cursor in the URL.
 */
export function AdminTable({ kind, plural, rows, published = false, create, next, detail, edit, remove }: AdminTableProps) {
  const table = useAdminTable(kind, rows, remove);
  const columns = [
    // Like WordPress, a record's actions sit under its title, so they stay in view on narrow
    // screens where the later columns scroll. They are always shown, not only on hover.
    { key: 'title', header: 'Title', width: proportional(3), renderCell: (row: AdminTableRow) => <Stack gap={1} align="start">
      <Link href={detail(row.id)} weight="semibold" hasUnderline>{row.title}</Link>
      <Stack direction="horizontal" gap={1} align="center" xstyle={styles.actions}>
        <Link href={detail(row.id)} aria-label={`View “${row.title}”`} xstyle={styles.action}>View</Link>
        <Link href={edit(row.id)} aria-label={`Edit “${row.title}”`} xstyle={styles.action}>Edit</Link>
        <Button label="Delete" aria-label={`Delete “${row.title}”`} variant="ghost" onClick={() => { table.ask(row); }} xstyle={styles.action} />
      </Stack>
    </Stack> },
    { key: 'slug', header: 'Slug', width: proportional(2), renderCell: (row: AdminTableRow) => <Text color="secondary">{row.slug}</Text> },
    { key: 'status', header: 'Status', width: pixel(120), renderCell: (row: AdminTableRow) => <Badge label={row.status === 'PUBLISHED' ? 'Published' : 'Draft'} variant={row.status === 'PUBLISHED' ? 'success' : 'neutral'} /> },
    ...(published ? [{ key: 'publishedAt', header: 'Published', width: pixel(150), renderCell: (row: AdminTableRow) => row.publishedAt ? <AdminTimestamp value={row.publishedAt} /> : <Text color="secondary">Not yet</Text> }] : []),
    { key: 'updatedAt', header: 'Updated', width: pixel(150), renderCell: (row: AdminTableRow) => row.updatedAt ? <AdminTimestamp value={row.updatedAt} /> : null },
  ];
  return <Stack gap={4} align="stretch">
    <Stack direction="horizontal" gap={4} align="center" xstyle={styles.header}>
      <Heading level={1} ref={table.heading} tabIndex={-1}>{plural}</Heading>
      <Button href={create} label={`Add new ${kind.toLowerCase()}`} variant="primary" />
    </Stack>
    {table.notice && <p role="status">{table.notice}</p>}
    {table.error && <p role="alert">{table.error}</p>}
    {table.rows.length === 0
      ? <EmptyState title={`No ${plural.toLowerCase()} yet`} description={`Add your first ${kind.toLowerCase()} to get started.`} headingLevel={2} actions={<Button href={create} label={`Add new ${kind.toLowerCase()}`} />} />
      : <Table data={table.rows} columns={columns} idKey="id" hasHover verticalAlign="middle" />}
    {next && <Link href={next} xstyle={styles.next}>Next page</Link>}
    <ConfirmDelete isOpen={table.target != null} onCancel={table.cancel} onConfirm={table.confirm} isPending={table.pending}
      title={`Delete “${table.target?.title ?? ''}”?`} description={`This permanently removes the ${kind.toLowerCase()}. It cannot be undone.`} />
  </Stack>;
}

export type AdminTableRow = { readonly id: string; readonly title: string; readonly slug: string; readonly status: string; readonly updatedAt?: string | null; readonly publishedAt?: string | null; readonly [field: string]: unknown };

function useAdminTable(kind: string, rows: AdminTableProps['rows'], remove: AdminTableProps['remove']) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [target, setTarget] = useState<AdminTableRow | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  // Deleted rows leave the table at once; re-running the route would remount the screen
  // and lose the focus placed on its heading.
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  // The deleted row's button is gone, so focus moves to the screen heading. This runs
  // after ConfirmDelete's own effect has closed the modal (the page is inert while open).
  const [focusHeading, setFocusHeading] = useState(false);
  useEffect(() => {
    if (!focusHeading || target) return;
    heading.current?.focus(); setFocusHeading(false);
  }, [focusHeading, target]);
  async function confirm() {
    if (!target) return;
    setPending(true); setError('');
    try {
      await remove(target.id);
      setNotice(`Deleted ${kind.toLowerCase()} “${target.title}”.`);
      setRemoved(previous => new Set(previous).add(target.id));
      setTarget(null); setFocusHeading(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Delete failed.'); setTarget(null); }
    finally { setPending(false); }
  }
  return {
    rows: (rows ?? []).filter((row): row is AdminTableRow => row != null && !removed.has(row.id)), heading, target, pending, notice, error, confirm,
    ask: (row: AdminTableRow) => { setNotice(''); setTarget(row); }, cancel: () => { setTarget(null); },
  };
}

type AdminTableProps = {
  kind: string; plural: string; rows?: readonly (AdminTableRow | null | undefined)[] | null; published?: boolean;
  create: string; next?: string; detail: (id: string) => string; edit: (id: string) => string; remove: (id: string) => Promise<unknown>;
};

const styles = stylex.create({
  header: { flexWrap: 'wrap', justifyContent: 'space-between' },
  actions: { marginInlineStart: '-0.5rem' },
  // Comfortable targets: 32px with a pointer, 44px on touch-sized screens.
  action: { minHeight: { default: '32px', '@media (max-width: 760px)': '44px' }, display: 'inline-flex', alignItems: 'center', paddingInline: '0.5rem' },
  next: { alignSelf: 'flex-start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
});
