import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Button, Card, Heading, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { AdminIcon } from '../admin-icon/AdminIcon';
import { AdminTimestamp } from '../admin-timestamp/AdminTimestamp';
import { ADMIN_QUERY } from './AdminQuery';
import type { AdminQuery } from './__generated__/AdminQuery.graphql';
import { AdminPageCreateURI, AdminPageDetailURI, AdminPageItemCreateURI, AdminPageItemDetailURI, AdminPageItemListURI, AdminPageListURI, AdminUserDetailURI } from '../../routes/__generated__/routes';

const ITEM_TONES = ['green', 'orange', 'blue'] as const;

export function Admin({ queryRef }: AdminProps) {
  const dashboard = useAdmin(queryRef);
  return <AdminLayout data={dashboard.data} section="dashboard" title="Dashboard">
    <Heading level={1}>Dashboard</Heading>
    <div {...stylex.props(styles.grid)}>
      {dashboard.types.map(type => <Card key={type.list} xstyle={[styles.card, styles[type.tone]]}>
        <Stack gap={3} align="stretch">
          <Stack direction="horizontal" gap={3} align="center">
            <span {...stylex.props(styles.tile, styles[`${type.tone}Tile`])}><AdminIcon name={type.icon} /></span>
            <Heading level={2} xstyle={styles.title}><Link href={type.list} type="inherit" color="inherit" xstyle={styles.titleLink}>{type.plural}</Link></Heading>
          </Stack>
          <Text xstyle={styles.total}>{type.published + type.drafts}<Text color="secondary" size="sm"> total</Text></Text>
          <Stack direction="horizontal" gap={2} align="center" xstyle={styles.breakdown}>
            <Link href={type.publishedList} hasUnderline>{type.published} published</Link>
            <Text color="secondary" aria-hidden="true">·</Text>
            <Link href={type.draftList} hasUnderline>{type.drafts} {type.drafts === 1 ? 'draft' : 'drafts'}</Link>
          </Stack>
          <Button href={type.create} label={`New ${type.singular}`} icon={<AdminIcon name="plus" />} xstyle={styles.add} />
        </Stack>
      </Card>)}
    </div>
    <section aria-labelledby="recent-heading">
      <Heading level={2} id="recent-heading" xstyle={styles.recentHeading}>Recently edited</Heading>
      {dashboard.recent.length === 0 ? <Text color="secondary">Nothing yet. Start with a new page.</Text>
        : <ul {...stylex.props(styles.recent)}>{dashboard.recent.map(item => <li key={item.id} {...stylex.props(styles.recentItem)}>
          <AdminIcon name={item.icon} />
          <Link href={item.href} weight="semibold" color="inherit" xstyle={styles.recentLink}>{item.title}</Link>
          <Text color="secondary" size="sm">{item.type} · {item.status === 'PUBLISHED' ? 'Published' : 'Draft'} · </Text>
          <AdminTimestamp value={item.updatedAt} />
        </li>)}</ul>}
    </section>
    {dashboard.settings && <Link href={dashboard.settings} hasUnderline xstyle={styles.settings}>Settings</Link>}
  </AdminLayout>;
}

function useAdmin(queryRef: PreloadedQuery<AdminQuery>) {
  const data = usePreloadedQuery<AdminQuery>(ADMIN_QUERY, queryRef);
  // Counts come from the server's totals, so they stay right however many records exist.
  const count = (all: { readonly totalCount?: number | null } | null | undefined, published: { readonly totalCount?: number | null } | null | undefined) => ({
    published: published?.totalCount ?? 0, drafts: (all?.totalCount ?? 0) - (published?.totalCount ?? 0),
  });
  const holders = (data.itemPages?.nodes ?? []).flatMap(page => page != null && page.defaultItemKind != null ? [page] : []);
  const types: readonly AdminDashboardType[] = [
    { plural: 'Pages', singular: 'page', icon: 'page', tone: 'blue', list: AdminPageListURI.getURI({}), publishedList: AdminPageListURI.getURI({ status: 'published' }), draftList: AdminPageListURI.getURI({ status: 'draft' }), create: AdminPageCreateURI.getURI({}), ...count(data.pages, data.publishedPages) },
    // One card for each page that holds items.
    ...holders.map((page, index): AdminDashboardType => ({
      plural: page.title, singular: page.defaultItemKind?.toLowerCase() ?? 'item', icon: page.defaultItemKind === 'Product' ? 'product' : 'news', tone: ITEM_TONES[index % ITEM_TONES.length],
      list: AdminPageItemListURI.getURI({ page: page.slug }), publishedList: AdminPageItemListURI.getURI({ page: page.slug, status: 'published' }), draftList: AdminPageItemListURI.getURI({ page: page.slug, status: 'draft' }),
      create: AdminPageItemCreateURI.getURI({ page: page.slug }), ...count({ totalCount: page.itemCount }, { totalCount: page.publishedItemCount }),
    })),
  ];
  // The five most recently edited records of any type, from each type's newest five.
  const recent = [
    ...(data.pages?.nodes ?? []).map(node => node && { ...node, type: 'Page', icon: 'page' as const, href: AdminPageDetailURI.getURI({ id: node.id }) }),
    ...(data.items?.nodes ?? []).map(node => node && { ...node, type: node.kind, icon: node.kind === 'Product' ? 'product' as const : 'news' as const, href: AdminPageItemDetailURI.getURI({ page: node.page?.slug ?? '', id: node.id }) }),
  ].filter(item => item != null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  return { data, types, recent, settings: data.viewer?.id ? AdminUserDetailURI.getURI({ id: data.viewer.id }) : undefined };
}

type AdminDashboardType = {
  plural: string; singular: string; icon: 'page' | 'news' | 'product'; tone: 'blue' | 'green' | 'orange';
  list: string; publishedList: string; draftList: string; create: string; published: number; drafts: number;
};
type AdminProps = { queryRef: PreloadedQuery<AdminQuery> };

const styles = stylex.create({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem' },
  add: { alignSelf: 'flex-start' },
  // Each type gets a coloured top edge and icon tile from Astryx's own palette tokens.
  card: { borderTopWidth: '3px', borderTopStyle: 'solid' },
  blue: { borderTopColor: 'var(--color-border-blue)' },
  green: { borderTopColor: 'var(--color-border-green)' },
  orange: { borderTopColor: 'var(--color-border-orange)' },
  tile: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-element)', flexShrink: 0 },
  blueTile: { backgroundColor: 'var(--color-background-blue)', color: 'var(--color-icon-blue)' },
  greenTile: { backgroundColor: 'var(--color-background-green)', color: 'var(--color-icon-green)' },
  orangeTile: { backgroundColor: 'var(--color-background-orange)', color: 'var(--color-icon-orange)' },
  title: { fontSize: '1.6rem', letterSpacing: '-0.01em' },
  // A heading that is only a link needs no resting underline; hover and focus show one.
  titleLink: { textDecoration: { default: 'none', ':hover': 'underline', ':focus-visible': 'underline' }, textUnderlineOffset: '0.2em' },
  total: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 },
  breakdown: { flexWrap: 'wrap' },
  recentHeading: { marginTop: '0.5rem', marginBottom: '0.5rem' },
  recent: { listStyle: 'none', margin: 0, padding: 0, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-container)' },
  recentItem: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', paddingBlock: '0.6rem', paddingInline: '0.75rem',
    borderTopWidth: { default: '1px', ':first-child': 0 }, borderTopStyle: 'solid', borderTopColor: 'var(--color-border)',
  },
  recentLink: { textDecoration: { default: 'none', ':hover': 'underline', ':focus-visible': 'underline' }, marginInlineEnd: 'auto' },
  settings: { alignSelf: 'flex-start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
});
