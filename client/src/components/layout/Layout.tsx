import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { graphql, useFragment } from 'react-relay';
import { Link, Button, Stack } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { HomeURI, PageURI, PostListURI, ProductListURI, LoginURI } from '../../routes/__generated__/routes';
import { SITE_NAME } from '../../SiteName';
import { authRequest } from '../../authRequest';
import type { LayoutFragment$key } from './__generated__/LayoutFragment.graphql';

// Navigation hover colours match the home page destination tiles.
const NAVIGATION_TONES: Readonly<Record<string, NavigationTone>> = { about: 'green', frameworks: 'orange', portfolio: 'blue', contact: 'red' };

const LAYOUT_FRAGMENT = graphql`fragment LayoutFragment on RootQuery {
  viewer { id displayName role }
  navigationPages: pages(first: 100) { nodes { id title slug status } }
  navigationPosts: posts(first: 100) { nodes { status } }
  navigationProducts: products(first: 100) { nodes { status } }
}`;

export function Layout({ data, row, title, admin = false, children }: LayoutProps) {
  const layout = useLayout(data, row, title, admin);
  return <Stack gap={6} align="stretch" xstyle={styles.shell}>
    <header {...stylex.props(styles.header)}><Stack direction="horizontal" gap={4} align="center" xstyle={styles.headerRow}>
      <Link href={HomeURI.getURI({})} weight="bold" color="inherit" xstyle={styles.siteName}>{SITE_NAME}</Link>
      <nav aria-label="Main navigation"><Stack direction="horizontal" gap={1} xstyle={styles.navigation}>
        <Link href="/" label="Home" color="inherit" xstyle={[styles.navigationLink, styles.violet]}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9" />
          </svg>
        </Link>
        {layout.navigation.map(link => <Link key={link.href} href={link.href} color="inherit" xstyle={[styles.navigationLink, styles[link.tone]]}>{link.href === PageURI.getURI({ slug: 'contact' }) ? 'Contact' : link.title}</Link>)}
      </Stack></nav>
      {layout.viewer && <Button label="Sign out" clickAction={layout.signOut} isDisabled={!layout.csrf} />}
    </Stack></header>
    <main>{layout.notice && <p role="status">{layout.notice}</p>}{layout.error && <p role="alert">{layout.error}</p>}{children}</main>
    <footer {...stylex.props(styles.footer)}>
      <p>© {new Date().getFullYear()} {SITE_NAME}</p>
      <Stack direction="horizontal" gap={4} xstyle={styles.footerLinks}>
        <Link href="https://hsimah.com" label="hsimah.com — personal blog" target="_blank" rel="noopener noreferrer" xstyle={styles.iconLink}>
          <picture>
            <source srcSet="/assets/hsimah-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/assets/hsimah-light.svg" alt="" width={28} height={28} />
          </picture>
        </Link>
        <Link href="https://github.com/hsimah-services" label="hsimah-services on GitHub" target="_blank" rel="noopener noreferrer" xstyle={styles.iconLink}>
          <img src="/assets/github.svg" alt="" width={28} height={28} {...stylex.props(styles.githubIcon)} />
        </Link>
        <Link href="https://www.linkedin.com/in/hamishblake/" label="Hamish Blake on LinkedIn" target="_blank" rel="noopener noreferrer" xstyle={styles.iconLink}>
          <img src="/assets/linkedin.svg" alt="" width={28} height={28} />
        </Link>
      </Stack>
    </footer>
  </Stack>;
}

function useLayout(key: LayoutFragment$key, row: LayoutRow | null | undefined, title: string | undefined, admin: boolean) {
  const data = useFragment(LAYOUT_FRAGMENT, key);
  const location = useLocation(); const navigate = useNavigate();
  const [csrf, setCsrf] = useState(''); const [error, setError] = useState('');
  const navigation: NavigationLink[] = data.navigationPages?.nodes?.filter(value => value?.status === 'PUBLISHED' && value.slug !== 'home').map(value => ({ title: value!.title, href: PageURI.getURI({ slug: value!.slug }), tone: NAVIGATION_TONES[value!.slug] ?? 'violet' })) ?? [];
  const order = ['about', 'frameworks', 'portfolio', 'contact'].map(slug => PageURI.getURI({ slug }));
  navigation.sort((a, b) => {
    const first = order.indexOf(a.href); const second = order.indexOf(b.href);
    return (first < 0 ? order.length : first) - (second < 0 ? order.length : second);
  });
  if (data.navigationPosts?.nodes?.some(value => value?.status === 'PUBLISHED')) navigation.push({ title: 'Posts', href: PostListURI.getURI({}), tone: 'violet' });
  if (data.navigationProducts?.nodes?.some(value => value?.status === 'PUBLISHED')) navigation.push({ title: 'Products', href: ProductListURI.getURI({}), tone: 'violet' });
  useEffect(() => { updateMetadata(row, title, location.pathname, admin); }, [row, title, location.pathname, admin]);
  useEffect(() => {
    if (!data.viewer) return;
    let active = true;
    fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.json()).then((value: { token: string }) => { if (active) setCsrf(value.token); }).catch(() => { if (active) setError('Could not prepare sign out. Reload and try again.'); });
    return () => { active = false; };
  }, [data.viewer]);
  async function signOut() { await authRequest('logout', undefined, csrf); navigate(LoginURI.getURI({})); }
  return { navigation, viewer: data.viewer, csrf, error, signOut, notice: (location.state as { notice?: string } | null)?.notice };
}

// `heading` names screens without a content row (lists, forms, admin home); a missing
// row on a content route is the only "Not found".
function updateMetadata(row: LayoutRow | null | undefined, heading: string | undefined, path: string, admin: boolean) {
  const title = heading ?? (typeof row?.title === 'string' ? row.title : path === '/' ? SITE_NAME : 'Not found');
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

type NavigationTone = 'green' | 'orange' | 'blue' | 'red' | 'violet';
type NavigationLink = { title: string; href: string; tone: NavigationTone };
type LayoutRow = { readonly title?: unknown; readonly excerpt?: unknown; readonly status?: unknown };
type LayoutProps = { data: LayoutFragment$key; row?: LayoutRow | null; title?: string; admin?: boolean; children: ReactNode };

const styles = stylex.create({
  shell: { width: '100%', maxWidth: '72rem', minHeight: '100vh', marginInline: 'auto', padding: 'var(--spacing-6)' },
  // Translucent so the page shows through, blurred so the menu stays legible over content.
  header: {
    position: 'sticky', top: 'var(--spacing-3)', zIndex: 10, paddingBlock: '0.75rem', paddingInline: '1.25rem', fontSize: '0.9rem',
    backgroundColor: 'color-mix(in srgb, var(--site-canvas) 72%, transparent)', backdropFilter: 'blur(14px) saturate(160%)',
    border: '1px solid var(--site-hairline)', borderRadius: '1rem', boxShadow: '0 10px 30px -18px rgb(0 0 0 / 0.5)',
  },
  siteName: { fontSize: '1.05rem', letterSpacing: '0.02em' },
  navigationLink: {
    display: 'inline-flex', alignItems: 'center', minHeight: '2.25rem', paddingInline: '0.75rem', borderRadius: '999px', textDecoration: 'none',
    transitionProperty: 'color, background-color', transitionDuration: 'var(--duration-fast)', transitionTimingFunction: 'var(--ease-standard)',
  },
  green: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-green)', ':focus-visible': 'var(--site-green)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-green) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-green) 14%, transparent)' },
  },
  orange: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-orange)', ':focus-visible': 'var(--site-orange)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-orange) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-orange) 14%, transparent)' },
  },
  blue: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-blue)', ':focus-visible': 'var(--site-blue)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-blue) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-blue) 14%, transparent)' },
  },
  red: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-red)', ':focus-visible': 'var(--site-red)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-red) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-red) 14%, transparent)' },
  },
  violet: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-violet)', ':focus-visible': 'var(--site-violet)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-violet) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-violet) 14%, transparent)' },
  },
  headerRow: { flexWrap: 'wrap', justifyContent: 'space-between' },
  footer: { marginTop: 'auto', paddingBlock: '1.5rem', borderTop: '1px solid var(--site-hairline)', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem' },
  footerLinks: { flexWrap: 'wrap' },
  navigation: { flexWrap: 'wrap' },
  iconLink: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' },
  githubIcon: { backgroundColor: '#24292f', borderRadius: '50%', padding: '3px', boxSizing: 'content-box' },
});
