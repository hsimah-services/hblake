import { marked } from 'marked'
import { escapeHtml } from '../../lib/html'
import { getPostBySlug } from '@/lib/posts';

export class HbBlogPost extends HTMLElement {
  connectedCallback() {
    this.render()
  }

  private render() {
    const route = window.location.pathname;
    const slug = route.slice(1).split('/').at(1) ?? '';

    const post = getPostBySlug(slug);
    if (!post) {
      this.innerHTML = `
        <div class="not-found">
          <h1>Post not found</h1>
          <a href="/">
            Back to home
          </a>
        </div>`;
      return;
    }


    const html = marked.parse(post.content) as string
    const imageHtml = post.image
      ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" class="post-image" />`
      : ''

    this.innerHTML = `
      <article>
        ${imageHtml}
        <header class="post-header">
          <h1 class="post-title">${escapeHtml(post.title)}</h1>
          <time class="post-meta">${escapeHtml(post.date)}</time>
        </header>
        <div class="prose">${html}</div>
      </article>
    `
  }
}
