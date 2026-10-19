import { graphql } from 'react-relay';

export const ADMIN_QUERY = graphql`query AdminQuery {
  ...AdminLayoutFragment
  viewer { id }
  pages: recentPages(first: 5) { totalCount nodes { id title status updatedAt } }
  publishedPages: recentPages(where: { status: PUBLISHED }, first: 0) { totalCount }
  posts: recentPosts(first: 5) { totalCount nodes { id title status updatedAt } }
  publishedPosts: recentPosts(where: { status: PUBLISHED }, first: 0) { totalCount }
  products: recentProducts(first: 5) { totalCount nodes { id title status updatedAt } }
  publishedProducts: recentProducts(where: { status: PUBLISHED }, first: 0) { totalCount }
}`;
