import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Post } from './Post';
import { PostListQueryVariables } from './PostListQuery';
import { PostQueryVariables } from './PostQuery';
import LIST_NODE, { type PostListQuery } from './__generated__/PostListQuery.graphql';
import QUERY_NODE, { type PostQuery } from './__generated__/PostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function PostEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Post, { list: queries.list, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const POST_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Post', PostEntryPoint),
  getPreloadProps: route => ({ queries: route.mode === 'list'
    ? { list: { parameters: LIST_NODE, variables: PostListQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
    : { content: { parameters: QUERY_NODE, variables: PostQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: PostListQuery; content?: PostQuery };
type Empty = Record<string, never>;
