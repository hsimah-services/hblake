import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Post } from './Post';
import LIST_NODE, { type PostListQuery } from './__generated__/PostListQuery.graphql';
import QUERY_NODE, { type PostQuery } from './__generated__/PostQuery.graphql';
import { PostListRouteQuery, PostRouteQuery, RouteName, type PostEntryPointParams } from '../../routes/__generated__/routes';

export function PostEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(Post, { list: queries.list, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const POST_ENTRY_POINT: RouteEntryPoint<PostEntryPointParams, Queries> = {
  root: resource('Post', PostEntryPoint),
  getPreloadProps: route => ({ queries: route.currentRoute === RouteName.PostList
    ? { list: { parameters: LIST_NODE, variables: PostListRouteQuery.getVariables(route.input) } }
    : { content: { parameters: QUERY_NODE, variables: PostRouteQuery.getVariables(route.input) } } }),
};

type Queries = { list?: PostListQuery; content?: PostQuery };
