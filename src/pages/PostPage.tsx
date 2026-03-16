import { useParams, Link } from 'react-router-dom'
import { getPostBySlug } from '@/lib/posts'
import { BlogPost } from '@/components/blog/BlogPost'

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPostBySlug(slug) : undefined

  if (!post) {
    return (
      <div className="not-found">
        <h1>Post not found</h1>
        <Link to="/">
          Back to home
        </Link>
      </div>
    )
  }

  return <BlogPost post={post} />
}
