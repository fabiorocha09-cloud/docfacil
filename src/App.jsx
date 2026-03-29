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
import AcessoCompartilhado from '@/pages/AcessoCompartilhado';
import GruposEmpresariais from '@/pages/GruposEmpresariais';
import CentralRespostas from '@/pages/CentralRespostas';
import UploadOutrosDocumentos from '@/pages/UploadOutrosDocumentos';
import ControleIE from '@/pages/ControleIE';
import CalendarioCertidoes from '@/pages/CalendarioCertidoes';
import ModelosDocumento from '@/pages/ModelosDocumento';
import PainelContador from '@/pages/emissor/PainelContador';
import EmissorDashboard from '@/pages/emissor/EmissorDashboard.jsx';
import EmitirNFe from '@/pages/emissor/EmitirNFe';
import HistoricoNotas from '@/pages/emissor/HistoricoNotas.jsx';
import Destinatarios from '@/pages/emissor/Destinatarios';
import Certificados from '@/pages/emissor/Certificados';
import EmissorLayout from '@/components/emissor/EmissorLayout';
import Tributacao from '@/pages/emissor/Tributacao';
import Produtos from '@/pages/emissor/Produtos';
import DetalhesNota from '@/pages/emissor/DetalhesNota';
import FormasPagamento from '@/pages/emissor/FormasPagamento';
import NaturezasTributarias from '@/pages/emissor/NaturezasTributarias';
import ConfiguracaoNFe from '@/pages/emissor/ConfiguracaoNFe';
import EditarEmpresa from '@/pages/emissor/EditarEmpresa';

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
        <Route path="/GruposEmpresariais" element={<GruposEmpresariais />} />
        <Route path="/CentralRespostas" element={<CentralRespostas />} />
        <Route path="/UploadOutrosDocumentos" element={<UploadOutrosDocumentos />} />
        <Route path="/ControleIE" element={<ControleIE />} />
        <Route path="/CalendarioCertidoes" element={<CalendarioCertidoes />} />
        <Route path="/ModelosDocumento" element={<ModelosDocumento />} />
      </Route>
      <Route path="/acesso/:token" element={<AcessoCompartilhado />} />
      <Route path="/emissor/painel" element={<PainelContador />} />
      <Route element={<EmissorLayout />}>
        <Route path="/emissor/dashboard" element={<EmissorDashboard />} />
        <Route path="/emissor/emitir" element={<EmitirNFe />} />
        <Route path="/emissor/historico" element={<HistoricoNotas />} />
        <Route path="/emissor/destinatarios" element={<Destinatarios />} />
        <Route path="/emissor/certificados" element={<Certificados />} />
        <Route path="/emissor/tributacao" element={<Tributacao />} />
        <Route path="/emissor/formas-pagamento" element={<FormasPagamento />} />
        <Route path="/emissor/naturezas" element={<NaturezasTributarias />} />
        <Route path="/emissor/produtos" element={<Produtos />} />
        <Route path="/emissor/nota" element={<DetalhesNota />} />
        <Route path="/emissor/configuracao" element={<ConfiguracaoNFe />} />
        <Route path="/emissor/empresa" element={<EditarEmpresa />} />
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