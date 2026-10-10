import { graphql } from 'react-relay';
import type { PostQuery$variables } from './__generated__/PostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const POST_QUERY = graphql`query PostQuery($slug: String!, $after: String, $list: Boolean!, $detail: Boolean!) {
  ...LayoutFragment
  posts(first: 20, after: $after) @include(if: $list) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
    postBySlug(slug: $slug) @include(if: $detail) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function PostQueryVariables(route: EntryRoute): PostQuery$variables { return { slug: route.slug ?? '', after: route.after ?? null, list: route.mode === 'list', detail: route.mode === 'public' }; }
