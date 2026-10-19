import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { graphql, useFragment } from 'react-relay';
import { AppShell } from '@astryxdesign/core/AppShell';
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { TopNav } from '@astryxdesign/core/TopNav';
import { Badge, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { AdminHomeURI, AdminPageItemListURI, AdminPageListURI, AdminUserDetailURI, HomeURI } from '../../routes/__generated__/routes';
import { SITE_NAME } from '../../SiteName';
import { useDocumentMetadata, type useDocumentMetadataRow } from '../../useDocumentMetadata';
import { useSignOut } from '../../useSignOut';
import { DisplayPreferences } from '../display-preferences/DisplayPreferences';
import { AdminIcon } from '../admin-icon/AdminIcon';
import type { AdminLayoutFragment$key } from './__generated__/AdminLayoutFragment.graphql';

const ADMIN_LAYOUT_FRAGMENT = graphql`fragment AdminLayoutFragment on RootQuery {
  viewer { id displayName }
  pageCount: pages(first: 1) { totalCount }
  itemPages: pages(first: 100) { nodes { title slug defaultItemKind itemCount } }
}`;

/** The WordPress-style admin frame: a top bar, a sidebar of content types and the screen. */
export function AdminLayout({ data, section, title, row, children }: AdminLayoutProps) {
  const layout = useAdminLayout(data, row, title);
  return <AppShell
    topNav={<TopNav label="Site tools" heading={<AdminLayout_Brand />} endContent={<Stack direction="horizontal" gap={2} align="center">
      <DisplayPreferences destination={{ href: HomeURI.getURI({}), label: 'View site' }} signOut={layout.viewer ? { action: layout.signOut, ready: layout.signOutReady } : undefined} />
    </Stack>} />}
    sideNav={<SideNav aria-label="Administration">
      <SideNavSection title="Manage" isHeaderHidden>
        <SideNavItem label="Dashboard" href={AdminHomeURI.getURI({})} isSelected={section === 'dashboard'} icon={<AdminIcon name="dashboard" />} />
        {layout.sections.map(item => <SideNavItem key={item.href} label={item.label} href={item.href} isSelected={section === item.section} icon={<AdminIcon name={item.icon} />}
          endContent={<Badge label={item.count} aria-label={`${item.count} ${item.label.toLowerCase()}`} />} />)}
      </SideNavSection>
      {layout.viewer && <SideNavSection title="Account" isHeaderHidden>
        <SideNavItem label="Settings" href={AdminUserDetailURI.getURI({ id: layout.viewer.id ?? '' })} isSelected={section === 'settings'} icon={<AdminIcon name="settings" />} />
      </SideNavSection>}
    </SideNav>}
  >
    <Stack gap={4} align="stretch" xstyle={styles.content}>
      {layout.notice && <p role="status">{layout.notice}</p>}
      {layout.error && <p role="alert">{layout.error}</p>}
      {children}
    </Stack>
  </AppShell>;
}

/** A section of the sidebar: `items:<slug>` is the items of the page with that slug. */
export type AdminLayoutSection = 'dashboard' | 'pages' | 'settings' | `items:${string}`;

function AdminLayout_Brand() {
  return <Stack direction="horizontal" gap={2} align="center">
    <Link href={HomeURI.getURI({})} weight="bold" color="inherit">{SITE_NAME}</Link>
    <Text color="secondary">Admin</Text>
  </Stack>;
}

function useAdminLayout(key: AdminLayoutFragment$key, row: useDocumentMetadataRow | null | undefined, title: string | undefined) {
  const data = useFragment(ADMIN_LAYOUT_FRAGMENT, key);
  const location = useLocation();
  useDocumentMetadata(row, title, true);
  const session = useSignOut(data.viewer != null);
  // Pages, then one section for each page that holds items.
  const holders = (data.itemPages?.nodes ?? []).flatMap(page => page != null && page.defaultItemKind != null ? [page] : []);
  const sections = [
    { section: 'pages', label: 'Pages', href: AdminPageListURI.getURI({}), count: data.pageCount?.totalCount ?? 0, icon: 'page' as const },
    ...holders.map(page => ({ section: `items:${page.slug}`, label: page.title, href: AdminPageItemListURI.getURI({ page: page.slug }), count: page.itemCount, icon: page.defaultItemKind === 'Product' ? 'product' as const : 'news' as const })),
  ];
  return { viewer: data.viewer, sections, error: session.error, signOut: session.signOut, signOutReady: session.ready, notice: (location.state as { notice?: string } | null)?.notice };
}

type AdminLayoutProps = { data: AdminLayoutFragment$key; section: AdminLayoutSection; title?: string; row?: useDocumentMetadataRow | null; children: ReactNode };

const styles = stylex.create({
  content: { width: '100%', maxWidth: '72rem', marginInline: 'auto', padding: { default: 'var(--spacing-6)', '@media (max-width: 760px)': '1rem' }, boxSizing: 'border-box' },
});
