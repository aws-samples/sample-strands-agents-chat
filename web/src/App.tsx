import { Suspense, useState } from 'react';
import Header from './components/Header';
import Drawer from './components/Drawer';
import Chat from './pages/Chat';
import { useTheme } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { theme } = useTheme();

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 flex flex-col bg-white transition-colors duration-300 dark:bg-gray-900">
      <Suspense fallback={<div>Loading...</div>}>
        <Header onToggleDrawer={toggleDrawer} />

        <div className="relative flex flex-1 overflow-hidden">
          <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} />

          <Chat />

          {isDrawerOpen && (
            <div
              className="fixed inset-0 z-40 bg-black opacity-70 transition-opacity duration-300 lg:hidden"
              onClick={closeDrawer}
            />
          )}
        </div>
      </Suspense>
      <Toaster
        containerStyle={{
          top: 70,
        }}
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
          },
        }}
      />
    </div>
  );
}

export default App;
