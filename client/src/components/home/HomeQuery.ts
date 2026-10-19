import { graphql } from 'react-relay';

export const HOME_QUERY = graphql`query HomeQuery {
  ...LayoutFragment
  homePages: placedPages(where: { home: true }, first: 4) { nodes { id title slug excerpt accent } }
  latestPosts: posts(first: 100) { nodes { id title slug excerpt status publishedAt } }
  pageBySlug(slug: "home") { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
