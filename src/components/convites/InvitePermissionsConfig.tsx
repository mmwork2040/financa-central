import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ScreenPermission } from "./InviteCodesCard";

interface Props {
  screenPermissions: ScreenPermission[];
  onPermissionChange: (tela: string, field: 'pode_incluir' | 'pode_alterar' | 'pode_excluir', value: boolean) => void;
  onToggleAll: () => void;
  onToggleRow: (tela: string, checked: boolean) => void;
}

const InvitePermissionsConfig = ({ screenPermissions, onPermissionChange, onToggleAll, onToggleRow }: Props) => {
  const [open, setOpen] = useState(false);
  const allChecked = screenPermissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir);

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="w-full justify-between">
        <span>Configurar Permissões de Acesso</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div className="rounded-md border">
          <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onToggleAll}>
              {allChecked ? "Desmarcar Tudo" : "Selecionar Tudo"}
            </Button>
          </div>
          <table className="w-full table-auto text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Tela</th>
                <th className="px-3 py-2 text-center font-medium">Incluir</th>
                <th className="px-3 py-2 text-center font-medium">Alterar</th>
                <th className="px-3 py-2 text-center font-medium">Excluir</th>
              </tr>
            </thead>
            <tbody>
              {screenPermissions.map(perm => {
                const rowChecked = perm.pode_incluir && perm.pode_alterar && perm.pode_excluir;
                return (
                  <tr key={perm.tela} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={rowChecked} onCheckedChange={(c) => onToggleRow(perm.tela, !!c)} />
                        <span className="font-medium">{perm.nome}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center"><div className="flex justify-center"><Checkbox checked={perm.pode_incluir} onCheckedChange={(c) => onPermissionChange(perm.tela, 'pode_incluir', !!c)} /></div></td>
                    <td className="px-3 py-2 text-center"><div className="flex justify-center"><Checkbox checked={perm.pode_alterar} onCheckedChange={(c) => onPermissionChange(perm.tela, 'pode_alterar', !!c)} /></div></td>
                    <td className="px-3 py-2 text-center"><div className="flex justify-center"><Checkbox checked={perm.pode_excluir} onCheckedChange={(c) => onPermissionChange(perm.tela, 'pode_excluir', !!c)} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvitePermissionsConfig;
