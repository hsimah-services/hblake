import { useEffect, useRef, useState } from 'react';
import { Table, proportional, pixel, useTableSortable, type TableSortState } from '@astryxdesign/core/Table';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge, Button, Heading, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { ConfirmDelete } from '../confirm-delete/ConfirmDelete';
import { AdminIcon } from '../admin-icon/AdminIcon';
import { AdminTimestamp } from '../admin-timestamp/AdminTimestamp';

/**
 * A content type's records as a table (spec/ui/admin.yml `list`): open, edit or delete
 * each one, add a new one, sort by column, filter by status from the URL (?status=draft)
 * and page through with the cursor in the URL.
 */
export function AdminTable({ kind, plural, rows, published = false, status, create, next, detail, edit, remove, filtered }: AdminTableProps) {
  const table = useAdminTable(kind, rows, remove, status);
  const columns = [
    { key: 'title', header: 'Title', width: proportional(3), sortable: true, renderCell: (row: AdminTableRow) => <Link href={detail(row.id)} weight="semibold" size="lg" color="inherit" xstyle={styles.title}>{row.title}</Link> },
    // Actions follow the title so they stay on screen on phones, where later columns scroll.
    { key: 'actions', header: 'Actions', width: pixel(190), renderCell: (row: AdminTableRow) => <Stack direction="horizontal" gap={1} align="center" xstyle={styles.actions}>
      <Button href={edit(row.id)} label="Edit" aria-label={`Edit “${row.title}”`} variant="ghost" size="sm" icon={<AdminIcon name="edit" />} xstyle={styles.action} />
      <Button label="Delete" aria-label={`Delete “${row.title}”`} variant="ghost" size="sm" icon={<AdminIcon name="delete" />} onClick={() => { table.ask(row); }} xstyle={styles.action} />
    </Stack> },
    { key: 'slug', header: 'Slug', width: proportional(2), sortable: true, renderCell: (row: AdminTableRow) => <Text color="secondary">{row.slug}</Text> },
    { key: 'status', header: 'Status', width: pixel(130), sortable: true, renderCell: (row: AdminTableRow) => <Badge label={row.status === 'PUBLISHED' ? 'Published' : 'Draft'} variant={row.status === 'PUBLISHED' ? 'success' : 'neutral'} /> },
    ...(published ? [{ key: 'publishedAt', header: 'Published', width: pixel(160), sortable: true, renderCell: (row: AdminTableRow) => row.publishedAt ? <AdminTimestamp value={row.publishedAt} /> : <Text color="secondary">Not yet</Text> }] : []),
    { key: 'updatedAt', header: 'Updated', width: pixel(160), sortable: true, renderCell: (row: AdminTableRow) => row.updatedAt ? <AdminTimestamp value={row.updatedAt} /> : null },
  ];
  return <Stack gap={4} align="stretch">
    <Stack direction="horizontal" gap={4} align="center" xstyle={styles.header}>
      <Heading level={1} ref={table.heading} tabIndex={-1}>{plural}</Heading>
      <Button href={create} label={`New ${kind.toLowerCase()}`} variant="primary" icon={<AdminIcon name="plus" />} />
    </Stack>
    {table.filter && <Stack direction="horizontal" gap={2} align="center" xstyle={styles.filter}>
      <Text>Showing <Text weight="semibold">{table.filter}</Text> only.</Text>
      <Link href={filtered(undefined)} hasUnderline>Show all {plural.toLowerCase()}</Link>
    </Stack>}
    {table.notice && <p role="status">{table.notice}</p>}
    {table.error && <p role="alert">{table.error}</p>}
    {table.rows.length === 0
      ? <EmptyState title={table.filter ? `No ${table.filter} on this page` : `No ${plural.toLowerCase()} yet`} description={table.filter ? 'Try the next page, or show everything.' : `Add your first ${kind.toLowerCase()} to get started.`} headingLevel={2} actions={<Button href={create} label={`New ${kind.toLowerCase()}`} icon={<AdminIcon name="plus" />} />} />
      : <Table data={table.rows} columns={columns} idKey="id" hasHover verticalAlign="middle" plugins={{ sortable: table.sortable }} />}
    {table.rows.length > 0 && <Text color="secondary" size="sm">Sorting and the status filter apply to this page of up to 20 records.</Text>}
    {next && <Button href={next} label="Next" variant="ghost" endContent={<AdminIcon name="next" />} xstyle={styles.next} />}
    <ConfirmDelete isOpen={table.target != null} onCancel={table.cancel} onConfirm={table.confirm} isPending={table.pending}
      title={`Delete “${table.target?.title ?? ''}”?`} description={`This permanently removes the ${kind.toLowerCase()}. It cannot be undone.`} />
  </Stack>;
}

export type AdminTableRow = { readonly id: string; readonly title: string; readonly slug: string; readonly status: string; readonly updatedAt?: string | null; readonly publishedAt?: string | null; readonly [field: string]: unknown };

function useAdminTable(kind: string, rows: AdminTableProps['rows'], remove: AdminTableProps['remove'], status: string | undefined) {
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
  const [sort, setSort] = useState<TableSortState<string>>([]);
  const sortable = useTableSortable<AdminTableRow>({ sort, onSortChange: setSort, allowUnsortedState: true });
  const wanted = status?.toLowerCase() === 'draft' ? 'DRAFT' : status?.toLowerCase() === 'published' ? 'PUBLISHED' : null;
  const visible = (rows ?? []).filter((row): row is AdminTableRow => row != null && !removed.has(row.id) && (wanted === null || row.status === wanted));
  return {
    rows: sortRows(visible, sort[0]), sortable, filter: wanted === 'DRAFT' ? 'drafts' : wanted === 'PUBLISHED' ? 'published' : null,
    heading, target, pending, notice, error, confirm,
    ask: (row: AdminTableRow) => { setNotice(''); setTarget(row); }, cancel: () => { setTarget(null); },
  };
}

/** Orders rows by one column; text compares naturally, missing values sort last. */
function sortRows(rows: AdminTableRow[], by: TableSortState<string>[number] | undefined): AdminTableRow[] {
  if (!by) return rows;
  const direction = by.direction === 'ascending' ? 1 : -1;
  const text = (row: AdminTableRow) => { const value = row[by.sortKey]; return typeof value === 'string' ? value : ''; };
  return [...rows].sort((a, b) => {
    const first = text(a); const second = text(b);
    if (!first || !second) return first === second ? 0 : first ? -1 : 1;
    return direction * first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
  });
}

type AdminTableProps = {
  kind: string; plural: string; rows?: readonly (AdminTableRow | null | undefined)[] | null; published?: boolean;
  create: string; next?: string; detail: (id: string) => string; edit: (id: string) => string; remove: (id: string) => Promise<unknown>;
  /** The status filter from the URL (`draft` or `published`), and the list URL for a filter. */
  status?: string; filtered: (status: 'draft' | 'published' | undefined) => string;
};

const styles = stylex.create({
  header: { flexWrap: 'wrap', justifyContent: 'space-between' },
  // The title is the cell's only content, so no resting underline is needed (WCAG 1.4.1
  // concerns links in running text); hover and keyboard focus still underline it.
  title: { textDecoration: { default: 'none', ':hover': 'underline', ':focus-visible': 'underline' }, textUnderlineOffset: '0.2em' },
  actions: { marginInlineStart: '-0.5rem' },
  filter: { flexWrap: 'wrap' },
  // Comfortable targets: 32px with a pointer, 44px on touch-sized screens.
  action: { minHeight: { default: '32px', '@media (max-width: 760px)': '44px' }, display: 'inline-flex', alignItems: 'center', paddingInline: '0.5rem' },
  next: { alignSelf: 'flex-start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
});
