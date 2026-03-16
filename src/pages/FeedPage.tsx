import { getAllPosts } from '@/lib/posts'
import { Feed } from '@/components/blog/Feed'

export function FeedPage() {
  const posts = getAllPosts()
  return <Feed posts={posts} />
}
