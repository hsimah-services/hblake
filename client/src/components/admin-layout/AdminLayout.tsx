import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { graphql, useFragment } from 'react-relay';
import { AppShell } from '@astryxdesign/core/AppShell';
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { TopNav } from '@astryxdesign/core/TopNav';
import { Badge, Button, Link, Stack, Text } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { AdminHomeURI, AdminPageListURI, AdminPostListURI, AdminProductListURI, AdminUserDetailURI, HomeURI } from '../../routes/__generated__/routes';
import { SITE_NAME } from '../../SiteName';
import { useDocumentMetadata, type useDocumentMetadataRow } from '../../useDocumentMetadata';
import { useSignOut } from '../../useSignOut';
import { DisplayPreferences } from '../display-preferences/DisplayPreferences';
import type { AdminLayoutFragment$key } from './__generated__/AdminLayoutFragment.graphql';

const ADMIN_LAYOUT_FRAGMENT = graphql`fragment AdminLayoutFragment on RootQuery {
  viewer { id displayName }
  pageCount: pages(first: 1) { totalCount }
  postCount: posts(first: 1) { totalCount }
  productCount: products(first: 1) { totalCount }
}`;

/** The WordPress-style admin frame: a top bar, a sidebar of content types and the screen. */
export function AdminLayout({ data, section, title, row, children }: AdminLayoutProps) {
  const layout = useAdminLayout(data, row, title);
  return <AppShell
    topNav={<TopNav label="Site tools" heading={<AdminLayout_Brand />} endContent={<Stack direction="horizontal" gap={2} align="center">
      <Link href={HomeURI.getURI({})} xstyle={styles.viewSite}>View site</Link>
      <DisplayPreferences />
      {layout.viewer && <Button label="Sign out" clickAction={layout.signOut} isDisabled={!layout.signOutReady} />}
    </Stack>} />}
    sideNav={<SideNav aria-label="Administration">
      <SideNavSection title="Manage" isHeaderHidden>
        <SideNavItem label="Dashboard" href={AdminHomeURI.getURI({})} isSelected={section === 'dashboard'} icon={<AdminLayout_Icon path="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />} />
        {layout.sections.map(item => <SideNavItem key={item.href} label={item.label} href={item.href} isSelected={section === item.section} icon={<AdminLayout_Icon path={item.icon} />}
          endContent={<Badge label={item.count} aria-label={`${item.count} ${item.label.toLowerCase()}`} />} />)}
      </SideNavSection>
      {layout.viewer && <SideNavSection title="Account" isHeaderHidden>
        <SideNavItem label="Settings" href={AdminUserDetailURI.getURI({ id: layout.viewer.id ?? '' })} isSelected={section === 'settings'} icon={<AdminLayout_Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />} />
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

export type AdminLayoutSection = 'dashboard' | 'pages' | 'posts' | 'products' | 'settings';

function AdminLayout_Brand() {
  return <Stack direction="horizontal" gap={2} align="center">
    <Link href={HomeURI.getURI({})} weight="bold" color="inherit">{SITE_NAME}</Link>
    <Text color="secondary">Admin</Text>
  </Stack>;
}

function AdminLayout_Icon({ path }: { path: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>;
}

function useAdminLayout(key: AdminLayoutFragment$key, row: useDocumentMetadataRow | null | undefined, title: string | undefined) {
  const data = useFragment(ADMIN_LAYOUT_FRAGMENT, key);
  const location = useLocation();
  useDocumentMetadata(row, title, true);
  const session = useSignOut(data.viewer != null);
  const sections = [
    { section: 'pages', label: 'Pages', href: AdminPageListURI.getURI({}), count: data.pageCount?.totalCount ?? 0, icon: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5' },
    { section: 'posts', label: 'Posts', href: AdminPostListURI.getURI({}), count: data.postCount?.totalCount ?? 0, icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
    { section: 'products', label: 'Products', href: AdminProductListURI.getURI({}), count: data.productCount?.totalCount ?? 0, icon: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8' },
  ] as const;
  return { viewer: data.viewer, sections, error: session.error, signOut: session.signOut, signOutReady: session.ready, notice: (location.state as { notice?: string } | null)?.notice };
}

type AdminLayoutProps = { data: AdminLayoutFragment$key; section: AdminLayoutSection; title?: string; row?: useDocumentMetadataRow | null; children: ReactNode };

const styles = stylex.create({
  content: { width: '100%', maxWidth: '72rem', marginInline: 'auto', padding: { default: 'var(--spacing-6)', '@media (max-width: 760px)': '1rem' }, boxSizing: 'border-box' },
  viewSite: { display: { default: 'inline-flex', '@media (max-width: 480px)': 'none' }, alignItems: 'center', minHeight: '44px', paddingInline: '0.5rem' },
});
