import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-content">
          <Link to="/" className="header-logo">
            hblake
          </Link>
          <nav className="header-nav">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'nav-link--active' : 'nav-link--inactive'}`}
            >
              Home
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
