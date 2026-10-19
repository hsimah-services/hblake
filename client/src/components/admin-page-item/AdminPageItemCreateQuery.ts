import { graphql } from 'react-relay';

export const ADMIN_PAGE_ITEM_CREATE_QUERY = graphql`query AdminPageItemCreateQuery($page: String!) {
  ...AdminLayoutFragment
  viewer { id }
  pageBySlug(slug: $page) { id title slug defaultItemKind }
}`;
