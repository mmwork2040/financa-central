
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface AddressData {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface CepAddressFieldsProps {
  address: AddressData;
  onChange: (field: keyof AddressData, value: string) => void;
}

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

const CepAddressFields: React.FC<CepAddressFieldsProps> = ({ address, onChange }) => {
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange("cep", formatted);
  };

  const searchCep = async () => {
    const rawCep = address.cep.replace(/\D/g, "");
    if (rawCep.length !== 8) {
      toast.error("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      onChange("rua", data.logradouro || "");
      onChange("bairro", data.bairro || "");
      onChange("cidade", data.localidade || "");
      onChange("estado", data.uf || "");
      onChange("complemento", data.complemento || "");
      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchCep();
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="cep">CEP</Label>
          <div className="flex gap-1">
            <Input
              id="cep"
              value={address.cep}
              onChange={handleCepChange}
              onKeyDown={handleCepKeyDown}
              placeholder="00000-000"
              maxLength={9}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={searchCep}
              disabled={loadingCep}
              title="Buscar CEP"
            >
              {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="rua">Rua / Logradouro</Label>
          <Input
            id="rua"
            value={address.rua}
            onChange={e => onChange("rua", e.target.value)}
            placeholder="Rua, Avenida..."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            value={address.numero}
            onChange={e => onChange("numero", e.target.value)}
            placeholder="Nº"
          />
        </div>
        <div>
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            value={address.complemento}
            onChange={e => onChange("complemento", e.target.value)}
            placeholder="Apto, Sala..."
          />
        </div>
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            value={address.bairro}
            onChange={e => onChange("bairro", e.target.value)}
            placeholder="Bairro"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={address.cidade}
            onChange={e => onChange("cidade", e.target.value)}
            placeholder="Cidade"
          />
        </div>
        <div>
          <Label htmlFor="estado">UF</Label>
          <Input
            id="estado"
            value={address.estado}
            onChange={e => onChange("estado", e.target.value.toUpperCase().slice(0, 2))}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
};

export default CepAddressFields;
