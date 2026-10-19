import { graphql } from 'react-relay';

export const HOME_QUERY = graphql`query HomeQuery {
  ...LayoutFragment
  homePages: placedPages(where: { home: true }, first: 4) { nodes { id title slug excerpt accent } }
  latestNews: pageItemsOfPage(where: { page: "news" }, first: 1) { nodes { id title slug excerpt status publishedAt } }
  pageBySlug(slug: "home") { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
