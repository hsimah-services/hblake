import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { ADMIN_QUERY } from './AdminQuery';
import type { AdminQuery } from './__generated__/AdminQuery.graphql';
import { Link } from 'react-router';
import { Heading, Stack } from '@astryxdesign/core';
import { AdminPageListURI, AdminPostListURI, AdminProductListURI, AdminUserDetailURI } from '../../routes/__generated__/routes';

export function Admin({ queryRef }: AdminProps) {
  const data = usePreloadedQuery<AdminQuery>(ADMIN_QUERY, queryRef);
  return <Layout data={data} admin><Heading level={1}>Administration</Heading><Stack gap={4}>
    <Link to={AdminPageListURI.getURI({})}>Pages</Link><Link to={AdminPostListURI.getURI({})}>Posts</Link><Link to={AdminProductListURI.getURI({})}>Products</Link>
    {data.viewer && <Link to={AdminUserDetailURI.getURI({ id: data.viewer.id ?? '' })}>Operator profile</Link>}
  </Stack></Layout>;
}


type AdminProps = { queryRef: PreloadedQuery<AdminQuery> };
