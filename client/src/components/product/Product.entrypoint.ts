import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Product } from './Product';
import LIST_NODE, { type ProductListQuery } from './__generated__/ProductListQuery.graphql';
import QUERY_NODE, { type ProductQuery } from './__generated__/ProductQuery.graphql';
import { ProductListRouteQuery, ProductRouteQuery, RouteName, type ProductEntryPointParams } from '../../routes/__generated__/routes';

export function ProductEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(Product, { list: queries.list, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const PRODUCT_ENTRY_POINT: RouteEntryPoint<ProductEntryPointParams, Queries> = {
  root: resource('Product', ProductEntryPoint),
  getPreloadProps: route => ({ queries: route.currentRoute === RouteName.ProductList
    ? { list: { parameters: LIST_NODE, variables: ProductListRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
    : { content: { parameters: QUERY_NODE, variables: ProductRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: ProductListQuery; content?: ProductQuery };
