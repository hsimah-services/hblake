import { graphql } from 'react-relay';

export const ADMIN_PRODUCT_CREATE_QUERY = graphql`query AdminProductCreateQuery {
  ...AdminLayoutFragment
  viewer { id }
}`;
