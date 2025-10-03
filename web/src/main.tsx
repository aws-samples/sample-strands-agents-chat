import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ParameterProvider } from './contexts/ParameterContext';
import AuthWithUserPool from './components/AuthWithUserPool';
import App from './App.tsx';
import NotFound from './pages/NotFound';
import './index.css';
import '@aws-amplify/ui-react/styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/chat/:chatId',
    element: <App />,
  },
  {
    path: '/gallery',
    element: <App />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ConfigProvider>
        <AuthWithUserPool>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center bg-white transition-colors duration-300 dark:bg-gray-900">
                <div className="text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                </div>
              </div>
            }>
            <ParameterProvider>
              <RouterProvider router={router} />
            </ParameterProvider>
          </Suspense>
        </AuthWithUserPool>
      </ConfigProvider>
    </ThemeProvider>
  </StrictMode>
);
