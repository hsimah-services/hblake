import { escapeHtml } from '../../lib/html'

export class HbHeader extends HTMLElement {
  static observedAttributes = ['current-path']

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback() {
    this.render()
  }

  private render() {
    const currentPath = this.getAttribute('current-path') ?? '/'
    const activeClass = currentPath === '/' ? 'nav-link--active' : 'nav-link--inactive'

    this.innerHTML = `
      <header class="header">
        <div class="header-inner">
          <div class="header-content">
            <a href="/" class="header-logo">hblake</a>
            <nav class="header-nav">
              <a href="/" class="nav-link ${escapeHtml(activeClass)}">Home</a>
            </nav>
          </div>
        </div>
      </header>
    `
  }
}
