import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Product } from './Product';
import { ProductQueryVariables } from './ProductQuery';
import QUERY_NODE, { type ProductQuery } from './__generated__/ProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function ProductEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Product, { queryRef: queries.content }); }

export const PRODUCT_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Product', ProductEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: ProductQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: ProductQuery };
type Empty = Record<string, never>;
