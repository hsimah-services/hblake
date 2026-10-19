import { graphql } from 'react-relay';

export const ADMIN_PAGE_ITEM_LIST_QUERY = graphql`query AdminPageItemListQuery($page: String!, $after: String) {
  ...AdminLayoutFragment
  pageBySlug(slug: $page) { id title slug defaultItemKind }
  pageItemsOfPage(where: { page: $page }, first: 20, after: $after) { nodes { id title slug status updatedAt publishedAt } pageInfo { hasNextPage endCursor } }
}`;
