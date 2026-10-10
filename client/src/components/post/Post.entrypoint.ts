import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Post } from './Post';
import { PostQueryVariables } from './PostQuery';
import QUERY_NODE, { type PostQuery } from './__generated__/PostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function PostEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Post, { queryRef: queries.content }); }

export const POST_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Post', PostEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: PostQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: PostQuery };
type Empty = Record<string, never>;
