import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BuilderPage from './pages/BuilderPage';
import BlogPost from './pages/BlogPost';
import ThemeTest from './components/ThemeTest';
import CookieConsent from './components/CookieConsent';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Theme test route */}
          <Route path="/test-theme" element={<ThemeTest />} />
          
          {/* Blog posts route */}
          <Route path="/blog/:slug" element={<BlogPost />} />
          
          {/* Catch-all route for Builder.io pages */}
          <Route path="*" element={<BuilderPage />} />
        </Routes>
      </Layout>
      <CookieConsent />
    </Router>
  );
}

export default App;
