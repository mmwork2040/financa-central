
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AppLayout } from "@/layouts/AppLayout";

// Pages
import Index from "./pages/Index";
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
import NotFoundPage from "./pages/NotFoundPage";

const queryClient = new QueryClient();

const App = () => {
  // Função para verificar a autenticação
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    // Como a autenticação é gerenciada no AuthProvider, o componente AppLayout
    // verifica a autenticação e redireciona conforme necessário
    return <>{children}</>;
  };

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
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Home route for initial redirection */}
                <Route path="/" element={<Navigate to="/login" />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
                <Route path="/users" element={<RequireAuth><AppLayout><Users /></AppLayout></RequireAuth>} />
                <Route path="/fornecedores" element={<RequireAuth><AppLayout><Fornecedores /></AppLayout></RequireAuth>} />
                <Route path="/clientes" element={<RequireAuth><AppLayout><Clientes /></AppLayout></RequireAuth>} />
                <Route path="/categorias" element={<RequireAuth><AppLayout><Categorias /></AppLayout></RequireAuth>} />
                <Route path="/bank-accounts" element={<RequireAuth><AppLayout><ContasBancarias /></AppLayout></RequireAuth>} />
                <Route path="/payment-methods" element={<RequireAuth><AppLayout><FormasPagamento /></AppLayout></RequireAuth>} />
                <Route path="/transactions" element={<RequireAuth><AppLayout><Lancamentos /></AppLayout></RequireAuth>} />
                <Route path="/reports" element={<RequireAuth><AppLayout><Relatorios /></AppLayout></RequireAuth>} />
                <Route path="/permissions" element={<RequireAuth><AppLayout><Permissoes /></AppLayout></RequireAuth>} />
                
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
