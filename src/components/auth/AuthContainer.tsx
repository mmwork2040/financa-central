
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export const AuthContainer = ({ children, title, description }: AuthContainerProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center landing-bg p-4 md:p-8">
      <div className="w-full max-w-md space-y-8 glass-surface-strong glass-shadow-lg rounded-3xl p-6 md:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground md:text-3xl">Contabiliza AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gestão financeira com Inteligência Artificial</p>
        </div>

        <Card className="border-0 shadow-none bg-transparent">
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
