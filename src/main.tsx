import React from 'react';
import ReactDOM from 'react-dom/client';
// --- CORREÇÃO: Reverter para BrowserRouter para compatibilidade web ---
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* --- CORREÇÃO: Usar o componente Router (que agora é BrowserRouter) --- */}
    <Router>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);
