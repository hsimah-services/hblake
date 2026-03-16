import { marked } from 'marked'
import { escapeHtml } from '../../lib/html'
import type { Post } from '../../types'

export class HbBlogPost extends HTMLElement {
  private _post: Post | null = null

  get post(): Post | null {
    return this._post
  }

  set post(value: Post | null) {
    this._post = value
    this.render()
  }

  private render() {
    if (!this._post) {
      this.innerHTML = ''
      return
    }

    const html = marked.parse(this._post.content) as string
    const imageHtml = this._post.image
      ? `<img src="${escapeHtml(this._post.image)}" alt="${escapeHtml(this._post.title)}" class="post-image" />`
      : ''

    this.innerHTML = `
      <article>
        ${imageHtml}
        <header class="post-header">
          <h1 class="post-title">${escapeHtml(this._post.title)}</h1>
          <time class="post-meta">${escapeHtml(this._post.date)}</time>
        </header>
        <div class="prose">${html}</div>
      </article>
    `
  }
}
