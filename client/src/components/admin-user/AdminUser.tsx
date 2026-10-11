import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { ADMIN_USER_QUERY } from './AdminUserQuery';
import type { AdminUserQuery } from './__generated__/AdminUserQuery.graphql';
import { Link } from '@astryxdesign/core';
import { Heading } from '@astryxdesign/core';
import { useAdminUserRouteContext, RouteName, AdminUserDetailURI, AdminUserEditURI } from '../../routes/__generated__/routes';
import { ContentForm } from '../content-form/ContentForm';
import { AdminUserMutation } from './AdminUserMutation';

export function AdminUser({ queryRef }: AdminUserProps) {
  const screen = useAdminUser(queryRef);
  return <Layout data={screen.data} title={screen.title} admin>{screen.row ? screen.route.currentRoute === RouteName.AdminUserEdit ? <>
    <Heading level={1}>Edit User</Heading><ContentForm kind="User" row={screen.row} save={screen.save} detail={id => AdminUserDetailURI.getURI({ id })} />
  </> : <><Heading level={1}>{screen.row.displayName}</Heading><p>Email: {screen.row.email}</p><p>Role: {screen.row.role}. Active: {String(screen.row.active)}.</p>
    <Link href={AdminUserEditURI.getURI({ id: screen.row.id })}>Edit profile</Link></> : <Heading level={1}>Not found</Heading>}</Layout>;
}

function useAdminUser(queryRef: PreloadedQuery<AdminUserQuery>) {
  const data = usePreloadedQuery<AdminUserQuery>(ADMIN_USER_QUERY, queryRef); const route = useAdminUserRouteContext();
  const mutate = AdminUserMutation();
  async function save(input: Record<string, unknown>): Promise<string> {
    const response = await mutate('update', input);
    return (response.updateAdminUser as { adminUser: { id: string } }).adminUser.id;
  }
  const row = data.adminUser;
  const title = row ? (route.currentRoute === RouteName.AdminUserEdit ? 'Edit profile' : row.displayName ?? undefined) : undefined;
  return { data, route, row, save, title };
}

type AdminUserProps = { queryRef: PreloadedQuery<AdminUserQuery> };
