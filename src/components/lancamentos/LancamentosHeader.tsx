
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Filter, MessageCircle, Plus, Receipt, RefreshCw, Search, Upload } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import ExportDropdown from "@/components/common/ExportDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { cn } from "@/lib/utils";
import { useChatUrls } from "@/hooks/useChatUrls";

export const LancamentosHeader = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("lancamentos", "pode_incluir");
  const { visible, toggle } = useValuesVisibility();
  const { chatLancamentosUrl } = useChatUrls();

  const { 
    handleOpenModal, 
    setOpenFilterModal, 
    exportToCSV, 
    exportToPDF,
    refreshLancamentos,
    loading,
    searchQuery,
    setSearchQuery,
  } = useLancamentosContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLancamentos();
    setRefreshing(false);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Lançamentos</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground shrink-0">
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{visible ? "Ocultar valores" : "Exibir valores"}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setOpenFilterModal(true)}>
                <Filter className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                <span className="sm:hidden">Filtrar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Abrir filtros avançados</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
                <RefreshCw className={cn("mr-1.5 h-4 w-4", (refreshing || loading) && "animate-spin")} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Atualizar lista de lançamentos</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ExportDropdown onExport={handleExport} />
        {chatLancamentosUrl && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => window.open(chatLancamentosUrl, "_blank")}>
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Lançar via Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Lançar via chat externo</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lançamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        {canIncluir && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={() => handleOpenModal()} className="ml-auto">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Novo Lançamento</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Criar novo lançamento</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
