import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { graphql, useFragment } from 'react-relay';
import { Button, Stack } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { HomeURI, PageURI, PostListURI, ProductListURI, AdminHomeURI, LoginURI } from '../../routes/__generated__/routes';
import { SITE_NAME } from '../../SiteName';
import { authRequest } from '../../authRequest';
import type { LayoutFragment$key } from './__generated__/LayoutFragment.graphql';

const LAYOUT_FRAGMENT = graphql`fragment LayoutFragment on RootQuery {
  viewer { id displayName role }
  navigationPages: pages(first: 100) { nodes { id title slug status } }
  navigationPosts: posts(first: 100) { nodes { status } }
  navigationProducts: products(first: 100) { nodes { status } }
}`;

export function Layout({ data, row, admin = false, children }: LayoutProps) {
  const layout = useLayout(data, row, admin);
  return <Stack gap={6} align="stretch" xstyle={styles.shell}>
    <header><Stack direction="horizontal" gap={4} align="center">
      <Link to={HomeURI.getURI({})}>{SITE_NAME}</Link>
      <nav aria-label="Main navigation"><Stack direction="horizontal" gap={4}>
        {layout.navigation.map(link => <Link key={link.href} to={link.href}>{link.title}</Link>)}
        <Link to={AdminHomeURI.getURI({})}>Admin</Link>
      </Stack></nav>
      {layout.viewer && <Button label="Sign out" clickAction={layout.signOut} isDisabled={!layout.csrf} />}
    </Stack></header>
    <main>{layout.notice && <p role="status">{layout.notice}</p>}{layout.error && <p role="alert">{layout.error}</p>}{children}</main>
    <footer><p>{SITE_NAME}</p></footer>
  </Stack>;
}

function useLayout(key: LayoutFragment$key, row: LayoutRow | null | undefined, admin: boolean) {
  const data = useFragment(LAYOUT_FRAGMENT, key);
  const location = useLocation(); const navigate = useNavigate();
  const [csrf, setCsrf] = useState(''); const [error, setError] = useState('');
  const navigation = data.navigationPages?.nodes?.filter(value => value?.status === 'PUBLISHED' && value.slug !== 'home').map(value => ({ title: value!.title, href: PageURI.getURI({ slug: value!.slug }) })) ?? [];
  if (data.navigationPosts?.nodes?.some(value => value?.status === 'PUBLISHED')) navigation.push({ title: 'Posts', href: PostListURI.getURI({}) });
  if (data.navigationProducts?.nodes?.some(value => value?.status === 'PUBLISHED')) navigation.push({ title: 'Products', href: ProductListURI.getURI({}) });
  useEffect(() => { updateMetadata(row, location.pathname, admin); }, [row, location.pathname, admin]);
  useEffect(() => {
    if (!data.viewer) return;
    let active = true;
    fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.json()).then((value: { token: string }) => { if (active) setCsrf(value.token); }).catch(() => { if (active) setError('Could not prepare sign out. Reload and try again.'); });
    return () => { active = false; };
  }, [data.viewer]);
  async function signOut() { await authRequest('logout', undefined, csrf); navigate(LoginURI.getURI({})); }
  return { navigation, viewer: data.viewer, csrf, error, signOut, notice: (location.state as { notice?: string } | null)?.notice };
}

function updateMetadata(row: LayoutRow | null | undefined, path: string, admin: boolean) {
  const title = typeof row?.title === 'string' ? row.title : path === '/' ? SITE_NAME : 'Not found';
  document.title = `${title} | ${SITE_NAME}`;
  setMeta('description', typeof row?.excerpt === 'string' ? row.excerpt : '');
  setMeta('og:title', title, true);
  setMeta('robots', admin || row?.status === 'DRAFT' ? 'noindex, nofollow' : 'index, follow');
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = window.location.origin + (path === PageURI.getURI({ slug: 'home' }) ? '/' : path);
}

function setMeta(name: string, content: string, property = false) {
  const attribute = property ? 'property' : 'name';
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, name); document.head.append(tag); }
  tag.content = content;
}

type LayoutRow = { readonly title?: unknown; readonly excerpt?: unknown; readonly status?: unknown };
type LayoutProps = { data: LayoutFragment$key; row?: LayoutRow | null; admin?: boolean; children: ReactNode };

const styles = stylex.create({ shell: { width: '100%', maxWidth: '72rem', marginInline: 'auto', padding: 'var(--spacing-6)' } });
