
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLancamentosContext } from "@/contexts/LancamentosContext";

export const LancamentosFilterDialog = () => {
  const {
    filtros,
    openFilterModal,
    setOpenFilterModal,
    handleFilterInputChange,
    handleFilterSelectChange,
    resetFilters,
    aplicarFiltros,
    categorias,
    fornecedores,
    clientes
  } = useLancamentosContext();

  return (
    <Dialog open={openFilterModal} onOpenChange={setOpenFilterModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtrar Lançamentos</DialogTitle>
          <DialogDescription>
            Defina os critérios para filtrar os lançamentos exibidos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-filtro">Tipo</Label>
              <Select 
                value={filtros.tipo || "all"} 
                onValueChange={(v) => handleFilterSelectChange('tipo', v === "all" ? null : v)}
              >
                <SelectTrigger id="tipo-filtro">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filtro">Status</Label>
              <Select 
                value={filtros.status || "all"} 
                onValueChange={(v) => handleFilterSelectChange('status', v === "all" ? null : v)}
              >
                <SelectTrigger id="status-filtro">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Inicial</Label>
              <Input
                id="data_inicio"
                name="data_inicio"
                type="date"
                placeholder="Selecione uma data inicial"
                value={filtros.data_inicio || ""}
                onChange={handleFilterInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Final</Label>
              <Input
                id="data_fim"
                name="data_fim"
                type="date"
                placeholder="Selecione uma data final"
                value={filtros.data_fim || ""}
                onChange={handleFilterInputChange}
              />
            </div>
          </div>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="filtros-avancados">
              <AccordionTrigger>Filtros Avançados</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria-filtro">Categoria</Label>
                    <Select 
                      value={filtros.categoria_id || "all"} 
                      onValueChange={(v) => handleFilterSelectChange('categoria_id', v === "all" ? null : v)}
                    >
                      <SelectTrigger id="categoria-filtro">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_min">Valor Mínimo</Label>
                      <Input
                        id="valor_min"
                        name="valor_min"
                        type="number"
                        placeholder="Valor mínimo"
                        value={filtros.valor_min || ""}
                        onChange={handleFilterInputChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor_max">Valor Máximo</Label>
                      <Input
                        id="valor_max"
                        name="valor_max"
                        type="number"
                        placeholder="Valor máximo"
                        value={filtros.valor_max || ""}
                        onChange={handleFilterInputChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fornecedor-filtro">Fornecedor</Label>
                      <Select 
                        value={filtros.fornecedor_id || "all"} 
                        onValueChange={(v) => handleFilterSelectChange('fornecedor_id', v === "all" ? null : v)}
                      >
                        <SelectTrigger id="fornecedor-filtro">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {fornecedores.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cliente-filtro">Cliente</Label>
                      <Select 
                        value={filtros.cliente_id || "all"} 
                        onValueChange={(v) => handleFilterSelectChange('cliente_id', v === "all" ? null : v)}
                      >
                        <SelectTrigger id="cliente-filtro">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetFilters}>Limpar Filtros</Button>
          <Button onClick={aplicarFiltros}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
