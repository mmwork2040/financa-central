
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
    </AuthContainer>
  );
};

export default Login;
