import { escapeHtml } from '../../lib/html'
import type { Post } from '../../types'

export class HbFeed extends HTMLElement {
  private _posts: Post[] = []

  get posts(): Post[] {
    return this._posts
  }

  set posts(value: Post[]) {
    this._posts = value
    this.render()
  }

  private render() {
    if (this._posts.length === 0) {
      this.innerHTML = '<p class="feed-empty">No posts yet.</p>'
      return
    }

    this.innerHTML = `
      <div class="feed">
        ${this._posts
          .map(
            (post) => `
          <a href="/posts/${escapeHtml(post.slug)}" class="feed-link">
            <hb-card
              card-title="${escapeHtml(post.title)}"
              card-date="${escapeHtml(post.date)}"
              card-description="${escapeHtml(post.description)}"
            ></hb-card>
          </a>
        `
          )
          .join('')}
      </div>
    `
  }
}
