import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Button, Heading, Stack, TextInput } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { Markdown } from '../markdown/Markdown';
import { ContentForm } from '../content-form/ContentForm';
import { WEBSITE_QUERY, type WebsiteQueryRoute } from './WebsiteQuery';
import type { WebsiteQuery, WebsiteQuery$data } from './__generated__/WebsiteQuery.graphql';
import { WebsiteMutation } from './WebsiteMutation';

export function Website({ queryRef, route }: WebsiteProps) {
  const site = useWebsite(queryRef, route);
  return <Stack gap={6} align="stretch" xstyle={styles.shell}>
    <header><Stack direction="horizontal" gap={4} align="center"><a href="/">Software engineering consulting</a><nav aria-label="Main navigation">
      <Stack direction="horizontal" gap={4}>{site.navigation.map(link => <a key={link.href} href={link.href}>{link.title}</a>)}<a href="/admin">Admin</a></Stack>
    </nav>{site.data.viewer && <Button label="Sign out" clickAction={site.signOut} isDisabled={!site.csrf} />}</Stack></header>
    <main>
      {site.notice && <p role="status">{site.notice}</p>}
      {site.error && <p role="alert">{site.error}</p>}
      {route.mode === 'login' ? <Website_Login /> : route.mode === 'admin' ? <>
        <Heading level={1}>Administration</Heading>
        <Stack gap={4}><a href="/admin/pages">Pages</a><a href="/admin/posts">Posts</a><a href="/admin/products">Products</a>
          {site.data.viewer && <a href={`/admin/users/${encodeURIComponent(site.data.viewer.id ?? '')}`}>Operator profile</a>}
        </Stack>
      </> : route.mode === 'create' || route.mode === 'edit' ? <>
        <Heading level={1}>{route.mode === 'create' ? 'Create' : 'Edit'} {route.kind}</Heading>
        <ContentForm key={`${route.kind}:${route.id ?? 'new'}`} kind={route.kind} row={site.row} />
      </> : route.kind === 'User' && site.row ? <>
        <Heading level={1}>{String(site.row.displayName)}</Heading><p>Email: {String(site.row.email)}</p><p>Role: {String(site.row.role)}. Active: {String(site.row.active)}.</p>
        <a href={`${site.base}/${encodeURIComponent(String(site.row.id))}/edit`}>Edit profile</a>
      </> : route.mode === 'list' ? <>
        <Heading level={1}>{route.kind}s</Heading>
        {site.admin && <a href={`${site.base}/new`}>Create {route.kind}</a>}
        {site.rows.length === 0 && <p>No {route.kind.toLowerCase()}s.</p>}
        {site.connection?.pageInfo.hasNextPage && <a href={`${site.base}?after=${encodeURIComponent(site.connection.pageInfo.endCursor ?? '')}`}>Next</a>}
        <Stack gap={4}>{site.rows.map(row => <article key={row.id}><Heading level={2}><a href={site.admin ? `${site.base}/${encodeURIComponent(row.id)}` : `${site.base}/${row.slug}`}>{row.title}</a></Heading><p>{row.excerpt}</p></article>)}</Stack>
      </> : site.row ? <article>
        <Heading level={1}>{String(site.row.title)}</Heading>
        {site.admin && <><p>Status: {String(site.row.status)}</p><p>Created: {String(site.row.createdAt)}. Updated: {String(site.row.updatedAt)}.</p>
          <Stack direction="horizontal" gap={4}><a href={`${site.base}/${encodeURIComponent(String(site.row.id))}/edit`}>Edit</a>
            <Button label={site.row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} clickAction={site.publish} isLoading={site.pending} />
            <Button label="Delete" onClick={site.openDelete} /></Stack></>}
        <Markdown content={String(site.row.content ?? '')} />
        {route.kind === 'Product' && typeof site.row.enquiryUrl === 'string' && site.row.enquiryUrl && <a href={site.row.enquiryUrl}>Enquire</a>}
      </article> : <>
        <Heading level={1}>{route.mode === 'home' ? 'Website content unavailable' : 'Not found'}</Heading>
        <p>{route.mode === 'home' ? 'Our consulting website is being prepared. Please check back soon.' : 'This content is unavailable.'}</p>
      </>}
      {site.deleting && <dialog open aria-labelledby="delete-title"><Heading level={2} id="delete-title">Delete {route.kind}?</Heading><p>This permanently removes the content.</p><Button label="Cancel" onClick={site.cancelDelete} /><Button label="Confirm delete" clickAction={site.confirmDelete} isLoading={site.pending} /></dialog>}
    </main>
    <footer><p>Software engineering consulting</p></footer>
  </Stack>;
}

function Website_Login() {
  const login = useLogin();
  return <><Heading level={1}>Sign in</Heading><form onSubmit={login.submit} noValidate><Stack gap={4} align="stretch">
    {login.error && <p role="alert">{login.error}</p>}
    <TextInput label="Email" htmlName="email" type="email" value={login.email} onChange={login.setEmail} />
    <TextInput label="Password" htmlName="password" type="password" value={login.password} onChange={login.setPassword} />
    <Button type="submit" label="Sign in" isLoading={login.pending} />
  </Stack></form></>;
}

function useLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending) return; setPending(true); setError('');
    try { await authRequest('login', { email, password }); navigate('/admin'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Sign in failed.'); }
    finally { setPending(false); }
  }
  return { email, password, setEmail, setPassword, error, pending, submit };
}

function useWebsite(queryRef: PreloadedQuery<WebsiteQuery>, route: WebsiteQueryRoute) {
  const data = usePreloadedQuery<WebsiteQuery>(WEBSITE_QUERY, queryRef);
  const location = useLocation(); const navigate = useNavigate();
  const [error, setError] = useState(''); const [pending, setPending] = useState(false); const [deleting, setDeleting] = useState(false);
  const [csrf, setCsrf] = useState('');
  const mutation = WebsiteMutation();
  const admin = location.pathname.startsWith('/admin');
  const base = `${admin ? '/admin' : ''}/${route.kind.toLowerCase()}s`;
  const row = selectRow(data, route);
  const connection = route.kind === 'Page' ? data.adminPages : route.kind === 'Post' ? data.posts : data.products;
  const rows = connection?.nodes?.filter((value): value is NonNullable<typeof value> => value !== null) ?? [];
  const navigation = publicNavigation(data);
  const notice = (location.state as { notice?: string } | null)?.notice;
  useEffect(() => {
    if (route.kind === 'Page' && route.slug === 'home' && route.mode === 'public') navigate('/', { replace: true });
    updateMetadata(row, location.pathname, admin);
  }, [row, location.pathname, admin, route.kind, route.slug, route.mode, navigate]);
  useEffect(() => {
    let active = true;
    fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.json()).then((value: { token: string }) => { if (active) setCsrf(value.token); }).catch(() => { if (active) setError('Could not prepare sign out. Reload and try again.'); });
    return () => { active = false; };
  }, [data.viewer?.id]);
  async function signOut() { await authRequest('logout', undefined, csrf); navigate('/admin/login'); }
  async function publish() {
    if (!row) return; setPending(true); setError('');
    try { await mutation(row.status === 'PUBLISHED' ? 'unpublish' : 'publish', route.kind, { id: row.id }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Publication failed.'); }
    finally { setPending(false); }
  }
  function openDelete() { setDeleting(true); }
  function cancelDelete() { setDeleting(false); }
  async function confirmDelete() {
    if (!row) return; setPending(true); setError('');
    try { await mutation('delete', route.kind, { id: row.id }); navigate(base); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Delete failed.'); }
    finally { setPending(false); }
  }
  return { csrf, data, admin, base, row, rows, connection, navigation, notice, error, pending, deleting, signOut, publish, openDelete, cancelDelete, confirmDelete };
}

function selectRow(data: WebsiteQuery$data, route: WebsiteQueryRoute): WebsiteRow | null | undefined {
  if (route.kind === 'User') return data.adminUser;
  if (route.mode === 'detail' || route.mode === 'edit') return route.kind === 'Page' ? data.page : route.kind === 'Post' ? data.post : data.product;
  return route.kind === 'Page' ? data.pageBySlug : route.kind === 'Post' ? data.postBySlug : data.productBySlug;
}

function publicNavigation(data: WebsiteQuery$data) {
  const links = data.pages?.nodes?.filter(row => row?.status === 'PUBLISHED' && row.slug !== 'home').map(row => ({ title: row!.title, href: `/pages/${row!.slug}` })) ?? [];
  if (data.posts?.nodes?.some(row => row?.status === 'PUBLISHED')) links.push({ title: 'Posts', href: '/posts' });
  if (data.products?.nodes?.some(row => row?.status === 'PUBLISHED')) links.push({ title: 'Products', href: '/products' });
  return links;
}

function updateMetadata(row: WebsiteRow | null | undefined, path: string, admin: boolean) {
  const title = typeof row?.title === 'string' ? row.title : path === '/' ? 'Software engineering consulting' : 'Not found';
  document.title = `${title} | Software engineering consulting`;
  setMeta('description', typeof row?.excerpt === 'string' ? row.excerpt : '');
  setMeta('og:title', title, true);
  setMeta('robots', admin || row?.status === 'DRAFT' ? 'noindex, nofollow' : 'index, follow');
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = window.location.origin + (path === '/pages/home' ? '/' : path);
}

function setMeta(name: string, content: string, property = false) {
  const attribute = property ? 'property' : 'name';
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, name); document.head.append(tag); }
  tag.content = content;
}

async function authRequest(action: string, body?: Record<string, string>, existingToken?: string) {
  const csrf = existingToken ? null : await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  const token = existingToken ? { token: existingToken } : await csrf!.json() as { token: string };
  const response = await fetch(`/auth/${action}`, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token.token }, body: JSON.stringify(body ?? {}) });
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many attempts. Try again later.' : 'Invalid email or password.');
}

type WebsiteRow = { readonly id: string; readonly [key: string]: unknown };
type WebsiteProps = { queryRef: PreloadedQuery<WebsiteQuery>; route: WebsiteQueryRoute };

const styles = stylex.create({ shell: { width: '100%', maxWidth: '72rem', marginInline: 'auto', padding: 'var(--spacing-6)' } });
