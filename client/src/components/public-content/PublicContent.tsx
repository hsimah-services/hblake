import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core';
import { Markdown } from '../markdown/Markdown';

export function PublicContent({ row, home = false }: PublicContentProps) {
  return row ? <article {...stylex.props(styles.article)}><Heading level={1}>{row.title}</Heading>{row.author && <p {...stylex.props(styles.byline)}>By {row.author.displayName}</p>}<Markdown content={row.content ?? ''} />
    {row.enquiryUrl && <a href={row.enquiryUrl}>Enquire</a>}
  </article> : <><Heading level={1}>{home ? 'Website content unavailable' : 'Not found'}</Heading><p>This content is unavailable.</p></>;
}

type PublicContentProps = { row?: { readonly title: string; readonly content?: string | null; readonly enquiryUrl?: string | null; readonly author?: { readonly displayName: string } | null } | null; home?: boolean };

const styles = stylex.create({
  article: { maxWidth: '52rem', lineHeight: 1.8 },
  byline: { color: 'var(--color-text-secondary)' },
});
