
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import AuthContainer from "@/components/auth/AuthContainer";
import { useAuth } from "@/contexts/AuthContext";

export const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  return (
    <AuthContainer 
      title="Login" 
      description="Entre com suas credenciais para acessar o sistema"
    >
      <LoginForm onLogin={handleLogin} isLoading={loading} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Não tem uma conta?{" "}
        <button type="button" onClick={() => navigate("/register")} className="text-primary hover:underline">
          Registre-se
        </button>
      </p>
    </AuthContainer>
  );
};

export default Login;
