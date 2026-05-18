import { jsPDF } from "jspdf";
import "jspdf-autotable";
import fs from "fs";

const generatePresentationPDF = () => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [255, 87, 34];
  const textColor = [33, 33, 33];
  const secondaryTextColor = [117, 117, 117];

  // --- Capa ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.text("Contabiliza AI", 105, 100, { align: "center" });
  doc.setFontSize(18);
  doc.text("Gestão Financeira Inteligente", 105, 115, { align: "center" });
  doc.setFontSize(14);
  doc.text("O controle do seu negócio a uma mensagem de distância", 105, 150, { align: "center" });

  // --- Página 2 ---
  doc.addPage();
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.text("Chega de planilhas complexas", 20, 30);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  const introText = "Gerir um negócio exige tempo e foco. O Contabiliza AI nasceu para automatizar sua gestão financeira.";
  doc.text(doc.splitTextToSize(introText, 170), 20, 45);

  const features = [
    ["Recurso", "Descrição"],
    ["Notas Fiscais Automáticas", "Emissão de NF-e e NFS-e sem intervenção manual."],
    ["Inteligência Artificial", "Categorização automática via mensagens."],
    ["Dashboards", "Visualize a saúde financeira em segundos."],
    ["Relatórios", "DRE e Fluxo de Caixa automáticos."]
  ];

  (doc as any).autoTable({
    startY: 60,
    head: [features[0]],
    body: features.slice(1),
    headStyles: { fillColor: primaryColor }
  });

  // --- Página 3 ---
  doc.addPage();
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.text("Comece Agora", 20, 30);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.text("Acesse e teste por 30 dias grátis:", 20, 45);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("https://contabiliza-ai.lovable.app", 20, 55);

  const buffer = doc.output("arraybuffer");
  fs.writeFileSync("public/Apresentacao_Contabiliza_AI.pdf", Buffer.from(buffer));
  console.log("PDF gerado em public/Apresentacao_Contabiliza_AI.pdf");
};

generatePresentationPDF();
