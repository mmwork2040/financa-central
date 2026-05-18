import { jsPDF } from "jspdf";
import fs from "fs";

const generatePresentationPDF = () => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [255, 87, 34];
  const textColor = [33, 33, 33];

  // --- Capa ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.text("Contabiliza AI", 105, 100, { align: "center" });
  doc.setFontSize(18);
  doc.text("Gestao Financeira Inteligente", 105, 115, { align: "center" });
  doc.setFontSize(14);
  doc.text("O controle do seu negocio a uma mensagem de distancia", 105, 150, { align: "center" });

  // --- Página 2 ---
  doc.addPage();
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.text("Chega de planilhas complexas", 20, 30);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  const introText = "Gerir um negocio exige tempo e foco. O Contabiliza AI nasceu para automatizar sua gestao financeira.";
  doc.text(doc.splitTextToSize(introText, 170), 20, 45);

  doc.text("Principais Recursos:", 20, 65);
  doc.text("- Notas Fiscais Automaticas", 25, 75);
  doc.text("- Inteligencia Artificial para categorizacao", 25, 85);
  doc.text("- Dashboards em tempo real", 25, 95);
  doc.text("- Relatorios DRE e Fluxo de Caixa", 25, 105);

  // --- Página 3 ---
  doc.addPage();
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.text("Comece Agora", 20, 30);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.text("Acesse e teste por 30 dias gratis:", 20, 45);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("https://contabiliza-ai.lovable.app", 20, 55);

  const buffer = doc.output("arraybuffer");
  fs.writeFileSync("public/Apresentacao_Contabiliza_AI.pdf", Buffer.from(buffer));
  console.log("PDF gerado em public/Apresentacao_Contabiliza_AI.pdf");
};

generatePresentationPDF();
