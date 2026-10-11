import { graphql } from 'react-relay';

export const HOME_QUERY = graphql`query HomeQuery {
  ...LayoutFragment
  pageBySlug(slug: "home") { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
