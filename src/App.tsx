import { FeedPage } from '@/pages/FeedPage';
import { PostPage } from '@/pages/PostPage';

function getComponent() {
  const route = window.location.pathname;
  console.log('Current route:', route);
  switch (route) {
    case '/':
      return <FeedPage />;
    default:
      return <PostPage />;
  }
}

function App() {
  const route = window.location.pathname;

  return (
    <div className="layout">
      <hb-header current-path={route} />
      <main className="layout-main">{getComponent()}</main>
    </div>
  );
}

export default App;
