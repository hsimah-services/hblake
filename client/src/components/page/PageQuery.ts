import { graphql } from 'react-relay';
import type { PageQuery$variables } from './__generated__/PageQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const PAGE_QUERY = graphql`query PageQuery($slug: String!) {
  ...LayoutFragment
  pageBySlug(slug: $slug) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function PageQueryVariables(route: EntryRoute): PageQuery$variables { return { slug: route.slug ?? '' }; }
