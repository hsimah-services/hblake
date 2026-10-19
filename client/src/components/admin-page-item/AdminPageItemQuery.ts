import { graphql } from 'react-relay';

export const ADMIN_PAGE_ITEM_QUERY = graphql`query AdminPageItemQuery($page: String!, $id: ID!) {
  ...AdminLayoutFragment
  pageBySlug(slug: $page) { id title slug defaultItemKind }
  pageItem(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt kind enquiryUrl imageUrl imageAlt author { displayName } page { id } }
}`;
