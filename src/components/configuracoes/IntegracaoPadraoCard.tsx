import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings2, Check } from "lucide-react";

const integracoes = [
  {
    id: "asaas",
    nome: "Asaas",
    descricao: "Gateway brasileiro com PIX, boleto e cartão de crédito",
  },
  {
    id: "stripe",
    nome: "Stripe",
    descricao: "Gateway internacional com suporte a cartões e assinaturas",
  },
];

const IntegracaoPadraoCard = () => {
  const [padrao, setPadrao] = useState("asaas");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Integração Padrão</CardTitle>
            <CardDescription>Selecione o gateway de pagamento padrão para cobranças de assinaturas</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {integracoes.map((integ) => (
            <button
              key={integ.id}
              type="button"
              onClick={() => setPadrao(integ.id)}
              className={`relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-sm ${
                padrao === integ.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              {padrao === integ.id && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-semibold text-sm cursor-pointer">{integ.nome}</Label>
                {padrao === integ.id && (
                  <Badge variant="default" className="text-[10px]">Padrão</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{integ.descricao}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegracaoPadraoCard;
