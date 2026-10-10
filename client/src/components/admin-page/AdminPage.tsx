import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { ADMIN_PAGE_QUERY } from './AdminPageQuery';
import type { AdminPageQuery } from './__generated__/AdminPageQuery.graphql';
import { Heading } from '@astryxdesign/core';
import { useAdminPageRouteContext, RouteName, AdminPageListURI, AdminPageCreateURI, AdminPageDetailURI, AdminPageEditURI } from '../../routes/__generated__/routes';
import { ContentList } from '../content-list/ContentList';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminPageMutation } from './AdminPageMutation';

export function AdminPage({ queryRef }: AdminPageProps) {
  const screen = useAdminPage(queryRef);
  return <Layout data={screen.data} row={screen.row} admin>
    {screen.route.currentRoute === RouteName.AdminPageList ? <ContentList title="Pages" rows={screen.data.pages?.nodes}
      create={AdminPageCreateURI.getURI({})} detail={row => AdminPageDetailURI.getURI({ id: row.id })}
      next={screen.data.pages?.pageInfo.hasNextPage ? AdminPageListURI.getURI({ after: screen.data.pages.pageInfo.endCursor ?? undefined }) : undefined} />
      : screen.route.currentRoute === RouteName.AdminPageCreate || screen.route.currentRoute === RouteName.AdminPageEdit ? <>
        <Heading level={1}>{screen.row ? 'Edit' : 'Create'} Page</Heading>
        <ContentForm key={screen.row?.id ?? 'new'} kind="Page" row={screen.row} save={screen.save} detail={id => AdminPageDetailURI.getURI({ id })} />
      </> : <AdminDetail kind="Page" row={screen.row} edit={AdminPageEditURI.getURI({ id: screen.row?.id ?? '' })} list={AdminPageListURI.getURI({})} mutate={screen.mutate} />}
  </Layout>;
}

function useAdminPage(queryRef: PreloadedQuery<AdminPageQuery>) {
  const data = usePreloadedQuery<AdminPageQuery>(ADMIN_PAGE_QUERY, queryRef); const route = useAdminPageRouteContext();
  const mutate = AdminPageMutation(); const row = data.page;
  async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    const payload = response[action + 'Page'] as { page: { id: string } };
    return payload.page.id;
  }
  return { data, route, row, mutate, save };
}

type AdminPageProps = { queryRef: PreloadedQuery<AdminPageQuery> };
