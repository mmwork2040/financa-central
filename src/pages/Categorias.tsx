
import React, { useState } from "react";
import { useCategorias } from "@/hooks/useCategorias";
import PageHeader from "@/components/common/PageHeader";
import CategoriasSearch from "@/components/categorias/CategoriasSearch";
import CategoriasTable from "@/components/categorias/CategoriasTable";
import CategoriaForm from "@/components/categorias/CategoriaForm";
import CategoriaDeleteDialog from "@/components/categorias/CategoriaDeleteDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Categorias = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("categorias", "pode_incluir");
  const canAlterar = canPerformAction("categorias", "pode_alterar");
  const canExcluir = canPerformAction("categorias", "pode_excluir");

  const {
    categorias,
    loading,
    currentCategoria,
    isModalOpen,
    isDeleteDialogOpen,
    isSaving,
    openModal,
    confirmDelete,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    handleDelete,
    setIsModalOpen,
    setIsDeleteDialogOpen
  } = useCategorias();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategorias = categorias.filter(categoria => 
    categoria.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    categoria.tipo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    try {
      const headers = "Nome,Tipo\n";
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      
      filteredCategorias.forEach(categoria => {
        const tipoFormatado = categoria.tipo === "receita" ? "Receita" : "Despesa";
        const row = [
          categoria.nome,
          tipoFormatado
        ].map(value => `"${value}"`).join(",");
        
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `categorias_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success("Categorias exportadas com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const exportToPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error("Não foi possível abrir uma nova janela para o PDF.");
      }
      
      const style = `
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .receita { color: green; }
          .despesa { color: red; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      `;
      
      const totalReceitas = filteredCategorias.filter(cat => cat.tipo === "receita").length;
      const totalDespesas = filteredCategorias.filter(cat => cat.tipo === "despesa").length;
      
      let tableRows = "";
      
      filteredCategorias.forEach(categoria => {
        const tipoClass = categoria.tipo === "receita" ? "receita" : "despesa";
        const tipoFormatado = categoria.tipo === "receita" ? "Receita" : "Despesa";
        
        tableRows += `
          <tr>
            <td>${categoria.nome}</td>
            <td class="${tipoClass}">${tipoFormatado}</td>
          </tr>
        `;
      });
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Categorias</title>
          ${style}
        </head>
        <body>
          <h1>Relatório de Categorias</h1>
          <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          
          <div class="resumo">
            <p><strong>Total de categorias:</strong> ${filteredCategorias.length}</p>
            <p><strong>Categorias de receita:</strong> <span class="receita">${totalReceitas}</span></p>
            <p><strong>Categorias de despesa:</strong> <span class="despesa">${totalDespesas}</span></p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
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
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast.success("Visualização PDF gerada com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categorias"
        description="Gerencie as categorias de receitas e despesas."
        buttonLabel="Nova Categoria"
        onButtonClick={() => openModal()}
        showButton={canIncluir}
      />

      <CategoriasSearch 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        onExport={handleExport}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      ) : filteredCategorias.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
        </div>
      ) : (
        <CategoriasTable 
          categorias={filteredCategorias} 
          onEdit={openModal} 
          onDelete={confirmDelete}
          canEdit={canAlterar}
          canDelete={canExcluir}
        />
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {filteredCategorias.length} categorias
        </p>
      </div>

      <CategoriaForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        currentCategoria={currentCategoria}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        isSaving={isSaving}
      />

      <CategoriaDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
        categoria={currentCategoria}
      />
    </div>
  );
};

export default Categorias;
