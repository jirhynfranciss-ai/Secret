import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#292524',
          border: '1px solid #fce7f3',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(244, 63, 94, 0.08)',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '380px',
        },
        success: {
          iconTheme: { primary: '#f43f5e', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          duration: 5000,
        },
      }}
    />
  );
}
