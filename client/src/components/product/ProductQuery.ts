import { graphql } from 'react-relay';
import type { ProductQuery$variables } from './__generated__/ProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const PRODUCT_QUERY = graphql`query ProductQuery($slug: String!) {
  ...LayoutFragment
  productBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;

export function ProductQueryVariables(route: EntryRoute): ProductQuery$variables { return { slug: route.slug ?? '' }; }
