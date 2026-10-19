import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { graphql, useFragment } from 'react-relay';
import { Link, Stack } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { HomeURI, PageURI, AdminHomeURI } from '../../routes/__generated__/routes';
import { SITE_NAME } from '../../SiteName';
import { useColorMode } from '../../useColorMode';
import { useDocumentMetadata, type useDocumentMetadataRow } from '../../useDocumentMetadata';
import { useSignOut } from '../../useSignOut';
import { DisplayPreferences } from '../display-preferences/DisplayPreferences';
import type { LayoutFragment$key } from './__generated__/LayoutFragment.graphql';

const PAGES_PREFIX = PageURI.getURI({ slug: 'x' }).slice(0, -1);

// A page's accent colours its navigation hover, matching its home tile; ink is neutral.
const NAVIGATION_TONES: Readonly<Record<string, NavigationTone>> = { INK: 'ink', GREEN: 'green', ORANGE: 'orange', BLUE: 'blue', BERRY: 'berry' };

const LAYOUT_FRAGMENT = graphql`fragment LayoutFragment on RootQuery {
  viewer { id displayName role }
  navigationPages: placedPages(where: { home: false }, first: 100) { nodes { id title slug accent } }
}`;

export function Layout({ data, row, title, admin = false, children }: LayoutProps) {
  const layout = useLayout(data, row, title, admin);
  return <Stack gap={6} align="stretch" xstyle={styles.shell}>
    <header {...stylex.props(styles.header)}><div {...stylex.props(styles.headerRow)}>
      <Stack direction="horizontal" gap={1} align="center" xstyle={styles.brand}>
        <Link href={HomeURI.getURI({})} weight="bold" color="inherit" xstyle={styles.siteName}>{SITE_NAME}</Link>
      </Stack>
      <nav ref={layout.menu.element} aria-label="Main navigation" onKeyDown={layout.menu.keyDown} {...stylex.props(styles.navigation)}>
        {/* Below the mobile breakpoint the links collapse behind this disclosure button. */}
        <button ref={layout.menu.button} type="button" aria-expanded={layout.menu.open} aria-controls="site-navigation" onClick={layout.menu.toggle} {...stylex.props(styles.menuButton, tones.ink)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            {layout.menu.open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          Menu
        </button>
        <div id="site-navigation" {...stylex.props(styles.links, layout.menu.open && styles.linksOpen)}>
          {/* Home shows no visual current state; aria-current still tells assistive technology. */}
          <Link href="/" label="Home" color="inherit" aria-current={layout.homeCurrent} xstyle={[styles.navigationLink, tones.ink, styles.noUnderline]}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...stylex.props(styles.inlineIcon)}>
              <path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9" />
            </svg>
            <span aria-hidden="true" {...stylex.props(styles.mobileLabel)}>Home</span>
          </Link>
          {layout.navigation.map(link => <Link key={link.href} href={link.href} color="inherit" aria-current={link.current} xstyle={[styles.navigationLink, tones[link.tone], link.current && current[link.tone], link.current && styles.current]}>{link.href === PageURI.getURI({ slug: 'contact' }) ? 'Contact' : link.title}</Link>)}
        </div>
      </nav>
      <Stack direction="horizontal" gap={2} align="center" xstyle={styles.tools}>
        {/* Admin shows only to the signed-in operator; the server still authorizes the admin. */}
        <DisplayPreferences destination={layout.viewer ? { href: AdminHomeURI.getURI({}), label: 'Admin' } : undefined} signOut={layout.viewer ? { action: layout.signOut, ready: layout.signOutReady } : undefined} />
      </Stack>
    </div></header>
    <main>{layout.notice && <p role="status">{layout.notice}</p>}{layout.error && <p role="alert">{layout.error}</p>}{children}</main>
    <footer {...stylex.props(styles.footer)}>
      <p>© {new Date().getFullYear()} {SITE_NAME}</p>
      <Stack direction="horizontal" gap={4} xstyle={styles.footerLinks}>
        <Link href="https://hsimah.com" label="hsimah.com — personal blog" target="_blank" rel="noopener noreferrer" xstyle={styles.iconLink}>
          <img src={layout.dark ? '/assets/hsimah-dark.svg' : '/assets/hsimah-light.svg'} alt="" width={28} height={28} />
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

function useLayout(key: LayoutFragment$key, row: useDocumentMetadataRow | null | undefined, title: string | undefined, admin: boolean) {
  const data = useFragment(LAYOUT_FRAGMENT, key);
  const location = useLocation();
  // The server returns published pages placed in the navigation, in order. Home is the
  // Home icon, never a text link.
  const navigation: NavigationLink[] = (data.navigationPages?.nodes ?? [])
    .filter(value => value != null && value.slug !== 'home')
    .map(value => ({ title: value!.title, href: PageURI.getURI({ slug: value!.slug }), tone: NAVIGATION_TONES[value!.accent] ?? 'ink' }));
  useDocumentMetadata(row, title, admin);
  const session = useSignOut(data.viewer != null);
  const marked = navigation.map(link => ({ ...link, current: currentOf(link.href, location.pathname) }));
  const menu = useMenu(location.pathname);
  const dark = useColorMode().dark;
  return { navigation: marked, homeCurrent: currentOf('/', location.pathname), menu, dark, viewer: data.viewer, error: session.error, signOut: session.signOut, signOutReady: session.ready, notice: (location.state as { notice?: string } | null)?.notice };
}

// The mobile disclosure menu: Escape or a click outside closes it and returns focus to
// its button; following a link closes it. Above the breakpoint the links always show.
function useMenu(path: string) {
  const [open, setOpen] = useState(false);
  const element = useRef<HTMLElement>(null); const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!element.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); };
  }, [open]);
  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape' || !open) return;
    setOpen(false); button.current?.focus();
  }
  return { open, element, button, keyDown, toggle: () => { setOpen(value => !value); } };
}

// The link for this URL is the current page. A page that holds items stays current, as a
// section, on its items at /<page-slug>/<item-slug>.
function currentOf(href: string, path: string): 'page' | 'true' | undefined {
  if (path === href) return 'page';
  const slug = href.startsWith(PAGES_PREFIX) ? href.slice(PAGES_PREFIX.length) : null;
  return slug && path.startsWith(`/${slug}/`) ? 'true' : undefined;
}

type NavigationTone = 'green' | 'orange' | 'blue' | 'berry' | 'ink';
type NavigationLink = { title: string; href: string; tone: NavigationTone };
type LayoutProps = { data: LayoutFragment$key; row?: useDocumentMetadataRow | null; title?: string; admin?: boolean; children: ReactNode };

const styles = stylex.create({
  shell: { width: '100%', maxWidth: '72rem', minHeight: '100vh', marginInline: 'auto', padding: { default: 'var(--spacing-6)', '@media (max-width: 760px)': '1rem' }, boxSizing: 'border-box' },
  // Translucent so the page shows through, blurred so the menu stays legible over content.
  header: {
    position: 'sticky', top: 'var(--spacing-3)', zIndex: 10, paddingBlock: '0.5rem', paddingInline: { default: '1.25rem', '@media (max-width: 760px)': '0.75rem' }, fontSize: '0.9rem',
    backgroundColor: 'color-mix(in srgb, var(--site-canvas) 72%, transparent)', backdropFilter: 'blur(14px) saturate(160%)',
    border: '1px solid var(--site-hairline)', borderRadius: 'var(--radius-container)', boxShadow: '0 10px 30px -18px rgb(0 0 0 / 0.5)',
  },
  headerRow: { display: 'flex', alignItems: 'center', gap: { default: '1rem', '@media (max-width: 760px)': '0.25rem' } },
  brand: { flexShrink: 0, marginInlineEnd: 'auto' },
  siteName: { fontSize: '1.05rem', letterSpacing: '0.02em' },
  // Takes the width the brand and tools leave, wrapping its links inside it rather than over them.
  navigation: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1, flexShrink: 1, minWidth: 0 },
  menuButton: {
    display: { default: 'none', '@media (max-width: 760px)': 'inline-flex' }, alignItems: 'center', gap: '0.4rem', minHeight: '44px', paddingInline: '0.75rem',
    font: 'inherit', fontWeight: 600, border: '1px solid var(--site-hairline)', borderRadius: 'var(--radius-full)', cursor: 'pointer',
  },
  links: {
    display: { default: 'flex', '@media (max-width: 760px)': 'none' }, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: '0.25rem',
  },
  // The open mobile menu drops below the header as a full-width panel.
  linksOpen: {
    display: 'flex', flexDirection: { default: 'row', '@media (max-width: 760px)': 'column' }, alignItems: { default: 'center', '@media (max-width: 760px)': 'stretch' },
    position: { default: 'static', '@media (max-width: 760px)': 'absolute' }, insetInline: { default: 'auto', '@media (max-width: 760px)': 0 }, top: { default: 'auto', '@media (max-width: 760px)': 'calc(100% + 0.5rem)' },
    padding: { default: 0, '@media (max-width: 760px)': '0.5rem' }, maxHeight: { default: 'none', '@media (max-width: 760px)': 'calc(100dvh - 6rem)' }, overflowY: { default: 'visible', '@media (max-width: 760px)': 'auto' },
    backgroundColor: { default: 'transparent', '@media (max-width: 760px)': 'var(--site-canvas)' }, border: { default: 'none', '@media (max-width: 760px)': '1px solid var(--site-hairline)' }, borderRadius: 'var(--radius-container)',
    boxShadow: { default: 'none', '@media (max-width: 760px)': '0 16px 40px -20px rgb(0 0 0 / 0.6)' },
  },
  tools: { flexShrink: 0 },
  // The background fades in and a 2px underline grows out from the middle on hover and
  // focus, shrinking back to the middle on leave. The underline is a centred gradient
  // whose width animates. --site-motion is near zero when animations are off.
  navigationLink: {
    display: 'inline-flex', alignItems: 'center', minHeight: { default: '2.25rem', '@media (max-width: 760px)': '44px' }, paddingInline: '0.75rem', borderRadius: 'var(--radius-full)', textDecoration: 'none',
    backgroundImage: 'linear-gradient(currentColor, currentColor)', backgroundRepeat: 'no-repeat', backgroundOrigin: 'content-box', backgroundPosition: '50% calc(100% - 0.3rem)',
    backgroundSize: { default: '0% 2px', ':hover': '100% 2px', ':focus-visible': '100% 2px' },
    transitionProperty: 'color, background-color, background-size', transitionDuration: 'var(--site-motion)', transitionTimingFunction: 'var(--ease-standard)',
  },
  // The icon-only Home link gets a visible label in the mobile menu, where the current-page underline needs text.
  inlineIcon: { display: 'inline-block', verticalAlign: '-0.25em' },
  mobileLabel: { display: { default: 'none', '@media (max-width: 760px)': 'inline' }, marginInlineStart: '0.5rem' },
  // The Home icon link never draws the underline.
  noUnderline: { backgroundImage: 'none' },
  // Not colour alone: the current link keeps its underline drawn.
  current: { backgroundSize: '100% 2px' },
  footer: { marginTop: 'auto', paddingBlock: '1.5rem', borderTop: '1px solid var(--site-hairline)', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  footerLinks: { flexWrap: 'wrap' },
  iconLink: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' },
  githubIcon: { backgroundColor: '#24292f', borderRadius: '50%', padding: '3px', boxSizing: 'content-box' },
});

// Hover and focus colours. Each tone keeps AA contrast on the canvas and on its own tint.
const tones = stylex.create({
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
  berry: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-berry)', ':focus-visible': 'var(--site-berry)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-berry) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-berry) 14%, transparent)' },
  },
  ink: {
    color: { default: 'var(--color-text-primary)', ':hover': 'var(--site-ink)', ':focus-visible': 'var(--site-ink)' },
    backgroundColor: { default: 'transparent', ':hover': 'color-mix(in srgb, var(--site-ink) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-ink) 14%, transparent)' },
  },
});

// The current link keeps a light tint of its hover colour.
const current = stylex.create({
  green: {
    color: 'var(--site-green)',
    backgroundColor: { default: 'color-mix(in srgb, var(--site-green) 9%, transparent)', ':hover': 'color-mix(in srgb, var(--site-green) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-green) 14%, transparent)' },
  },
  orange: {
    color: 'var(--site-orange)',
    backgroundColor: { default: 'color-mix(in srgb, var(--site-orange) 9%, transparent)', ':hover': 'color-mix(in srgb, var(--site-orange) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-orange) 14%, transparent)' },
  },
  blue: {
    color: 'var(--site-blue)',
    backgroundColor: { default: 'color-mix(in srgb, var(--site-blue) 9%, transparent)', ':hover': 'color-mix(in srgb, var(--site-blue) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-blue) 14%, transparent)' },
  },
  berry: {
    color: 'var(--site-berry)',
    backgroundColor: { default: 'color-mix(in srgb, var(--site-berry) 9%, transparent)', ':hover': 'color-mix(in srgb, var(--site-berry) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-berry) 14%, transparent)' },
  },
  ink: {
    color: 'var(--site-ink)',
    backgroundColor: { default: 'color-mix(in srgb, var(--site-ink) 9%, transparent)', ':hover': 'color-mix(in srgb, var(--site-ink) 14%, transparent)', ':focus-visible': 'color-mix(in srgb, var(--site-ink) 14%, transparent)' },
  },
});
