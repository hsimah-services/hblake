import { graphql } from 'react-relay';

export const PAGE_QUERY = graphql`query PageQuery($slug: String!) {
  ...LayoutFragment
  pageBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
