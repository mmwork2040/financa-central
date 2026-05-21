import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, ArrowLeftRight } from "lucide-react";

export type EntityOption = { id: string; nome: string };
export type CategoriaOption = { id: string; nome: string; tipo: string };

export type EditableItem = {
  descricao: string;
  valor: number;
  data: string | null;
  tipo_sugerido: string;
  destino_sugerido: string;
  categoria_sugerida: string | null;
  categoria_id?: string | null;
  fornecedor_cliente: string | null;
  fornecedor_id?: string | null;
  cliente_id?: string | null;
  forma_pagamento: string | null;
  forma_pagamento_id?: string | null;
  projeto_id?: string | null;
  observacoes: string | null;
  conta_bancaria_id?: string | null;
  conta_destino_id?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: EditableItem | null;
  categorias: CategoriaOption[];
  fornecedores: EntityOption[];
  clientes: EntityOption[];
  formasPagamento: EntityOption[];
  projetos: EntityOption[];
  contasBancarias: EntityOption[];
  onSave: (patch: EditableItem) => void;
}

const NEW = "__new__";
const NONE = "__none__";

const normalize = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const categoriaTipoFor = (tipoLancamento: string): string => {
  if (tipoLancamento === "receita") return "receita";
  if (tipoLancamento === "investimento") return "investimento";
  return "despesa";
};

export const EditImportItemDialog: React.FC<Props> = ({
  open, onOpenChange, item, categorias, fornecedores, clientes, formasPagamento, projetos, contasBancarias, onSave,
}) => {
  const [form, setForm] = useState<EditableItem | null>(null);

  useEffect(() => {
    if (item) {
      const updatedForm = { ...item };
      // Fallback mínimo só quando NÃO existe descrição alguma vinda do documento.
      if (!updatedForm.descricao || updatedForm.descricao === "Sem descrição" || updatedForm.descricao.trim() === "") {
        const acao = updatedForm.tipo_sugerido === "receita" ? "Recebimento" : updatedForm.tipo_sugerido === "transferencia" ? "Transferência" : "Pagamento";
        const entidade = updatedForm.fornecedor_cliente || "";
        if (entidade) updatedForm.descricao = `${acao} - ${entidade}`;
        else updatedForm.descricao = acao;
      }
      setForm(updatedForm);
    }
  }, [item]);

  const isTransferencia = form?.tipo_sugerido === "transferencia";
  const isReceita = form?.tipo_sugerido === "receita";
  const entityList = isReceita ? clientes : fornecedores;
  const entityLabel = isReceita ? "Cliente" : "Fornecedor";
  const currentEntityId = isReceita ? form?.cliente_id : form?.fornecedor_id;

  const categoriaTipo = categoriaTipoFor(form?.tipo_sugerido || "despesa");
  const categoriasFiltradas = categorias.filter(c => c.tipo === categoriaTipo);

  const update = (patch: Partial<EditableItem>) => setForm(prev => prev ? { ...prev, ...patch } : prev);

  useEffect(() => {
    if (!form?.categoria_id || form.categoria_id === NEW) return;
    const cat = categorias.find(c => c.id === form.categoria_id);
    if (cat && cat.tipo !== categoriaTipo) {
      update({ categoria_id: null });
    }
  }, [form?.tipo_sugerido, categorias, categoriaTipo]);

  useEffect(() => {
    if (!form || isTransferencia) return;

    if (form.fornecedor_cliente && (currentEntityId === NEW || !currentEntityId)) {
      const normalizedName = normalize(form.fornecedor_cliente);
      const match = entityList.find(e => normalize(e.nome) === normalizedName);
      if (match) {
        if (isReceita) update({ cliente_id: match.id, fornecedor_id: null, fornecedor_cliente: match.nome });
        else update({ fornecedor_id: match.id, cliente_id: null, fornecedor_cliente: match.nome });
      }
    }

    if (form.categoria_sugerida && (form.categoria_id === NEW || !form.categoria_id)) {
      const normalizedCat = normalize(form.categoria_sugerida);
      const match = categoriasFiltradas.find(c => normalize(c.nome) === normalizedCat);
      if (match) update({ categoria_id: match.id, categoria_sugerida: match.nome });
    }

    if (form.forma_pagamento && (form.forma_pagamento_id === NEW || !form.forma_pagamento_id)) {
      const normalizedForma = normalize(form.forma_pagamento);
      const match = formasPagamento.find(f => normalize(f.nome) === normalizedForma);
      if (match) update({ forma_pagamento_id: match.id, forma_pagamento: match.nome });
    }
  }, [
    form?.fornecedor_cliente,
    form?.categoria_sugerida,
    form?.forma_pagamento,
    form?.tipo_sugerido,
    entityList,
    categoriasFiltradas,
  ]);

  if (!form) return null;

  const handleEntityChange = (val: string) => {
    if (val === NEW) {
      if (isReceita) update({ cliente_id: NEW, fornecedor_id: null });
      else update({ fornecedor_id: NEW, cliente_id: null });
      return;
    }
    const found = entityList.find(e => e.id === val);
    if (isReceita) update({ cliente_id: val, fornecedor_id: null, fornecedor_cliente: found?.nome || form.fornecedor_cliente });
    else update({ fornecedor_id: val, cliente_id: null, fornecedor_cliente: found?.nome || form.fornecedor_cliente });
  };

  const handleCategoriaChange = (val: string) => {
    if (val === NEW) { update({ categoria_id: NEW }); return; }
    const found = categoriasFiltradas.find(c => c.id === val);
    update({ categoria_id: val, categoria_sugerida: found?.nome || form.categoria_sugerida });
  };

  const handleFormaChange = (val: string) => {
    if (val === NEW) { update({ forma_pagamento_id: NEW }); return; }
    const found = formasPagamento.find(f => f.id === val);
    update({ forma_pagamento_id: val, forma_pagamento: found?.nome || form.forma_pagamento });
  };

  const handleProjetoChange = (val: string) => {
    update({ projeto_id: val === NONE ? null : val });
  };

  const handleSubmit = () => {
    if (!form.descricao?.trim()) return;
    if (isTransferencia) {
      if (!form.conta_bancaria_id || !form.conta_destino_id) return;
      if (form.conta_bancaria_id === form.conta_destino_id) return;
    }
    onSave(form);
    onOpenChange(false);
  };

  const transferInvalid = isTransferencia && (!form.conta_bancaria_id || !form.conta_destino_id || form.conta_bancaria_id === form.conta_destino_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar lançamento importado</DialogTitle>
          <DialogDescription>Ajuste os dados extraídos pela IA. Você pode escolher um cadastro existente ou criar um novo.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Descrição *</Label>
            <Input
              value={form.descricao || ""}
              onChange={(e) => update({ descricao: e.target.value })}
              maxLength={255}
            />
          </div>

          <div>
            <Label>Valor *</Label>
            <div className="relative">
              <Input
                type="number" step="0.01" min={0}
                value={form.valor}
                onChange={(e) => update({ valor: parseFloat(e.target.value) || 0 })}
                className="pr-10"
              />
              <div className="mt-1 text-[10px] text-muted-foreground font-medium">
                {form.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
          </div>

          <div>
            <Label>Data da transação</Label>
            <Input type="date" value={form.data || ""} onChange={(e) => update({ data: e.target.value || null })} />
            <p className="text-[10px] text-muted-foreground mt-1">Será usada como vencimento e pagamento (lançamento já realizado).</p>
          </div>

          <div className="md:col-span-2">
            <Label>Tipo</Label>
            <Select
              value={form.tipo_sugerido}
              onValueChange={(v) => update({ tipo_sugerido: v, cliente_id: null, fornecedor_id: null, categoria_id: null })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="transferencia">
                  <span className="flex items-center gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Transferência entre contas</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conta bancária (sempre visível) */}
          <div className={isTransferencia ? "" : "md:col-span-2"}>
            <Label>{isTransferencia ? "Conta de origem *" : "Conta bancária"}</Label>
            <Select value={form.conta_bancaria_id || NONE} onValueChange={(v) => update({ conta_bancaria_id: v === NONE ? null : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {!isTransferencia && <SelectItem value={NONE}>Conta principal (padrão)</SelectItem>}
                {contasBancarias.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTransferencia && (
            <div>
              <Label>Conta de destino *</Label>
              <Select value={form.conta_destino_id || NONE} onValueChange={(v) => update({ conta_destino_id: v === NONE ? null : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta destino" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map(c => (
                    <SelectItem key={c.id} value={c.id} disabled={c.id === form.conta_bancaria_id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transferInvalid && (
                <p className="text-[10px] text-destructive mt-1">Selecione contas de origem e destino diferentes.</p>
              )}
            </div>
          )}

          {/* Fornecedor / Cliente — oculto em transferência */}
          {!isTransferencia && (
            <div className="md:col-span-2">
              <Label>{entityLabel}</Label>
              <Select value={currentEntityId || ""} onValueChange={handleEntityChange}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione um ${entityLabel.toLowerCase()} existente ou crie novo`} />
                </SelectTrigger>
                <SelectContent>
                  {entityList.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                  <SelectItem value={NEW}>
                    <span className="flex items-center gap-1.5 text-primary">
                      <Plus className="h-3.5 w-3.5" /> Criar novo {entityLabel.toLowerCase()}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {(currentEntityId === NEW || !currentEntityId) && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 px-1">
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                      <Plus className="h-2.5 w-2.5 mr-1" /> Novo cadastro
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">Este {entityLabel.toLowerCase()} será criado ao importar</span>
                  </div>
                  <Input
                    placeholder={`Nome do ${entityLabel.toLowerCase()}`}
                    value={form.fornecedor_cliente || ""}
                    onChange={(e) => update({ fornecedor_cliente: e.target.value })}
                    maxLength={150}
                  />
                </div>
              )}
            </div>
          )}

          {/* Categoria — oculta em transferência */}
          {!isTransferencia && (
            <div className="md:col-span-2">
              <Label>Categoria ({categoriaTipo})</Label>
              <Select value={form.categoria_id || ""} onValueChange={handleCategoriaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria existente ou crie nova" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasFiltradas.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhuma categoria de {categoriaTipo} cadastrada
                    </div>
                  )}
                  {categoriasFiltradas.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                  <SelectItem value={NEW}>
                    <span className="flex items-center gap-1.5 text-primary">
                      <Plus className="h-3.5 w-3.5" /> Criar nova categoria
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {(form.categoria_id === NEW || !form.categoria_id) && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 px-1">
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                      <Plus className="h-2.5 w-2.5 mr-1" /> Nova categoria
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">Esta categoria será criada ao importar</span>
                  </div>
                  <Input
                    placeholder="Nome da categoria"
                    value={form.categoria_sugerida || ""}
                    onChange={(e) => update({ categoria_sugerida: e.target.value })}
                    maxLength={80}
                  />
                </div>
              )}
            </div>
          )}

          {/* Projeto */}
          {!isTransferencia && (
            <div className="md:col-span-2">
              <Label>Projeto</Label>
              <Select value={form.projeto_id || NONE} onValueChange={handleProjetoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem projeto</SelectItem>
                  {projetos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Forma de pagamento */}
          <div className="md:col-span-2">
            <Label>Forma de pagamento</Label>
            <Select value={form.forma_pagamento_id || ""} onValueChange={handleFormaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione ou crie nova" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
                <SelectItem value={NEW}>
                  <span className="flex items-center gap-1.5 text-primary">
                    <Plus className="h-3.5 w-3.5" /> Criar nova forma de pagamento
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {(form.forma_pagamento_id === NEW || !form.forma_pagamento_id) && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 px-1">
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                    <Plus className="h-2.5 w-2.5 mr-1" /> Nova forma
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Será criada ao importar</span>
                </div>
                <Input
                  placeholder="Ex: PIX, Cartão, Boleto..."
                  value={form.forma_pagamento || ""}
                  onChange={(e) => update({ forma_pagamento: e.target.value })}
                  maxLength={50}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes || ""}
              onChange={(e) => update({ observacoes: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={transferInvalid}>
            <Save className="h-4 w-4 mr-2" /> Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
