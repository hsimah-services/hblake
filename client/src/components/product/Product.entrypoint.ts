import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Product } from './Product';
import { ProductListQueryVariables } from './ProductListQuery';
import { ProductQueryVariables } from './ProductQuery';
import LIST_NODE, { type ProductListQuery } from './__generated__/ProductListQuery.graphql';
import QUERY_NODE, { type ProductQuery } from './__generated__/ProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function ProductEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Product, { list: queries.list, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const PRODUCT_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Product', ProductEntryPoint),
  getPreloadProps: route => ({ queries: route.mode === 'list'
    ? { list: { parameters: LIST_NODE, variables: ProductListQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
    : { content: { parameters: QUERY_NODE, variables: ProductQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: ProductListQuery; content?: ProductQuery };
type Empty = Record<string, never>;
