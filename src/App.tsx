
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
import NotFoundPage from "./pages/NotFoundPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/settings" element={<AppLayout><ConfiguracoesEmpresa /></AppLayout>} />
                
                {/* Permission-protected routes */}
                <Route path="/users" element={<ProtectedRoute path="/users"><AppLayout><Users /></AppLayout></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute path="/permissions"><AppLayout><Permissoes /></AppLayout></ProtectedRoute>} />
                <Route path="/fornecedores" element={<ProtectedRoute path="/fornecedores"><AppLayout><Fornecedores /></AppLayout></ProtectedRoute>} />
                <Route path="/clientes" element={<ProtectedRoute path="/clientes"><AppLayout><Clientes /></AppLayout></ProtectedRoute>} />
                <Route path="/categorias" element={<ProtectedRoute path="/categorias"><AppLayout><Categorias /></AppLayout></ProtectedRoute>} />
                <Route path="/bank-accounts" element={<ProtectedRoute path="/bank-accounts"><AppLayout><ContasBancarias /></AppLayout></ProtectedRoute>} />
                <Route path="/payment-methods" element={<ProtectedRoute path="/payment-methods"><AppLayout><FormasPagamento /></AppLayout></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute path="/transactions"><AppLayout><Lancamentos /></AppLayout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute path="/reports"><AppLayout><Relatorios /></AppLayout></ProtectedRoute>} />
                
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
