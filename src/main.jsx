import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

// Simple robust Error Boundary to prevent blank screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SehatYuk caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('sehat_yuk_app_data_v3');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full border border-rose-100 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">refresh</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Sedang Memuat Ulang</h2>
            <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
              Terjadi sedikit kendala saat memuat data. Klik tombol di bawah untuk memulihkan aplikasi secara otomatis.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Pulihkan & Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for offline PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Sehat Yuk Service Worker terdaftar:', registration.scope);
      })
      .catch((error) => {
        console.warn('Service Worker gagal terdaftar:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
