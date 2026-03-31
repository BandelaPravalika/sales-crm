import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Force dark mode immediately — before React mounts
document.documentElement.setAttribute('data-bs-theme', 'dark');
document.documentElement.style.backgroundColor = '#030712';
document.documentElement.style.color = '#f9fafb';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
      />
    </AuthProvider>
  </React.StrictMode>,
)
