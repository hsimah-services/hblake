import { graphql } from 'react-relay';
import type { HomeQuery$variables } from './__generated__/HomeQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const HOME_QUERY = graphql`query HomeQuery {
  ...LayoutFragment
  pageBySlug(slug: "home") { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function HomeQueryVariables(_route: EntryRoute): HomeQuery$variables { return {}; }
