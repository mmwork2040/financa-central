
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Categoria } from "@/contexts/LancamentosContext";
import { QuickAddDialog } from "./QuickAddDialog";

interface CategoriaSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  categorias: Categoria[];
  tipo: "despesa" | "receita" | "investimento";
  onRefresh?: () => void;
}

export const CategoriaSelect = ({ value, onChange, categorias, tipo, onRefresh }: CategoriaSelectProps) => {
  const filteredCategorias = categorias.filter(cat => cat.tipo === tipo);
  
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="categoria" className="text-right">Categoria</Label>
      <div className="col-span-3 flex gap-2">
        <Select 
          value={value || "no-category"} 
          onValueChange={(value) => onChange(value === "no-category" ? "" : value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-category">Sem categoria</SelectItem>
            {filteredCategorias.map(categoria => (
              <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onRefresh && (
          <QuickAddDialog
            title="Categoria"
            table="categorias"
            fields={[
              { name: "nome", label: "Nome", required: true },
              { name: "tipo", label: "Tipo", type: "select", required: true, defaultValue: tipo, options: [
                { value: "despesa", label: "Despesa" },
                { value: "receita", label: "Receita" },
                { value: "investimento", label: "Investimento" },
              ]},
            ]}
            onSuccess={onRefresh}
          />
        )}
      </div>
    </div>
  );
};
