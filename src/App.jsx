import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/context/ThemeContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Empresas from '@/pages/Empresas';
import Certidoes from '@/pages/Certidoes';
import Configuracoes from '@/pages/Configuracoes';
import LogsRobo from '@/pages/LogsRobo';
import UploadCertidoes from '@/pages/UploadCertidoes';
import Membros from '@/pages/Membros';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route element={<Layout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Empresas" element={<Empresas />} />
        <Route path="/Certidoes" element={<Certidoes />} />
        <Route path="/Configuracoes" element={<Configuracoes />} />
        <Route path="/LogsRobo" element={<LogsRobo />} />
        <Route path="/UploadCertidoes" element={<UploadCertidoes />} />
        <Route path="/Membros" element={<Membros />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App