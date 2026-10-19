import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core';
import { Markdown } from '../markdown/Markdown';
import { publicationDetails } from '../../publicationDetails';

export function PublicContent({ row, home = false }: PublicContentProps) {
  const details = publicationDetails(row?.publishedAt, row?.content);
  return row ? <article {...stylex.props(styles.article)}><Heading level={1}>{row.title}</Heading>
    {row.author && <p {...stylex.props(styles.byline)}>By {row.author.displayName}{details && <> · <time dateTime={details.iso}>{details.date}</time> · {details.minutes} min read</>}</p>}
    {row.imageUrl && <img src={row.imageUrl} alt={row.imageAlt ?? ''} {...stylex.props(styles.image)} />}
    <Markdown content={row.content ?? ''} />
    {row.enquiryUrl && <a href={row.enquiryUrl}>Enquire</a>}
  </article> : <><Heading level={1}>{home ? 'Website content unavailable' : 'Not found'}</Heading><p>This content is unavailable.</p></>;
}

type PublicContentProps = { row?: { readonly title: string; readonly content?: string | null; readonly enquiryUrl?: string | null; readonly imageUrl?: string | null; readonly imageAlt?: string | null; readonly author?: { readonly displayName: string } | null; readonly publishedAt?: string | null } | null; home?: boolean };

const styles = stylex.create({
  article: { maxWidth: '52rem', lineHeight: 1.8 },
  image: { display: 'block', maxWidth: '100%', height: 'auto', marginBlock: '1.5rem', borderRadius: 'var(--radius-element)' },
  byline: { color: 'var(--color-text-secondary)' },
});
