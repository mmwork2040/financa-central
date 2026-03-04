import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureBlockedProps {
  title: string;
  description?: string;
}

const FeatureBlocked: React.FC<FeatureBlockedProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {description || "Esta funcionalidade não está disponível no seu plano atual. Faça upgrade para ter acesso."}
          </p>
          <Button onClick={() => navigate("/planos-expirados")} className="mt-2">
            Ver planos disponíveis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureBlocked;
