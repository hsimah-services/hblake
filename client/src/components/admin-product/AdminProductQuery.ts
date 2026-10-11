import { graphql } from 'react-relay';

export const ADMIN_PRODUCT_QUERY = graphql`query AdminProductQuery($id: ID!) {
  ...LayoutFragment
  product(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;
