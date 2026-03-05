import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoContabiliza from "@/assets/logo-contabiliza.png";

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export const AuthContainer = ({ children, title, description }: AuthContainerProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-md space-y-8 glass-card rounded-2xl p-6 md:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logoContabiliza} alt="Contabiliza AI" className="h-16 w-auto" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Tudo com o auxílio de Inteligência Artificial</p>
        </div>

        <Card className="border-0 shadow-none bg-transparent backdrop-blur-none">
          <CardHeader className="px-0 pt-4">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthContainer;
