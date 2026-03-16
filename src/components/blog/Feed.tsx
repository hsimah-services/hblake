import { Link } from 'react-router-dom'
import type { Post } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface FeedProps {
  posts: Post[]
}

export function Feed({ posts }: FeedProps) {
  if (posts.length === 0) {
    return <p className="feed-empty">No posts yet.</p>
  }

  return (
    <div className="feed">
      {posts.map((post) => (
        <Link key={post.slug} to={`/posts/${post.slug}`} className="feed-link">
          <Card
            className="feed-card"
            header={
              <CardHeader title={<CardTitle>{post.title}</CardTitle>}>
                <time className="feed-date">{post.date}</time>
              </CardHeader>
            }
            content={
              <CardContent>
                <CardDescription>{post.description}</CardDescription>
              </CardContent>
            }
          />
        </Link>
      ))}
    </div>
  )
}
