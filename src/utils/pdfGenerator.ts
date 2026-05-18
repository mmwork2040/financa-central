
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const generatePresentationPDF = () => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [255, 87, 34]; // #FF5722 aprox
  const textColor = [33, 33, 33];
  const secondaryTextColor = [117, 117, 117];

  // --- Capa ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text("Contabiliza AI", 105, 100, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text("Gestão Financeira Inteligente", 105, 115, { align: "center" });

  doc.setFontSize(14);
  doc.text("O controle do seu negócio a uma mensagem de distância", 105, 150, { align: "center" });

  doc.setFontSize(10);
  doc.text("Apresentação do Sistema 2026", 105, 270, { align: "center" });

  // --- Página 2: O Problema e a Solução ---
  doc.addPage();
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Chega de planilhas complexas", 20, 30);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const introText = "Gerir um negócio exige tempo e foco. Muitas vezes, a burocracia financeira consome horas valiosas que deveriam ser dedicadas ao crescimento. O Contabiliza AI nasceu para mudar essa realidade.";
  doc.text(doc.splitTextToSize(introText, 170), 20, 45);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Principais Recursos", 20, 80);

  const features = [
    ["Recurso", "Descrição"],
    ["Notas Fiscais Automáticas", "Emissão de NF-e e NFS-e sem intervenção manual a cada venda."],
    ["Inteligência Artificial", "Categorização automática de receitas e despesas via mensagens."],
    ["Dashboards em Tempo Real", "Visualize a saúde financeira do seu negócio em segundos."],
    ["Relatórios Completos", "DRE, Fluxo de Caixa e Balanços gerados automaticamente."],
    ["Gestão de Projetos", "Controle custos e lucros por projeto ou centro de custo."]
  ];

  (doc as any).autoTable({
    startY: 90,
    head: [features[0]],
    body: features.slice(1),
    headStyles: { fillColor: primaryColor },
    theme: "grid",
    margin: { left: 20, right: 20 }
  });

  // --- Página 3: Diferenciais e Contato ---
  doc.addPage();
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Por que escolher o Contabiliza AI?", 20, 30);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  const benefits = [
    "• Economia de Tempo: Reduza em até 80% o tempo gasto com administrativo.",
    "• Precisão: Elimine erros humanos com nossa IA treinada.",
    "• Acessibilidade: Controle tudo pelo celular ou desktop.",
    "• Integração: Conecte-se com as principais plataformas de vendas digitais."
  ];
  
  let yPos = 45;
  benefits.forEach(benefit => {
    doc.text(benefit, 20, yPos);
    yPos += 10;
  });

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPos + 10, 190, yPos + 10);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Comece Agora", 20, yPos + 30);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Acesse nossa plataforma e teste por 30 dias grátis.", 20, yPos + 40);
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("https://contabiliza-ai.lovable.app", 20, yPos + 50);

  // Footer em todas as páginas (opcional, aqui apenas na última)
  doc.setFontSize(10);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text("© 2026 Contabiliza AI - Todos os direitos reservados.", 105, 285, { align: "center" });

  doc.save("Apresentacao_Contabiliza_AI.pdf");
};
