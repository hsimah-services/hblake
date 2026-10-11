import { graphql } from 'react-relay';
import type { PostQuery$variables } from './__generated__/PostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const POST_QUERY = graphql`query PostQuery($slug: String!) {
  ...LayoutFragment
  postBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function PostQueryVariables(route: EntryRoute): PostQuery$variables { return { slug: route.slug ?? '' }; }
