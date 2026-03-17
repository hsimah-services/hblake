import type { Post } from './index'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hb-header': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { 'current-path'?: string },
        HTMLElement
      >
      'hb-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'card-title'?: string
          'card-date'?: string
          'card-description'?: string
        },
        HTMLElement
      >
      'hb-feed': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'hb-blog-post': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { post?: Post },
        HTMLElement
      >
      'hb-feed-page': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export {}
