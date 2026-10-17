import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { PageURI } from './routes/__generated__/routes';
import { SITE_NAME } from './SiteName';

/**
 * Keeps the document title, description, robots and canonical link in step with the
 * screen. `heading` names screens without a content row (lists, forms, admin); a
 * missing row on a content route is the only "Not found".
 */
export function useDocumentMetadata(row: useDocumentMetadataRow | null | undefined, heading: string | undefined, admin: boolean) {
  const path = useLocation().pathname;
  useEffect(() => { updateMetadata(row, heading, path, admin); }, [row, heading, path, admin]);
}

export type useDocumentMetadataRow = { readonly title?: unknown; readonly excerpt?: unknown; readonly status?: unknown };

function updateMetadata(row: useDocumentMetadataRow | null | undefined, heading: string | undefined, path: string, admin: boolean) {
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
