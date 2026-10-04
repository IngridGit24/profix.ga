import { Toaster } from 'react-hot-toast';

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#111',
          borderRadius: 0,
          padding: '14px 18px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #E2EBE7',
          fontFamily: 'sans-serif',
          fontSize: '14px',
        },
        success: {
          style: {
            borderLeft: '4px solid #1A6B3C',
          },
          icon: null,
        },
        error: {
          style: {
            borderLeft: '4px solid #D94F3D',
          },
          icon: null,
        },
        loading: {
          style: {
            borderLeft: '4px solid #C8922A',
          },
        },
      }}
    />
  )
}