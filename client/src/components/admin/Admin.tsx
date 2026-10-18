import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Button, Card, Heading, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { AdminIcon } from '../admin-icon/AdminIcon';
import { ADMIN_QUERY } from './AdminQuery';
import type { AdminQuery } from './__generated__/AdminQuery.graphql';
import { AdminPageCreateURI, AdminPageListURI, AdminPostCreateURI, AdminPostListURI, AdminProductCreateURI, AdminProductListURI, AdminUserDetailURI } from '../../routes/__generated__/routes';

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
    {dashboard.settings && <Link href={dashboard.settings} hasUnderline xstyle={styles.settings}>Settings</Link>}
  </AdminLayout>;
}

function useAdmin(queryRef: PreloadedQuery<AdminQuery>) {
  const data = usePreloadedQuery<AdminQuery>(ADMIN_QUERY, queryRef);
  const count = (connection: { readonly nodes?: readonly ({ readonly status: string } | null | undefined)[] | null } | null | undefined) => {
    const statuses = connection?.nodes?.map(node => node?.status) ?? [];
    const published = statuses.filter(status => status === 'PUBLISHED').length;
    return { published, drafts: statuses.length - published };
  };
  const types: readonly AdminDashboardType[] = [
    { plural: 'Pages', singular: 'page', icon: 'page', tone: 'blue', list: AdminPageListURI.getURI({}), publishedList: AdminPageListURI.getURI({ status: 'published' }), draftList: AdminPageListURI.getURI({ status: 'draft' }), create: AdminPageCreateURI.getURI({}), ...count(data.pages) },
    { plural: 'News', singular: 'article', icon: 'news', tone: 'green', list: AdminPostListURI.getURI({}), publishedList: AdminPostListURI.getURI({ status: 'published' }), draftList: AdminPostListURI.getURI({ status: 'draft' }), create: AdminPostCreateURI.getURI({}), ...count(data.posts) },
    { plural: 'Products', singular: 'product', icon: 'product', tone: 'orange', list: AdminProductListURI.getURI({}), publishedList: AdminProductListURI.getURI({ status: 'published' }), draftList: AdminProductListURI.getURI({ status: 'draft' }), create: AdminProductCreateURI.getURI({}), ...count(data.products) },
  ];
  return { data, types, settings: data.viewer?.id ? AdminUserDetailURI.getURI({ id: data.viewer.id }) : undefined };
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
  settings: { alignSelf: 'flex-start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
});
