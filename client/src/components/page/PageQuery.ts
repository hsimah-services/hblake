import { graphql } from 'react-relay';

export const PAGE_QUERY = graphql`query PageQuery($slug: String!, $after: String) {
  ...LayoutFragment
  pageBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt defaultItemKind }
  pageItemsOfPage(where: { page: $slug }, first: 20, after: $after) { nodes { id title slug excerpt content imageUrl imageAlt status publishedAt author { displayName } } pageInfo { hasNextPage endCursor } }
}`;
