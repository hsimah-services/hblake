import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Button, Card, Heading, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { ADMIN_QUERY } from './AdminQuery';
import type { AdminQuery } from './__generated__/AdminQuery.graphql';
import { AdminPageCreateURI, AdminPageListURI, AdminPostCreateURI, AdminPostListURI, AdminProductCreateURI, AdminProductListURI, AdminUserDetailURI } from '../../routes/__generated__/routes';

export function Admin({ queryRef }: AdminProps) {
  const dashboard = useAdmin(queryRef);
  return <AdminLayout data={dashboard.data} section="dashboard" title="Dashboard">
    <Heading level={1}>Dashboard</Heading>
    <div {...stylex.props(styles.grid)}>
      {dashboard.types.map(type => <Card key={type.list}>
        <Stack gap={3} align="stretch">
          <Heading level={2}><Link href={type.list} hasUnderline>{type.plural}</Link></Heading>
          <Text>{type.published} published · {type.drafts} {type.drafts === 1 ? 'draft' : 'drafts'}</Text>
          <Button href={type.create} label={`Add new ${type.singular}`} xstyle={styles.add} />
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
  const types = [
    { plural: 'Pages', singular: 'page', list: AdminPageListURI.getURI({}), create: AdminPageCreateURI.getURI({}), ...count(data.pages) },
    { plural: 'Posts', singular: 'post', list: AdminPostListURI.getURI({}), create: AdminPostCreateURI.getURI({}), ...count(data.posts) },
    { plural: 'Products', singular: 'product', list: AdminProductListURI.getURI({}), create: AdminProductCreateURI.getURI({}), ...count(data.products) },
  ];
  return { data, types, settings: data.viewer?.id ? AdminUserDetailURI.getURI({ id: data.viewer.id }) : undefined };
}

type AdminProps = { queryRef: PreloadedQuery<AdminQuery> };

const styles = stylex.create({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem' },
  add: { alignSelf: 'flex-start' },
  settings: { alignSelf: 'flex-start', minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
});
