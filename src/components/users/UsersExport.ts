
import { User } from "@/types/user.types";
import { toast } from "sonner";
import { generateStyledPDF } from "@/utils/pdfTemplate";

export const exportToCSV = (users: User[], getPermissaoLabel: (permissao: string) => string) => {
  try {
    const headers = "Nome,E-mail,Permissão,Data de Cadastro\n";
    let csvContent = "data:text/csv;charset=utf-8," + headers;
    
    users.forEach(user => {
      const permissao = getPermissaoLabel(user.permissao);
      const row = [
        user.nome,
        user.email,
        permissao,
        new Date(user.created_at).toLocaleDateString("pt-BR")
      ].map(value => `"${value}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    toast.success("Usuários exportados com sucesso");
  } catch (error: any) {
    toast.error(`Erro ao exportar: ${error.message}`);
  }
};

export const exportToPDF = (users: User[], getPermissaoLabel: (permissao: string) => string, _getPermissaoClass: (permissao: string) => string) => {
  generateStyledPDF({
    title: "Relatório de Usuários",
    summaryCards: [
      { label: "Total de Usuários", value: String(users.length) },
    ],
    columns: [
      { key: "nome", header: "Nome" },
      { key: "email", header: "E-mail" },
      { key: "permissao", header: "Permissão" },
      { key: "created_at", header: "Data de Cadastro" },
    ],
    rows: users.map(u => ({
      nome: u.nome,
      email: u.email,
      permissao: getPermissaoLabel(u.permissao),
      created_at: new Date(u.created_at).toLocaleDateString("pt-BR"),
    })),
    badgeColumns: {
      permissao: {
        administrador: { bg: "#fee2e2", color: "#991b1b" },
        editor: { bg: "#dbeafe", color: "#1e40af" },
        leitura: { bg: "#dcfce7", color: "#166534" },
      },
    },
  });
};
