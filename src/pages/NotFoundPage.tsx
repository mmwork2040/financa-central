
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export const NotFoundPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">Página não encontrada</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Desculpe, a página que você está procurando não existe.
        </p>
        <Button asChild className="mt-8">
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
