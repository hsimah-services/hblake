import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Heading } from '@astryxdesign/core';
import { Layout } from '../layout/Layout';
import { ADMIN_PRODUCT_LIST_QUERY } from './AdminProductListQuery';
import { ADMIN_PRODUCT_QUERY } from './AdminProductQuery';
import { ADMIN_PRODUCT_CREATE_QUERY } from './AdminProductCreateQuery';
import type { AdminProductListQuery } from './__generated__/AdminProductListQuery.graphql';
import type { AdminProductQuery } from './__generated__/AdminProductQuery.graphql';
import type { AdminProductCreateQuery } from './__generated__/AdminProductCreateQuery.graphql';
import { useAdminProductRouteContext, RouteName, AdminProductListURI, AdminProductCreateURI, AdminProductDetailURI, AdminProductEditURI } from '../../routes/__generated__/routes';
import { ContentList } from '../content-list/ContentList';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminProductMutation } from './AdminProductMutation';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function AdminProduct({ list, create, content }: AdminProductProps) {
  return list ? <AdminProduct_List queryRef={list} /> : create ? <AdminProduct_Create queryRef={create} /> : content ? <AdminProduct_Content queryRef={content} /> : null;
}

function AdminProduct_List({ queryRef }: { queryRef: PreloadedQuery<AdminProductListQuery> }) {
  const data = usePreloadedQuery<AdminProductListQuery>(ADMIN_PRODUCT_LIST_QUERY, queryRef);
  return <Layout data={data} title="Products" admin>
    <ContentList title="Products" rows={data.products?.nodes}
      create={AdminProductCreateURI.getURI({})} detail={row => AdminProductDetailURI.getURI({ id: row.id })}
      next={data.products?.pageInfo.hasNextPage ? AdminProductListURI.getURI({ after: data.products.pageInfo.endCursor ?? undefined }) : undefined} />
  </Layout>;
}

function AdminProduct_Create({ queryRef }: { queryRef: PreloadedQuery<AdminProductCreateQuery> }) {
  const data = usePreloadedQuery<AdminProductCreateQuery>(ADMIN_PRODUCT_CREATE_QUERY, queryRef);
  const save = useAdminProduct_Save(null);
  return <Layout data={data} title="Create Product" admin>
    <Heading level={1}>Create Product</Heading>
    <ContentForm key="new" kind="Product" save={save} detail={id => AdminProductDetailURI.getURI({ id })} />
  </Layout>;
}

function AdminProduct_Content({ queryRef }: { queryRef: PreloadedQuery<AdminProductQuery> }) {
  const data = usePreloadedQuery<AdminProductQuery>(ADMIN_PRODUCT_QUERY, queryRef);
  const route = useAdminProductRouteContext(); const mutate = AdminProductMutation(); const row = data.product;
  const save = useAdminProduct_Save(row);
  const editing = route.currentRoute === RouteName.AdminProductEdit && row != null;
  return <Layout data={data} row={row} title={editing ? `Edit ${row.title}` : undefined} admin>
    {editing ? <>
      <Heading level={1}>Edit Product</Heading>
      <ContentForm key={row.id} kind="Product" row={row} save={save} detail={id => AdminProductDetailURI.getURI({ id })} />
    </> : <AdminDetail kind="Product" row={row} edit={AdminProductEditURI.getURI({ id: row?.id ?? '' })} list={AdminProductListURI.getURI({})} mutate={mutate} />}
  </Layout>;
}

function useAdminProduct_Save(row: { readonly id: string } | null | undefined) {
  const mutate = AdminProductMutation();
  return async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    return (response[action + 'Product'] as { product: { id: string } }).product.id;
  };
}

type AdminProductProps = { list?: PreloadedQuery<AdminProductListQuery>; create?: PreloadedQuery<AdminProductCreateQuery>; content?: PreloadedQuery<AdminProductQuery> };
