import { graphql } from 'react-relay';

export const POST_QUERY = graphql`query PostQuery($slug: String!) {
  ...LayoutFragment
  postBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt author { displayName } }
}`;
