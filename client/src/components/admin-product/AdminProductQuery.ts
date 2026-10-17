import { graphql } from 'react-relay';

export const ADMIN_PRODUCT_QUERY = graphql`query AdminProductQuery($id: ID!) {
  ...AdminLayoutFragment
  product(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;
