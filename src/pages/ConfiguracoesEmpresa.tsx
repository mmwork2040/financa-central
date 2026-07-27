import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Building2, Upload, Loader2, User, Trash2, MessageCircle, Ticket, Settings2, Plug } from "lucide-react";
import { Link } from "react-router-dom";

import InviteCodesCard from "@/components/convites/InviteCodesCard";

import ConfiguracaoFiscal from "@/components/configuracoes/ConfiguracaoFiscal";

import CepAddressFields, { AddressData } from "@/components/common/CepAddressFields";
import { phoneInputMask, documentInputMask } from "@/utils/format";
import { normalizeWhatsAppUrl } from "@/utils/whatsapp";

const ConfiguracoesEmpresa = () => {
  const { empresaId, userRole, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isPessoal, setIsPessoal] = useState(false);
  const [empresa, setEmpresa] = useState({
    nome: "", cnpj: "", email: "", telefone: "", endereco: "", logo_url: "",
    chat_lancamentos_url: "", chat_lancamentos_mensagem: "", chat_vendas_url: "",
  });
  const [address, setAddress] = useState<AddressData>({
    cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  });

  const isAdmin = userRole === "admin" || isSuperAdmin;

  useEffect(() => {
    if (empresaId) fetchEmpresa();
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("empresas").select("*").eq("id", empresaId!).single();
      if (error) throw error;
      if (data) {
        setIsPessoal((data as any).pessoal === true);
        setEmpresa({
          nome: data.nome || "",
          cnpj: data.cnpj ? documentInputMask(data.cnpj.replace(/\D/g, "")) : "",
          email: data.email || "",
          telefone: data.telefone ? phoneInputMask(data.telefone.replace(/\D/g, "")) : "",
          endereco: data.endereco || "",
          logo_url: data.logo_url || "",
          chat_lancamentos_url: (data as any).chat_lancamentos_url || "",
          chat_lancamentos_mensagem: (data as any).chat_lancamentos_mensagem || "",
          chat_vendas_url: (data as any).chat_vendas_url || "",
        });
        setAddress({
          cep: (data as any).cep || "",
          rua: (data as any).rua || "",
          numero: (data as any).numero || "",
          complemento: (data as any).complemento || "",
          bairro: (data as any).bairro || "",
          cidade: (data as any).cidade || "",
          estado: (data as any).estado || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!empresaId || !isAdmin) return;
    setSaving(true);
    try {
      // Validate CNPJ uniqueness
      if (empresa.cnpj && empresa.cnpj.trim()) {
        const { data: existing } = await supabase
          .from("empresas")
          .select("id, nome")
          .ilike("cnpj", empresa.cnpj.trim())
          .neq("id", empresaId)
          .limit(1);
        if (existing && existing.length > 0) {
          toast.error(`CNPJ já cadastrado pela empresa "${existing[0].nome}"`);
          setSaving(false);
          return;
        }
      }

      const { error } = await (supabase as any).from("empresas").update({
        nome: empresa.nome, cnpj: empresa.cnpj || null, email: empresa.email || null,
        telefone: empresa.telefone || null, endereco: empresa.endereco || null,
        logo_url: empresa.logo_url || null,
        cep: address.cep || null, rua: address.rua || null, numero: address.numero || null,
        complemento: address.complemento || null, bairro: address.bairro || null,
        cidade: address.cidade || null, estado: address.estado || null,
        chat_lancamentos_url: normalizeWhatsAppUrl(empresa.chat_lancamentos_url, empresa.chat_lancamentos_mensagem) || null,
        chat_lancamentos_mensagem: empresa.chat_lancamentos_mensagem?.trim() || null,
        chat_vendas_url: empresa.chat_vendas_url?.trim() || null,
      }).eq("id", empresaId);
      if (error) throw error;
      setEmpresa(prev => ({ ...prev, chat_lancamentos_url: normalizeWhatsAppUrl(prev.chat_lancamentos_url, prev.chat_lancamentos_mensagem) }));
      toast.success("Dados da empresa atualizados com sucesso.");
      window.dispatchEvent(new CustomEvent("company-data-changed", { detail: { nome: empresa.nome } }));
      window.dispatchEvent(new Event("chat-urls-updated"));
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresaId) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Use PNG, JPG, WebP ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("O tamanho máximo é 2MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${empresaId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setEmpresa(prev => ({ ...prev, logo_url: logoUrl }));
      await supabase.from("empresas").update({ logo_url: logoUrl }).eq("id", empresaId);
      window.dispatchEvent(new CustomEvent("company-logo-changed", { detail: { logo_url: logoUrl } }));
      toast.success("A logo foi enviada com sucesso.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!empresaId || !isAdmin) return;
    try {
      await supabase.from("empresas").update({ logo_url: null }).eq("id", empresaId);
      setEmpresa(prev => ({ ...prev, logo_url: "" }));
      window.dispatchEvent(new CustomEvent("company-logo-changed", { detail: { logo_url: null } }));
      toast.success("A logo foi removida com sucesso.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover logo");
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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              {isPessoal ? <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> : <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{isPessoal ? "Configurações Pessoais" : "Configurações da Empresa"}</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie os dados e personalização</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/settings/integracoes">
            <Plug className="mr-1.5 h-4 w-4" />
            Integrações
          </Link>
        </Button>
      </div>


      {isPessoal && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Você está no modo individual</CardTitle>
            <CardDescription>
              Suas finanças estão sendo gerenciadas no modo pessoal. Se quiser criar ou entrar em uma empresa, use o seletor de empresas na barra lateral.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="dados-gerais" className="border rounded-lg bg-card text-card-foreground shadow-sm px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Dados Gerais</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6">
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input id="nome" value={empresa.nome} onChange={(e) => handleChange("nome", e.target.value)} disabled={!isAdmin} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={empresa.cnpj} onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
                  handleChange("cnpj", documentInputMask(raw));
                }} placeholder="00.000.000/0000-00" disabled={!isAdmin} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email da empresa</Label>
                <Input id="email" type="email" value={empresa.email} onChange={(e) => handleChange("email", e.target.value)} disabled={!isAdmin} />
                <p className="text-xs text-muted-foreground">
                  Email comercial/institucional. Não afeta o email de acesso do usuário, mesmo que seja o mesmo endereço.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={empresa.telefone}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                    handleChange("telefone", phoneInputMask(raw));
                  }}
                  placeholder="(00) 00000-0000"
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <CepAddressFields
                  address={address}
                  onChange={(field, value) => setAddress(prev => ({ ...prev, [field]: value }))}
                />
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saving || !empresa.nome.trim()}>
                    {saving ? "Salvando..." : "Salvar Dados Gerais"}
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="personalizacao" className="border rounded-lg bg-card text-card-foreground shadow-sm px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Personalização</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6">
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-3">
                <Label>Logo da Empresa</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-24 w-24 shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                    {empresa.logo_url ? (
                      <img src={empresa.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  {isAdmin && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor="logo-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                          {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {uploadingLogo ? "Enviando..." : "Enviar Logo"}
                        </Label>
                        {empresa.logo_url && (
                          <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo} className="gap-1.5 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </Button>
                        )}
                      </div>
                      <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP ou SVG. Máx 2MB.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {isAdmin && (
          <AccordionItem value="links-chat" className="border rounded-lg bg-card text-card-foreground shadow-sm px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Links de Chat</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-4 max-w-2xl">
                <p className="text-sm text-muted-foreground mb-4">
                  Defina os links externos que serão abertos ao clicar no botão de chat nas páginas de lançamentos e vendas.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="chat_lancamentos_url">Link do Chat - Lançamentos</Label>
                  <Input
                    id="chat_lancamentos_url"
                    value={empresa.chat_lancamentos_url}
                    onChange={(e) => handleChange("chat_lancamentos_url", e.target.value)}
                    onBlur={() => handleChange("chat_lancamentos_url", normalizeWhatsAppUrl(empresa.chat_lancamentos_url, empresa.chat_lancamentos_mensagem))}
                    placeholder="https://t.me/seu_bot ou https://wa.me/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat_lancamentos_mensagem">Mensagem pré-preenchida do WhatsApp</Label>
                  <Textarea
                    id="chat_lancamentos_mensagem"
                    value={empresa.chat_lancamentos_mensagem}
                    onChange={(e) => handleChange("chat_lancamentos_mensagem", e.target.value)}
                    placeholder="Faça os lançamentos pelo WhatsApp"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Use wa.me/55NUMERO para abrir com mensagem; links api.whatsapp.com serão convertidos automaticamente.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat_vendas_url">Link do Chat - Vendas</Label>
                  <Input
                    id="chat_vendas_url"
                    value={empresa.chat_vendas_url}
                    onChange={(e) => handleChange("chat_vendas_url", e.target.value)}
                    placeholder="https://t.me/seu_bot ou https://wa.me/..."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Links"}
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {!isPessoal && (
          <AccordionItem value="convites" className="border rounded-lg bg-card text-card-foreground shadow-sm px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Códigos de Convite</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <InviteCodesCard />
            </AccordionContent>
          </AccordionItem>
        )}

        {!isPessoal && isAdmin && (
          <AccordionItem value="configuracao-fiscal" className="border rounded-lg bg-card text-card-foreground shadow-sm px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Configuração Fiscal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <ConfiguracaoFiscal empresaId={empresaId!} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      
    </div>
  );
};

export default ConfiguracoesEmpresa;
