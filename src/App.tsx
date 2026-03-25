
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import PageTransition from "@/components/common/PageTransition";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Fornecedores from "./pages/Fornecedores";
import Clientes from "./pages/Clientes";
import Categorias from "./pages/Categorias";
import ContasBancarias from "./pages/ContasBancarias";
import FormasPagamento from "./pages/FormasPagamento";
import Lancamentos from "./pages/Lancamentos";
import Relatorios from "./pages/Relatorios";
import Permissoes from "./pages/Permissoes";
import ConfiguracoesEmpresa from "./pages/ConfiguracoesEmpresa";
import VendasDigitais from "./pages/VendasDigitais";
import Integracoes from "./pages/Integracoes";
import WebhooksConfig from "./pages/WebhooksConfig";
import AnunciosDigitais from "./pages/AnunciosDigitais";
import LogsIntegracoes from "./pages/LogsIntegracoes";
import NotFoundPage from "./pages/NotFoundPage";
import Install from "./pages/Install";
import Profile from "./pages/Profile";
import Projetos from "./pages/Projetos";
import CartoesCredito from "./pages/CartoesCredito";
import ProjetoDetalhe from "./pages/ProjetoDetalhe";
import N8nTemplates from "./pages/N8nTemplates";
import DemoPage from "./pages/DemoPage";
import PlanosExpirados from "./pages/PlanosExpirados";
import Assinaturas from "./pages/Assinaturas";
import VerPlanos from "./pages/VerPlanos";
import TermosPublico from "./pages/TermosPublico";
import TermosConfig from "./pages/TermosConfig";
import Suporte from "./pages/Suporte";
import ImportarDocumentos from "./pages/ImportarDocumentos";
import PerfisAcesso from "./pages/PerfisAcesso";
import NotasFiscais from "./pages/NotasFiscais";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
                <Route path="/demo" element={<PageTransition><DemoPage /></PageTransition>} />
                <Route path="/planos-expirados" element={<PageTransition><PlanosExpirados /></PageTransition>} />
                <Route path="/ver-planos" element={<PageTransition><VerPlanos /></PageTransition>} />
                <Route path="/termos" element={<PageTransition><TermosPublico /></PageTransition>} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
                <Route path="/settings" element={<AppLayout><ConfiguracoesEmpresa /></AppLayout>} />
                <Route path="/settings/integracoes" element={<AppLayout><Integracoes /></AppLayout>} />
                <Route path="/settings/webhooks" element={<AppLayout><WebhooksConfig /></AppLayout>} />
                <Route path="/settings/logs" element={<AppLayout><LogsIntegracoes /></AppLayout>} />
                <Route path="/settings/n8n-templates" element={<AppLayout><N8nTemplates /></AppLayout>} />
                <Route path="/settings/assinaturas" element={<AppLayout><Assinaturas /></AppLayout>} />
                <Route path="/settings/termos" element={<AppLayout><TermosConfig /></AppLayout>} />
                <Route path="/suporte" element={<AppLayout><Suporte /></AppLayout>} />
                <Route path="/perfis-acesso" element={<ProtectedRoute path="/perfis-acesso"><AppLayout><PerfisAcesso /></AppLayout></ProtectedRoute>} />
                <Route path="/vendas-digitais" element={<AppLayout><VendasDigitais /></AppLayout>} />
                <Route path="/importar-documentos" element={<AppLayout><ImportarDocumentos /></AppLayout>} />
                <Route path="/anuncios" element={<ProtectedRoute path="/anuncios"><AppLayout><AnunciosDigitais /></AppLayout></ProtectedRoute>} />
                
                {/* Permission-protected routes */}
                <Route path="/users" element={<ProtectedRoute path="/users"><AppLayout><Users /></AppLayout></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute path="/permissions"><AppLayout><Permissoes /></AppLayout></ProtectedRoute>} />
                <Route path="/fornecedores" element={<ProtectedRoute path="/fornecedores"><AppLayout><Fornecedores /></AppLayout></ProtectedRoute>} />
                <Route path="/clientes" element={<ProtectedRoute path="/clientes"><AppLayout><Clientes /></AppLayout></ProtectedRoute>} />
                <Route path="/categorias" element={<ProtectedRoute path="/categorias"><AppLayout><Categorias /></AppLayout></ProtectedRoute>} />
                <Route path="/bank-accounts" element={<ProtectedRoute path="/bank-accounts"><AppLayout><ContasBancarias /></AppLayout></ProtectedRoute>} />
                <Route path="/payment-methods" element={<ProtectedRoute path="/payment-methods"><AppLayout><FormasPagamento /></AppLayout></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute path="/transactions"><AppLayout><Lancamentos /></AppLayout></ProtectedRoute>} />
                <Route path="/cartoes-credito" element={<AppLayout><CartoesCredito /></AppLayout>} />
                <Route path="/reports" element={<ProtectedRoute path="/reports"><AppLayout><Relatorios /></AppLayout></ProtectedRoute>} />
                <Route path="/projetos" element={<ProtectedRoute path="/projetos"><AppLayout><Projetos /></AppLayout></ProtectedRoute>} />
                <Route path="/projetos/:id" element={<ProtectedRoute path="/projetos"><AppLayout><ProjetoDetalhe /></AppLayout></ProtectedRoute>} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </TooltipProvider>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
