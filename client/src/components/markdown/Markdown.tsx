import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export function Markdown({ content }: { content: string }) {
  return <ReactMarkdown skipHtml rehypePlugins={[rehypeSanitize]} components={{ h1: Markdown_Heading }}>{content}</ReactMarkdown>;
}

function Markdown_Heading({ children }: { children?: React.ReactNode }) {
  return <h2>{children}</h2>;
}
