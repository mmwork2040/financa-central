import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Loader2 } from "lucide-react";
import InviteCodesCard from "@/components/convites/InviteCodesCard";

const ConfiguracoesEmpresa = () => {
  const { empresaId, userRole, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [empresa, setEmpresa] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    cor_primaria: "#3b82f6",
    logo_url: "",
  });

  const isAdmin = userRole === "admin" || isSuperAdmin;

  useEffect(() => {
    if (empresaId) fetchEmpresa();
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId!)
        .single();

      if (error) throw error;
      if (data) {
        setEmpresa({
          nome: data.nome || "",
          cnpj: data.cnpj || "",
          email: data.email || "",
          telefone: data.telefone || "",
          endereco: data.endereco || "",
          cor_primaria: data.cor_primaria || "#3b82f6",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!empresaId || !isAdmin) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .update({
          nome: empresa.nome,
          cnpj: empresa.cnpj || null,
          email: empresa.email || null,
          telefone: empresa.telefone || null,
          endereco: empresa.endereco || null,
          cor_primaria: empresa.cor_primaria,
          logo_url: empresa.logo_url || null,
        })
        .eq("id", empresaId);

      if (error) throw error;
      toast({ title: "Configurações salvas", description: "Dados da empresa atualizados com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresaId) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG, JPG, WebP ou SVG.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 2MB.", variant: "destructive" });
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${empresaId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      setEmpresa(prev => ({ ...prev, logo_url: logoUrl }));

      await supabase.from("empresas").update({ logo_url: logoUrl }).eq("id", empresaId);
      toast({ title: "Logo atualizado", description: "A logo foi enviada com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao enviar logo", description: error.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setEmpresa(prev => ({ ...prev, [field]: value }));
  };

  if (!empresaId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhuma empresa associada à sua conta.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Gerais</CardTitle>
            <CardDescription>Informações básicas da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={empresa.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={empresa.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={empresa.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={empresa.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={empresa.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personalização */}
        <Card>
          <CardHeader>
            <CardTitle>Personalização</CardTitle>
            <CardDescription>Logo e identidade visual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                  {empresa.logo_url ? (
                    <img src={empresa.logo_url} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                {isAdmin && (
                  <div>
                    <Label
                      htmlFor="logo-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploadingLogo ? "Enviando..." : "Enviar Logo"}
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP ou SVG. Máx 2MB.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cor Primária */}
            <div className="space-y-3">
              <Label htmlFor="cor_primaria">Cor Primária</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="cor_primaria"
                  value={empresa.cor_primaria}
                  onChange={(e) => handleChange("cor_primaria", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input"
                  disabled={!isAdmin}
                />
                <Input
                  value={empresa.cor_primaria}
                  onChange={(e) => handleChange("cor_primaria", e.target.value)}
                  className="w-32"
                  placeholder="#3b82f6"
                  disabled={!isAdmin}
                />
                <div
                  className="h-10 flex-1 rounded-md border"
                  style={{ backgroundColor: empresa.cor_primaria }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !empresa.nome.trim()}>
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      )}

      {/* Invite Codes */}
      <InviteCodesCard />
    </div>
  );
};

export default ConfiguracoesEmpresa;
