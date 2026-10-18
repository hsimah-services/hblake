import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core';
import { Markdown } from '../markdown/Markdown';
import { publicationDetails } from '../../publicationDetails';

export function PublicContent({ row, home = false }: PublicContentProps) {
  const details = publicationDetails(row?.publishedAt, row?.content);
  return row ? <article {...stylex.props(styles.article)}><Heading level={1}>{row.title}</Heading>
    {row.author && <p {...stylex.props(styles.byline)}>By {row.author.displayName}{details && <> · <time dateTime={details.iso}>{details.date}</time> · {details.minutes} min read</>}</p>}
    <Markdown content={row.content ?? ''} />
    {row.enquiryUrl && <a href={row.enquiryUrl}>Enquire</a>}
  </article> : <><Heading level={1}>{home ? 'Website content unavailable' : 'Not found'}</Heading><p>This content is unavailable.</p></>;
}

type PublicContentProps = { row?: { readonly title: string; readonly content?: string | null; readonly enquiryUrl?: string | null; readonly author?: { readonly displayName: string } | null; readonly publishedAt?: string | null } | null; home?: boolean };

const styles = stylex.create({
  article: { maxWidth: '52rem', lineHeight: 1.8 },
  byline: { color: 'var(--color-text-secondary)' },
});
