import { graphql } from 'react-relay';

export const PRODUCT_QUERY = graphql`query ProductQuery($slug: String!) {
  ...LayoutFragment
  productBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;
