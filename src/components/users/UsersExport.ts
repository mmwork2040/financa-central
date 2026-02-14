
import { User } from "@/types/user.types";
import { toast } from "sonner";

export const exportToCSV = (users: User[], getPermissaoLabel: (permissao: string) => string) => {
  try {
    // Preparar dados para CSV
    const headers = "Nome,E-mail,Permissão,Data de Cadastro\n";
    let csvContent = "data:text/csv;charset=utf-8," + headers;
    
    users.forEach(user => {
      const permissao = getPermissaoLabel(user.permissao);
      const row = [
        user.nome,
        user.email,
        permissao,
        new Date(user.created_at).toLocaleDateString()
      ].map(value => `"${value}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    // Criar e simular clique no link de download
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

export const exportToPDF = (users: User[], getPermissaoLabel: (permissao: string) => string, getPermissaoClass: (permissao: string) => string) => {
  try {
    // Abrir nova janela para o PDF
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error("Não foi possível abrir uma nova janela para o PDF.");
    }
    
    // Estilo para o PDF
    const style = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .admin { color: #e53935; }
        .editor { color: #1e88e5; }
        .leitura { color: #43a047; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    `;
    
    // Gerar conteúdo da tabela
    let tableRows = "";
    
    users.forEach(user => {
      const permissao = getPermissaoLabel(user.permissao);
      const permissaoClass = getPermissaoClass(user.permissao);
      
      tableRows += `
        <tr>
          <td>${user.nome}</td>
          <td>${user.email}</td>
          <td class="${user.permissao}">${permissao}</td>
          <td>${new Date(user.created_at).toLocaleDateString()}</td>
        </tr>
      `;
    });
    
    // Construir documento HTML para impressão/PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Usuários</title>
        ${style}
      </head>
      <body>
        <h1>Relatório de Usuários</h1>
        <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Permissão</th>
              <th>Data de Cadastro</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Sistema Financeiro - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Dar tempo para os estilos carregarem antes de imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast.success("Visualização PDF gerada com sucesso");
  } catch (error: any) {
    toast.error(`Erro ao gerar PDF: ${error.message}`);
  }
};
