import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { PRODUCT_QUERY } from './ProductQuery';
import type { ProductQuery } from './__generated__/ProductQuery.graphql';
import { useProductRouteContext, RouteName, ProductURI, ProductListURI } from '../../routes/__generated__/routes';
import { PublicContent } from '../public-content/PublicContent';
import { ContentList } from '../content-list/ContentList';

export function Product({ queryRef }: ProductProps) {
  const data = usePreloadedQuery<ProductQuery>(PRODUCT_QUERY, queryRef);
  const route = useProductRouteContext();
  return <Layout data={data} row={data.productBySlug}>
    {route.currentRoute === RouteName.ProductList ? <ContentList title="Products" rows={data.products?.nodes}
      next={data.products?.pageInfo.hasNextPage ? ProductListURI.getURI({ after: data.products.pageInfo.endCursor ?? undefined }) : undefined}
      detail={row => ProductURI.getURI({ slug: row.slug })} /> : <PublicContent row={data.productBySlug} />}
  </Layout>;
}


type ProductProps = { queryRef: PreloadedQuery<ProductQuery> };
