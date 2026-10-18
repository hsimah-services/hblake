import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Table, proportional, pixel, useTableSortable, type TableSortState } from '@astryxdesign/core/Table';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge, Button, Heading, Link, Stack, Text, TextInput } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import * as stylex from '@stylexjs/stylex';
import { ConfirmDelete } from '../confirm-delete/ConfirmDelete';
import { AdminIcon } from '../admin-icon/AdminIcon';
import { AdminTimestamp } from '../admin-timestamp/AdminTimestamp';

/**
 * A content type's records as a table (spec/ui/admin.yml `list`): open, edit or delete
 * each one, add a new one, sort by column, filter by status from the URL (?status=draft)
 * and page through with the cursor in the URL.
 */
export function AdminTable({ kind, plural, rows, published = false, status, q, create, next, detail, edit, remove, publish, listUrl }: AdminTableProps) {
  const table = useAdminTable(kind, rows, remove, status, q, listUrl);
  const columns = [
    { key: 'title', header: 'Title', width: proportional(3), sortable: true, renderCell: (row: AdminTableRow) => <Link href={detail(row.id)} weight="semibold" size="lg" color="inherit" xstyle={styles.title}>{row.title}</Link> },
    // Actions follow the title so they stay on screen on phones, where later columns scroll.
    // On phones the actions are 44px icon buttons (an icon-only button's label is its
    // accessible name, so it carries the title; the tooltip shows the short verb) so the
    // cell fits beside the title.
    { key: 'actions', header: 'Actions', width: pixel(table.narrow ? 150 : 300), renderCell: (row: AdminTableRow) => <Stack direction="horizontal" gap={1} align="center" xstyle={styles.actions}>
      <Button href={edit(row.id)} label={table.narrow ? `Edit “${row.title}”` : 'Edit'} aria-label={`Edit “${row.title}”`} tooltip={table.narrow ? 'Edit' : undefined} isIconOnly={table.narrow} variant="ghost" size="sm" icon={<AdminIcon name="edit" />} xstyle={styles.action} />
      <Button label={table.narrow ? `${row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} “${row.title}”` : row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} aria-label={`${row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} “${row.title}”`} tooltip={table.narrow ? (row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish') : undefined} isIconOnly={table.narrow} variant="ghost" size="sm"
        icon={<AdminIcon name={row.status === 'PUBLISHED' ? 'unpublish' : 'publish'} />} clickAction={() => table.togglePublication(row, publish)} xstyle={styles.action} />
      <Button label={table.narrow ? `Delete “${row.title}”` : 'Delete'} aria-label={`Delete “${row.title}”`} tooltip={table.narrow ? 'Delete' : undefined} isIconOnly={table.narrow} variant="ghost" size="sm" icon={<AdminIcon name="delete" />} onClick={() => { table.ask(row); }} xstyle={styles.action} />
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
    <Stack direction="horizontal" gap={4} align="center" xstyle={styles.toolbar}>
      <nav aria-label="Filter by status"><Stack direction="horizontal" gap={1} align="center">
        {table.statusLinks.map(link => <Link key={link.label} href={link.href} aria-current={link.current ? 'page' : undefined} color="inherit" xstyle={[styles.statusLink, link.current && styles.statusCurrent]}>{link.label}</Link>)}
      </Stack></nav>
      <form role="search" onSubmit={table.search} {...stylex.props(styles.search)}>
        <TextInput label="Search titles" isLabelHidden htmlName="q" placeholder="Search titles" value={table.query} onChange={table.setQuery} size="sm" />
        <Button type="submit" label="Search" size="sm" />
      </form>
    </Stack>
    {(table.filter || q) && <Stack direction="horizontal" gap={2} align="center" xstyle={styles.filter}>
      <Text>Showing {table.filter ? <Text weight="semibold">{table.filter}</Text> : 'records'}{q ? <> matching <Text weight="semibold">“{q}”</Text></> : null} only.</Text>
      <Link href={listUrl({})} hasUnderline>Show all {plural.toLowerCase()}</Link>
    </Stack>}
    {table.notice && <p role="status">{table.notice}</p>}
    {table.error && <p role="alert">{table.error}</p>}
    {table.rows.length === 0
      ? <EmptyState title={table.filter ? `No ${table.filter} on this page` : `No ${plural.toLowerCase()} yet`} description={table.filter ? 'Try the next page, or show everything.' : `Add your first ${kind.toLowerCase()} to get started.`} headingLevel={2} actions={<Button href={create} label={`New ${kind.toLowerCase()}`} icon={<AdminIcon name="plus" />} />} />
      : <Table data={table.rows} columns={columns} idKey="id" hasHover verticalAlign="middle" plugins={{ sortable: table.sortable }} />}
    {table.rows.length > 0 && <Text color="secondary" size="sm">Sorting, the status filter and search apply to this page of up to 20 records.</Text>}
    {next && <Button href={next} label="Next" variant="ghost" endContent={<AdminIcon name="next" />} xstyle={styles.next} />}
    <ConfirmDelete isOpen={table.target != null} onCancel={table.cancel} onConfirm={table.confirm} isPending={table.pending}
      title={`Delete “${table.target?.title ?? ''}”?`} description={`This permanently removes the ${kind.toLowerCase()}. It cannot be undone.`} />
  </Stack>;
}

export type AdminTableRow = { readonly id: string; readonly title: string; readonly slug: string; readonly status: string; readonly updatedAt?: string | null; readonly publishedAt?: string | null; readonly [field: string]: unknown };

function useAdminTable(kind: string, rows: AdminTableProps['rows'], remove: AdminTableProps['remove'], status: string | undefined, q: string | undefined, listUrl: AdminTableProps['listUrl']) {
  const navigate = useNavigate();
  const narrow = useMediaQuery('(max-width: 760px)');
  const [query, setQuery] = useState(q ?? '');
  useEffect(() => { setQuery(q ?? ''); }, [q]);
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
  const needle = q?.trim().toLocaleLowerCase() ?? '';
  const visible = (rows ?? []).filter((row): row is AdminTableRow => row != null && !removed.has(row.id) && (wanted === null || row.status === wanted)
    && (needle === '' || row.title.toLocaleLowerCase().includes(needle)));
  const term = needle === '' ? undefined : q?.trim();
  const statusLinks = ([['All', undefined], ['Published', 'published'], ['Drafts', 'draft']] as const).map(([label, value]) => ({
    label, href: listUrl({ status: value, q: term }), current: (value === 'draft' ? 'DRAFT' : value === 'published' ? 'PUBLISHED' : null) === wanted,
  }));
  async function togglePublication(row: AdminTableRow, publish: AdminTableProps['publish']) {
    setError('');
    try { await publish(row); setNotice(`${row.status === 'PUBLISHED' ? 'Unpublished' : 'Published'} “${row.title}”.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Publication failed.'); }
  }
  function search(event: FormEvent) {
    event.preventDefault();
    navigate(listUrl({ status: wanted === 'DRAFT' ? 'draft' : wanted === 'PUBLISHED' ? 'published' : undefined, q: query.trim() || undefined }));
  }
  return {
    rows: sortRows(visible, sort[0]), sortable, filter: wanted === 'DRAFT' ? 'drafts' : wanted === 'PUBLISHED' ? 'published' : null,
    narrow, heading, target, pending, notice, error, confirm, statusLinks, query, setQuery, search, togglePublication,
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
  /** The status and title filters from the URL, and the list URL for a filter. */
  status?: string; q?: string; listUrl: (params: { status?: 'draft' | 'published'; q?: string }) => string;
  publish: (row: AdminTableRow) => Promise<unknown>;
};

const styles = stylex.create({
  header: { flexWrap: 'wrap', justifyContent: 'space-between' },
  // The title is the cell's only content, so no resting underline is needed (WCAG 1.4.1
  // concerns links in running text); hover and keyboard focus still underline it.
  title: { textDecoration: { default: 'none', ':hover': 'underline', ':focus-visible': 'underline' }, textUnderlineOffset: '0.2em' },
  actions: { marginInlineStart: '-0.5rem' },
  filter: { flexWrap: 'wrap' },
  toolbar: { flexWrap: 'wrap', justifyContent: 'space-between' },
  statusLink: {
    display: 'inline-flex', alignItems: 'center', minHeight: '32px', paddingInline: '0.6rem', borderRadius: 'var(--radius-element)', textDecoration: 'none',
    backgroundColor: { default: 'transparent', ':hover': 'var(--color-overlay-hover)' },
  },
  // Not colour alone: the current filter is also bold and underlined.
  statusCurrent: { fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '0.3em', backgroundColor: 'var(--color-background-muted)' },
  search: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  // Comfortable targets: 32px with a pointer, 44px on touch-sized screens.
  action: {
    minHeight: { default: '32px', '@media (max-width: 760px)': '44px' }, minWidth: { default: 'auto', '@media (max-width: 760px)': '44px' },
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', paddingInline: { default: '0.5rem', '@media (max-width: 760px)': 0 },
  },
  next: { alignSelf: 'flex-start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
});
