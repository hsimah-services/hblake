import { graphql } from 'react-relay';

export const ADMIN_QUERY = graphql`query AdminQuery {
  ...AdminLayoutFragment
  viewer { id }
  pages(first: 100) { totalCount nodes { status } }
  posts(first: 100) { totalCount nodes { status } }
  products(first: 100) { totalCount nodes { status } }
}`;
