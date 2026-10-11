import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { PRODUCT_LIST_QUERY } from './ProductListQuery';
import { PRODUCT_QUERY } from './ProductQuery';
import type { ProductListQuery } from './__generated__/ProductListQuery.graphql';
import type { ProductQuery } from './__generated__/ProductQuery.graphql';
import { ProductURI, ProductListURI } from '../../routes/__generated__/routes';
import { PublicContent } from '../public-content/PublicContent';
import { ContentList } from '../content-list/ContentList';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function Product({ list, content }: ProductProps) {
  return list ? <Product_List queryRef={list} /> : content ? <Product_Detail queryRef={content} /> : null;
}

function Product_List({ queryRef }: { queryRef: PreloadedQuery<ProductListQuery> }) {
  const data = usePreloadedQuery<ProductListQuery>(PRODUCT_LIST_QUERY, queryRef);
  return <Layout data={data} title="Products">
    <ContentList title="Products" rows={data.products?.nodes}
      next={data.products?.pageInfo.hasNextPage ? ProductListURI.getURI({ after: data.products.pageInfo.endCursor ?? undefined }) : undefined}
      detail={row => ProductURI.getURI({ slug: row.slug })} />
  </Layout>;
}

function Product_Detail({ queryRef }: { queryRef: PreloadedQuery<ProductQuery> }) {
  const data = usePreloadedQuery<ProductQuery>(PRODUCT_QUERY, queryRef);
  return <Layout data={data} row={data.productBySlug}><PublicContent row={data.productBySlug} /></Layout>;
}

type ProductProps = { list?: PreloadedQuery<ProductListQuery>; content?: PreloadedQuery<ProductQuery> };
