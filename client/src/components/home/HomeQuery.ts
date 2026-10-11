import { graphql } from 'react-relay';

export const HOME_QUERY = graphql`query HomeQuery {
  ...LayoutFragment
  homePages: pages(first: 100) { nodes { id title slug excerpt status } }
  latestPosts: posts(first: 100) { nodes { id title slug excerpt status publishedAt } }
  pageBySlug(slug: "home") { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
