import { marked } from 'marked'
import type { Post } from '@/types'

interface BlogPostProps {
  post: Post
}

export function BlogPost({ post }: BlogPostProps) {
  const html = marked.parse(post.content) as string

  return (
    <article>
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="post-image"
        />
      )}
      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <time className="post-meta">{post.date}</time>
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
