import { useParams } from 'react-router-dom'
import { getPostBySlug } from '@/lib/posts'

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPostBySlug(slug) : undefined

  if (!post) {
    return (
      <div className="not-found">
        <h1>Post not found</h1>
        <a href="/">
          Back to home
        </a>
      </div>
    )
  }

  return <hb-blog-post post={post} />
}
