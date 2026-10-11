import { Link } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export function Markdown({ content }: { content: string }) {
  return <ReactMarkdown skipHtml rehypePlugins={[rehypeSanitize]} components={{ h1: Markdown_Heading, h2: Markdown_Heading, h3: Markdown_Subheading, p: Markdown_Paragraph, a: Markdown_Link }}>{content}</ReactMarkdown>;
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

function Markdown_Paragraph({ children }: { children?: React.ReactNode }) {
  return <p {...stylex.props(styles.paragraph)}>{children}</p>;
}

const styles = stylex.create({
  heading: { marginTop: '1.5rem', marginBottom: '0.75rem' },
  paragraph: { marginBlock: '1rem', lineHeight: 1.8 },
});
