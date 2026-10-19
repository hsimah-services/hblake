import { graphql } from 'react-relay';

export const PAGE_ITEM_QUERY = graphql`query PageItemQuery($page: String!, $slug: String!) {
  ...LayoutFragment
  pageBySlug(slug: $page) { id title slug }
  pageItemBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt kind enquiryUrl imageUrl imageAlt author { displayName } page { id } }
  pageOrder: pageItemsOfPage(where: { page: $page }, first: 100) { nodes { slug title status } }
}`;
