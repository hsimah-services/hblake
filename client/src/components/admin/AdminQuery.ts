import { graphql } from 'react-relay';

export const ADMIN_QUERY = graphql`query AdminQuery {
  ...AdminLayoutFragment
  viewer { id }
  pages(first: 100) { totalCount nodes { id title status updatedAt } }
  posts(first: 100) { totalCount nodes { id title status updatedAt } }
  products(first: 100) { totalCount nodes { id title status updatedAt } }
}`;
