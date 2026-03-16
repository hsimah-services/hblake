import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="layout">
      <hb-header current-path={location.pathname} />
      <main className="layout-main">{children}</main>
    </div>
  );
}
