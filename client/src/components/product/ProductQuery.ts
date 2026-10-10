import { graphql } from 'react-relay';
import type { ProductQuery$variables } from './__generated__/ProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const PRODUCT_QUERY = graphql`query ProductQuery($slug: String!, $after: String, $list: Boolean!, $detail: Boolean!) {
  ...LayoutFragment
  products(first: 20, after: $after) @include(if: $list) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
    productBySlug(slug: $slug) @include(if: $detail) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;

export function ProductQueryVariables(route: EntryRoute): ProductQuery$variables { return { slug: route.slug ?? '', after: route.after ?? null, list: route.mode === 'list', detail: route.mode === 'public' }; }
