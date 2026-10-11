import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Login } from './Login';
import QUERY_NODE, { type LoginQuery } from './__generated__/LoginQuery.graphql';
import { LoginRouteQuery, type LoginEntryPointParams } from '../../routes/__generated__/routes';

export function LoginEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(Login, { queryRef: queries.content }); }

export const LOGIN_ENTRY_POINT: RouteEntryPoint<LoginEntryPointParams, Queries> = {
  root: resource('Login', LoginEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: LoginRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: LoginQuery };
