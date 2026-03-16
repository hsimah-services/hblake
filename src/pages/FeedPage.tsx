import { getAllPosts } from '@/lib/posts'

export function FeedPage() {
  const posts = getAllPosts()
  return <hb-feed posts={posts} />
}
