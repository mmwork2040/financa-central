
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Always redirect to dashboard
    navigate("/dashboard", { replace: true });
  }, [navigate]);
  
  // This won't actually be rendered since we redirect immediately
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Contabiliza AI</h1>
        <p className="text-xl text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Index;
