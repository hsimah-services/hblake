import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { ADMIN_USER_QUERY } from './AdminUserQuery';
import type { AdminUserQuery } from './__generated__/AdminUserQuery.graphql';
import { Link } from 'react-router';
import { Heading } from '@astryxdesign/core';
import { useAdminUserRouteContext, RouteName, AdminUserDetailURI, AdminUserEditURI } from '../../routes/__generated__/routes';
import { ContentForm } from '../content-form/ContentForm';
import { AdminUserMutation } from './AdminUserMutation';

export function AdminUser({ queryRef }: AdminUserProps) {
  const screen = useAdminUser(queryRef);
  return <Layout data={screen.data} admin>{screen.row ? screen.route.currentRoute === RouteName.AdminUserEdit ? <>
    <Heading level={1}>Edit User</Heading><ContentForm kind="User" row={screen.row} save={screen.save} detail={id => AdminUserDetailURI.getURI({ id })} />
  </> : <><Heading level={1}>{screen.row.displayName}</Heading><p>Email: {screen.row.email}</p><p>Role: {screen.row.role}. Active: {String(screen.row.active)}.</p>
    <Link to={AdminUserEditURI.getURI({ id: screen.row.id })}>Edit profile</Link></> : <Heading level={1}>Not found</Heading>}</Layout>;
}

function useAdminUser(queryRef: PreloadedQuery<AdminUserQuery>) {
  const data = usePreloadedQuery<AdminUserQuery>(ADMIN_USER_QUERY, queryRef); const route = useAdminUserRouteContext();
  const mutate = AdminUserMutation();
  async function save(input: Record<string, unknown>): Promise<string> {
    const response = await mutate('update', input);
    return (response.updateAdminUser as { adminUser: { id: string } }).adminUser.id;
  }
  return { data, route, row: data.adminUser, save };
}

type AdminUserProps = { queryRef: PreloadedQuery<AdminUserQuery> };
