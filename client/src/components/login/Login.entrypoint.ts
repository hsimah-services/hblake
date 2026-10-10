import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Login } from './Login';
import { LoginQueryVariables } from './LoginQuery';
import QUERY_NODE, { type LoginQuery } from './__generated__/LoginQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function LoginEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Login, { queryRef: queries.content }); }

export const LOGIN_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Login', LoginEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: LoginQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: LoginQuery };
type Empty = Record<string, never>;
