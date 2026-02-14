
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Categoria } from "@/contexts/LancamentosContext";

interface CategoriaSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  categorias: Categoria[];
  tipo: "despesa" | "receita";
}

export const CategoriaSelect = ({ value, onChange, categorias, tipo }: CategoriaSelectProps) => {
  const filteredCategorias = categorias.filter(cat => cat.tipo === tipo);
  
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="categoria" className="text-right">Categoria</Label>
      <Select 
        value={value || "no-category"} 
        onValueChange={(value) => onChange(value === "no-category" ? "" : value)}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Selecione a categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-category">Sem categoria</SelectItem>
          {filteredCategorias.map(categoria => (
            <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
