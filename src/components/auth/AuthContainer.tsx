
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export const AuthContainer = ({ children, title, description }: AuthContainerProps) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-background overflow-hidden">
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text md:text-3xl">Contabiliza AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Seu departamento financeiro inteligente</p>
        </div>

        <Card className="border-border dark:border-white/[0.07]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthContainer;
