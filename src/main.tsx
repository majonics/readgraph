import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { LibraryPage } from './routes/LibraryPage.tsx';
import { BookRoute } from './routes/BookPage.tsx';
import './styles.css';

const router = createBrowserRouter([
  { path: '/', element: <LibraryPage /> },
  { path: '/book/:slug', element: <BookRoute /> },
]);

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
