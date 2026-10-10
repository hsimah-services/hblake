import { graphql } from 'react-relay';
import type { WebsiteQuery$variables } from './__generated__/WebsiteQuery.graphql';

export const WEBSITE_QUERY = graphql`
  query WebsiteQuery($id: ID!, $slug: String!, $after: String, $page: Boolean!, $post: Boolean!, $product: Boolean!, $pageId: Boolean!, $postId: Boolean!, $productId: Boolean!, $profile: Boolean!) {
    viewer { id displayName role }
    pages(first: 100) { nodes { id title slug status } }
    adminPages: pages(first: 20, after: $after) { nodes { id title slug excerpt status } totalCount pageInfo { hasNextPage endCursor } }
    posts(first: 20, after: $after) { nodes { id title slug excerpt status } totalCount pageInfo { hasNextPage endCursor } }
    products(first: 20, after: $after) { nodes { id title slug excerpt status } totalCount pageInfo { hasNextPage endCursor } }
    pageBySlug(slug: $slug) @include(if: $page) { id title slug content excerpt status publishedAt createdAt updatedAt }
    postBySlug(slug: $slug) @include(if: $post) { id title slug content excerpt status publishedAt createdAt updatedAt }
    productBySlug(slug: $slug) @include(if: $product) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
    page(id: $id) @include(if: $pageId) { id title slug content excerpt status publishedAt createdAt updatedAt }
    post(id: $id) @include(if: $postId) { id title slug content excerpt status publishedAt createdAt updatedAt }
    product(id: $id) @include(if: $productId) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
    adminUser(id: $id) @include(if: $profile) { id email displayName role active createdAt updatedAt }
  }
`;

export function WebsiteQueryVariables(route: WebsiteQueryRoute): WebsiteQuery$variables {
  const detail = route.mode === 'detail' || route.mode === 'edit';
  const publicDetail = route.mode === 'public' || route.mode === 'home';
  return {
    id: route.id ?? '', slug: route.slug ?? 'home', after: route.after ?? null,
    page: publicDetail && route.kind === 'Page', post: publicDetail && route.kind === 'Post', product: publicDetail && route.kind === 'Product',
    pageId: detail && route.kind === 'Page', postId: detail && route.kind === 'Post', productId: detail && route.kind === 'Product', profile: detail && route.kind === 'User',
  };
}

export type WebsiteQueryRoute = { mode: string; kind: string; id?: string; slug?: string; after?: string };
