import { Link } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export function Markdown({ content }: { content: string }) {
  return <ReactMarkdown skipHtml rehypePlugins={[rehypeSanitize]} components={{ h1: Markdown_Heading, h2: Markdown_Heading, h3: Markdown_Subheading, p: Markdown_Paragraph, a: Markdown_Link, img: Markdown_Image }}>{content}</ReactMarkdown>;
}

function Markdown_Heading({ children }: { children?: React.ReactNode }) {
  return <h2 {...stylex.props(styles.heading)}>{children}</h2>;
}

function Markdown_Subheading({ children }: { children?: React.ReactNode }) {
  return <h3 {...stylex.props(styles.heading)}>{children}</h3>;
}

// Astryx links go through the app link provider, so internal links navigate in-app and preload on hover.
function Markdown_Link({ href, children }: { href?: string; children?: React.ReactNode }) {
  return <Link href={href} hasUnderline>{children}</Link>;
}

// Uploaded post images (/media/…) fill the column and load lazily; other images, such as
// a logo beside a heading, stay small inline marks.
function Markdown_Image({ src, alt }: { src?: string; alt?: string }) {
  return src?.startsWith('/media/')
    ? <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" {...stylex.props(styles.media)} />
    : <img src={src} alt={alt ?? ''} width={56} height={56} {...stylex.props(styles.image)} />;
}

function Markdown_Paragraph({ children }: { children?: React.ReactNode }) {
  return <p {...stylex.props(styles.paragraph)}>{children}</p>;
}

const styles = stylex.create({
  heading: { marginTop: '1.5rem', marginBottom: '0.75rem' },
  image: { verticalAlign: 'middle', marginInlineEnd: '0.75rem', objectFit: 'contain' },
  media: { display: 'block', maxWidth: '100%', height: 'auto', marginBlock: '1.5rem', borderRadius: '0.5rem' },
  paragraph: { marginBlock: '1rem', lineHeight: 1.8 },
});
