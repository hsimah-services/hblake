import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { FeedPage } from '@/pages/FeedPage';
import { PostPage } from '@/pages/PostPage';
import { LinkInterceptor } from '@/components/LinkInterceptor';

function App() {
  return (
    <BrowserRouter>
      <LinkInterceptor />
      <Layout>
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/posts/:slug" element={<PostPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
