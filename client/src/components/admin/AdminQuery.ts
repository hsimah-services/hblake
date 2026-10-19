import { graphql } from 'react-relay';

export const ADMIN_QUERY = graphql`query AdminQuery {
  ...AdminLayoutFragment
  viewer { id }
  pages: recentPages(first: 5) { totalCount nodes { id title status updatedAt } }
  publishedPages: recentPages(where: { status: PUBLISHED }, first: 0) { totalCount }
  items: recentPageItems(first: 5) { totalCount nodes { id title status updatedAt kind page { slug } } }
  itemPages: pages(first: 100) { nodes { id title slug defaultItemKind itemCount publishedItemCount } }
}`;
