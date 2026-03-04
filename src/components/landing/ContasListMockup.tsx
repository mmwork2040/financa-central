import React from "react";
import { Badge } from "@/components/ui/badge";

const contas = [
  { desc: "Aluguel escritório", valor: "R$ 2.500,00", venc: "05/03", status: "Pago", color: "bg-green-100 text-green-700 border-green-200" },
  { desc: "Google Ads", valor: "R$ 1.800,00", venc: "10/03", status: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { desc: "Fornecedor X", valor: "R$ 3.200,00", venc: "02/03", status: "Vencido", color: "bg-red-100 text-red-700 border-red-200" },
  { desc: "Mensalidade SaaS", valor: "R$ 497,00", venc: "15/03", status: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
];

const ContasListMockup = () => {
  return (
    <div className="glass-card rounded-2xl p-4 w-full max-w-md space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">Contas a Pagar</span>
        <span className="text-[10px] text-muted-foreground">Março 2026</span>
      </div>
      {contas.map((c, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl bg-background/60 border border-border/50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">{c.desc}</p>
            <p className="text-[10px] text-muted-foreground">Venc: {c.venc}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{c.valor}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${c.color}`}>
              {c.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContasListMockup;
