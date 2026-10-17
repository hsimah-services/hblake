import { useRef, useState, type FormEvent } from 'react';
import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Button, Heading, Link, Stack, TextInput } from '@astryxdesign/core';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { ADMIN_USER_QUERY } from './AdminUserQuery';
import type { AdminUserQuery } from './__generated__/AdminUserQuery.graphql';
import { useAdminUserRouteContext, RouteName, AdminUserDetailURI, AdminUserEditURI } from '../../routes/__generated__/routes';
import { ContentForm } from '../content-form/ContentForm';
import { AdminUserMutation } from './AdminUserMutation';
import { authRequest } from '../../authRequest';

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;

export function AdminUser({ queryRef }: AdminUserProps) {
  const screen = useAdminUser(queryRef);
  return <AdminLayout data={screen.data} section="settings" title={screen.title}>{screen.row ? screen.route.currentRoute === RouteName.AdminUserEdit ? <>
    <Heading level={1}>Edit display name</Heading><ContentForm kind="User" row={screen.row} save={screen.save} detail={id => AdminUserDetailURI.getURI({ id })} />
  </> : <Stack gap={6} align="stretch">
    <Heading level={1}>Settings</Heading>
    <section aria-labelledby="account-heading"><Stack gap={2}>
      <Heading level={2} id="account-heading">Account</Heading>
      <p>Username: {screen.row.username}</p>
      <p>Display name: {screen.row.displayName} (shown as the author of posts)</p>
      <Link href={AdminUserEditURI.getURI({ id: screen.row.id })}>Edit display name</Link>
    </Stack></section>
    <AdminUser_PasswordForm />
  </Stack> : <Heading level={1}>Not found</Heading>}</AdminLayout>;
}

function AdminUser_PasswordForm() {
  const form = usePasswordForm();
  return <section aria-labelledby="password-heading"><form ref={form.element} onSubmit={form.submit} noValidate><Stack gap={4} align="stretch">
    <Heading level={2} id="password-heading">Change password</Heading>
    {form.error && <p role="alert">{form.error}</p>}
    {form.notice && <p role="status">{form.notice}</p>}
    <TextInput label="Current password" htmlName="currentPassword" type="password" autoComplete="current-password" value={form.values.currentPassword} onChange={value => form.change('currentPassword', value)} status={form.invalid.currentPassword ? { type: 'error' } : undefined} />
    <TextInput label="New password" htmlName="newPassword" type="password" autoComplete="new-password" description="At least 12 characters. Other signed-in sessions are signed out." value={form.values.newPassword} onChange={value => form.change('newPassword', value)} status={form.invalid.newPassword ? { type: 'error' } : undefined} />
    <TextInput label="Confirm new password" htmlName="confirmPassword" type="password" autoComplete="new-password" value={form.values.confirmPassword} onChange={value => form.change('confirmPassword', value)} status={form.invalid.confirmPassword ? { type: 'error' } : undefined} />
    <Button type="submit" label="Change password" isLoading={form.pending} />
  </Stack></form></section>;
}

function useAdminUser(queryRef: PreloadedQuery<AdminUserQuery>) {
  const data = usePreloadedQuery<AdminUserQuery>(ADMIN_USER_QUERY, queryRef); const route = useAdminUserRouteContext();
  const mutate = AdminUserMutation();
  async function save(input: Record<string, unknown>): Promise<string> {
    const response = await mutate('update', input);
    return (response.updateAdminUser as { adminUser: { id: string } }).adminUser.id;
  }
  const row = data.adminUser;
  const title = row ? (route.currentRoute === RouteName.AdminUserEdit ? 'Edit display name' : 'Settings') : undefined;
  return { data, route, row, save, title };
}

function usePasswordForm() {
  const empty = Object.fromEntries(PASSWORD_FIELDS.map(field => [field, ''])) as Record<PasswordField, string>;
  const [values, setValues] = useState(empty);
  const [invalid, setInvalid] = useState<Partial<Record<PasswordField, boolean>>>({});
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [pending, setPending] = useState(false);
  const element = useRef<HTMLFormElement>(null);
  function change(field: PasswordField, value: string) { setValues(previous => ({ ...previous, [field]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending) return;
    const errors = validatePassword(values);
    setInvalid(errors); setNotice('');
    const first = PASSWORD_FIELDS.find(field => errors[field]);
    if (first) {
      setError(errors.confirmPassword && !errors.newPassword ? 'The new passwords do not match.' : 'Enter your current password and a new password of at least 12 characters.');
      element.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return;
    }
    setPending(true); setError('');
    try {
      await authRequest('password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(empty); setNotice('Password updated.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The password was not changed.'); }
    finally { setPending(false); }
  }
  return { values, invalid, error, notice, pending, element, change, submit };
}

function validatePassword(values: Record<PasswordField, string>): Partial<Record<PasswordField, boolean>> {
  const errors: Partial<Record<PasswordField, boolean>> = {};
  if (!values.currentPassword) errors.currentPassword = true;
  if (values.newPassword.length < 12) errors.newPassword = true;
  if (values.confirmPassword !== values.newPassword) errors.confirmPassword = true;
  return errors;
}

type PasswordField = typeof PASSWORD_FIELDS[number];
type AdminUserProps = { queryRef: PreloadedQuery<AdminUserQuery> };
