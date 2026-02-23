
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export const AuthContainer = ({ children, title, description }: AuthContainerProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-6 shadow-md md:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Fluxo de Contas</h1>
          <p className="mt-2 text-sm text-gray-600">Bem-vindo ao sistema de Controle de Contas</p>
        </div>

        <Card className="border-0 shadow-none">
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
