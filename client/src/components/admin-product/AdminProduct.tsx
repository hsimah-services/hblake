import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { ADMIN_PRODUCT_QUERY } from './AdminProductQuery';
import type { AdminProductQuery } from './__generated__/AdminProductQuery.graphql';
import { Heading } from '@astryxdesign/core';
import { useAdminProductRouteContext, RouteName, AdminProductListURI, AdminProductCreateURI, AdminProductDetailURI, AdminProductEditURI } from '../../routes/__generated__/routes';
import { ContentList } from '../content-list/ContentList';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminProductMutation } from './AdminProductMutation';

export function AdminProduct({ queryRef }: AdminProductProps) {
  const screen = useAdminProduct(queryRef);
  return <Layout data={screen.data} row={screen.row} admin>
    {screen.route.currentRoute === RouteName.AdminProductList ? <ContentList title="Products" rows={screen.data.products?.nodes}
      create={AdminProductCreateURI.getURI({})} detail={row => AdminProductDetailURI.getURI({ id: row.id })}
      next={screen.data.products?.pageInfo.hasNextPage ? AdminProductListURI.getURI({ after: screen.data.products.pageInfo.endCursor ?? undefined }) : undefined} />
      : screen.route.currentRoute === RouteName.AdminProductCreate || screen.route.currentRoute === RouteName.AdminProductEdit ? <>
        <Heading level={1}>{screen.row ? 'Edit' : 'Create'} Product</Heading>
        <ContentForm key={screen.row?.id ?? 'new'} kind="Product" row={screen.row} save={screen.save} detail={id => AdminProductDetailURI.getURI({ id })} />
      </> : <AdminDetail kind="Product" row={screen.row} edit={AdminProductEditURI.getURI({ id: screen.row?.id ?? '' })} list={AdminProductListURI.getURI({})} mutate={screen.mutate} />}
  </Layout>;
}

function useAdminProduct(queryRef: PreloadedQuery<AdminProductQuery>) {
  const data = usePreloadedQuery<AdminProductQuery>(ADMIN_PRODUCT_QUERY, queryRef); const route = useAdminProductRouteContext();
  const mutate = AdminProductMutation(); const row = data.product;
  async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    const payload = response[action + 'Product'] as { product: { id: string } };
    return payload.product.id;
  }
  return { data, route, row, mutate, save };
}

type AdminProductProps = { queryRef: PreloadedQuery<AdminProductQuery> };
