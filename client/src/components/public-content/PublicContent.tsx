import { Heading } from '@astryxdesign/core';
import { Markdown } from '../markdown/Markdown';

export function PublicContent({ row, home = false }: PublicContentProps) {
  return row ? <article><Heading level={1}>{row.title}</Heading><Markdown content={row.content ?? ''} />
    {row.enquiryUrl && <a href={row.enquiryUrl}>Enquire</a>}
  </article> : <><Heading level={1}>{home ? 'Website content unavailable' : 'Not found'}</Heading><p>This content is unavailable.</p></>;
}

type PublicContentProps = { row?: { readonly title: string; readonly content?: string | null; readonly enquiryUrl?: string | null } | null; home?: boolean };
