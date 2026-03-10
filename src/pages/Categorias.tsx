
import React, { useState } from "react";
import { useCategorias } from "@/hooks/useCategorias";
import { Tags } from "lucide-react";
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
        const tipoFormatado = categoria.tipo === "receita" ? "Receita" : categoria.tipo === "investimento" ? "Investimento" : "Despesa";
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
    const totalReceitas = filteredCategorias.filter(cat => cat.tipo === "receita").length;
    const totalDespesas = filteredCategorias.filter(cat => cat.tipo === "despesa").length;
    const totalInvestimentos = filteredCategorias.filter(cat => cat.tipo === "investimento").length;

    generateStyledPDF({
      title: "Relatório de Categorias",
      summaryCards: [
        { label: "Total de Categorias", value: String(filteredCategorias.length) },
        { label: "Receitas", value: String(totalReceitas), color: "#16a34a" },
        { label: "Despesas", value: String(totalDespesas), color: "#dc2626" },
        { label: "Investimentos", value: String(totalInvestimentos), color: "#2563eb" },
      ],
      columns: [
        { key: "nome", header: "Nome" },
        { key: "tipo", header: "Tipo" },
      ],
      rows: filteredCategorias.map(c => ({
        nome: c.nome,
        tipo: c.tipo === "receita" ? "Receita" : c.tipo === "investimento" ? "Investimento" : "Despesa",
      })),
      badgeColumns: {
        tipo: {
          receita: { bg: "#dcfce7", color: "#166534" },
          despesa: { bg: "#fee2e2", color: "#991b1b" },
          investimento: { bg: "#dbeafe", color: "#1e40af" },
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categorias"
        description="Gerencie as categorias de receitas e despesas."
        buttonLabel="Nova Categoria"
        onButtonClick={() => openModal()}
        showButton={canIncluir}
        icon={Tags}
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
