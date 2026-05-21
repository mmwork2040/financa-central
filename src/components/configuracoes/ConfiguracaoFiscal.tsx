import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Upload, Loader2, CheckCircle2, AlertTriangle, Shield, Building2, Download } from "lucide-react";
import CepAddressFields, { AddressData } from "@/components/common/CepAddressFields";

interface ConfiguracaoFiscalProps {
  empresaId: string;
  onComplete?: () => void;
  isWizard?: boolean;
}

const REGIMES = [
  { value: "simplesNacional", label: "Simples Nacional" },
  { value: "simplesNacionalMEI", label: "MEI" },
  { value: "regimeNormal", label: "Lucro Presumido / Lucro Real" },
  { value: "simplesNacionalExcessoSublimite", label: "Simples Nacional - Excesso Sublimite" },
];

const ConfiguracaoFiscal = ({ empresaId, onComplete, isWizard = false }: ConfiguracaoFiscalProps) => {
  const { isSuperAdmin, userRole } = useAuth();
  const isAdmin = userRole === "admin" || isSuperAdmin;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certMeta, setCertMeta] = useState<{ name: string; size: number; updated_at: string } | null>(null);
  const [downloadingCert, setDownloadingCert] = useState(false);

  const [fiscal, setFiscal] = useState({
    cnpj: "",
    razao_social: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    regime_tributario: "simplesNacional",
    certificado_digital_url: "",
    fiscal_configurado: false,
  });

  const [certPassword, setCertPassword] = useState("");
  const [address, setAddress] = useState<AddressData>({
    cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  });

  useEffect(() => {
    fetchFiscalData();
    fetchCertMeta();
  }, [empresaId]);

  const fetchCertMeta = async () => {
    try {
      const { data, error } = await supabase.storage.from("certificados").list(empresaId, { limit: 10 });
      if (error) throw error;
      const file = (data || []).find((f: any) => /\.(pfx|p12)$/i.test(f.name));
      if (file) {
        setCertMeta({
          name: file.name,
          size: (file as any).metadata?.size || 0,
          updated_at: (file as any).updated_at || (file as any).created_at || new Date().toISOString(),
        });
      } else {
        setCertMeta(null);
      }
    } catch {
      setCertMeta(null);
    }
  };

  const handleDownloadCert = async () => {
    if (!fiscal.certificado_digital_url) return;
    setDownloadingCert(true);
    try {
      const { data, error } = await supabase.storage
        .from("certificados")
        .createSignedUrl(fiscal.certificado_digital_url, 60);
      if (error || !data?.signedUrl) throw error || new Error("URL inválida");
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Não foi possível gerar o link de download");
    } finally {
      setDownloadingCert(false);
    }
  };

  const fetchFiscalData = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("empresas")
        .select("cnpj, nome, razao_social, inscricao_estadual, inscricao_municipal, regime_tributario, certificado_digital_url, fiscal_configurado, cep, rua, numero, complemento, bairro, cidade, estado, email, telefone")
        .eq("id", empresaId)
        .single();

      if (error) throw error;
      if (data) {
        setFiscal({
          cnpj: data.cnpj || "",
          razao_social: data.razao_social || "",
          inscricao_estadual: data.inscricao_estadual || "",
          inscricao_municipal: data.inscricao_municipal || "",
          regime_tributario: data.regime_tributario || "simplesNacional",
          certificado_digital_url: data.certificado_digital_url || "",
          fiscal_configurado: !!(data.fiscal_configurado && data.certificado_digital_url),
        });
        setAddress({
          cep: data.cep || "",
          rua: data.rua || "",
          numero: data.numero || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados fiscais");
    } finally {
      setLoading(false);
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
      toast.error("O certificado deve ser um arquivo .pfx ou .p12");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O certificado não pode exceder 10MB.");
      return;
    }

    setUploadingCert(true);
    try {
      const path = `${empresaId}/certificado.pfx`;
      const { error: uploadError } = await supabase.storage
        .from("certificados")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      setFiscal(prev => ({ ...prev, certificado_digital_url: path }));
      toast.success("Certificado digital enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar certificado");
    } finally {
      setUploadingCert(false);
    }
  };

  const validateFields = (): string[] => {
    const missing: string[] = [];
    if (!fiscal.cnpj?.replace(/\D/g, "").length) missing.push("CNPJ");
    if (!fiscal.razao_social?.trim()) missing.push("Razão Social");
    if (!address.cep?.trim() || !address.rua?.trim() || !address.cidade?.trim() || !address.estado?.trim()) {
      missing.push("Endereço completo (CEP, Rua, Cidade, Estado)");
    }
    if (!fiscal.certificado_digital_url) missing.push("Certificado Digital A1 (.pfx)");
    if (fiscal.certificado_digital_url && !certPassword?.trim()) missing.push("Senha do Certificado Digital");
    return missing;
  };

  const handleSave = async () => {
    const missing = validateFields();
    if (missing.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("empresas")
        .update({
          cnpj: fiscal.cnpj || null,
          razao_social: fiscal.razao_social || null,
          inscricao_estadual: fiscal.inscricao_estadual || null,
          inscricao_municipal: fiscal.inscricao_municipal || null,
          regime_tributario: fiscal.regime_tributario || null,
          certificado_digital_url: fiscal.certificado_digital_url || null,
          fiscal_configurado: !!(fiscal.certificado_digital_url),
          cep: address.cep || null,
          rua: address.rua || null,
          numero: address.numero || null,
          complemento: address.complemento || null,
          bairro: address.bairro || null,
          cidade: address.cidade || null,
          estado: address.estado || null,
        })
        .eq("id", empresaId);

      if (error) throw error;

      // If certificate was uploaded and we have spedy config, send to Spedy
      if (fiscal.certificado_digital_url && certPassword) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke("spedy-setup-company", {
            body: {
              empresa_id: empresaId,
              cert_password: certPassword,
            },
          });
          if (fnError) console.error("Spedy setup error:", fnError);
          if (data?.error) console.warn("Spedy setup warning:", data.error);
          else if (data?.success) toast.success("Empresa registrada na Spedy com sucesso!");
        } catch {
          // Non-critical - Spedy config might not be set up yet
        }
      }

      setFiscal(prev => ({ ...prev, fiscal_configurado: !!prev.certificado_digital_url }));
      toast.success("Configuração fiscal salva com sucesso!");
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração fiscal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">

      {/* Removido o cabeçalho redundante quando dentro do Accordion */}


      {isWizard && (
        <div className="text-center space-y-2 pb-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Configuração Fiscal</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Para emitir notas fiscais, o Governo precisa saber quem está emitindo. 
            Preencha os dados abaixo uma única vez.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Dados da Empresa
            </CardTitle>
            <CardDescription>Informações obrigatórias para a SEFAZ/Prefeitura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CNPJ <span className="text-destructive">*</span></Label>
              <Input
                value={fiscal.cnpj}
                onChange={e => setFiscal(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Razão Social <span className="text-destructive">*</span></Label>
              <Input
                value={fiscal.razao_social}
                onChange={e => setFiscal(prev => ({ ...prev, razao_social: e.target.value }))}
                placeholder="Razão Social conforme CNPJ"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input
                value={fiscal.inscricao_estadual}
                onChange={e => setFiscal(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                placeholder="Para emissão de NF-e (produtos)"
                disabled={!isAdmin}
              />
              <p className="text-xs text-muted-foreground">Obrigatória para NF-e (produtos)</p>
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input
                value={fiscal.inscricao_municipal}
                onChange={e => setFiscal(prev => ({ ...prev, inscricao_municipal: e.target.value }))}
                placeholder="Para emissão de NFS-e (serviços)"
                disabled={!isAdmin}
              />
              <p className="text-xs text-muted-foreground">Obrigatória para NFS-e (serviços)</p>
            </div>
            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select
                value={fiscal.regime_tributario}
                onValueChange={v => setFiscal(prev => ({ ...prev, regime_tributario: v }))}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Endereço + Certificado */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Endereço Fiscal <span className="text-destructive">*</span></CardTitle>
              <CardDescription>Endereço completo conforme CNPJ</CardDescription>
            </CardHeader>
            <CardContent>
              <CepAddressFields
                address={address}
                onChange={(field, value) => setAddress(prev => ({ ...prev, [field]: value }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Certificado Digital A1
              </CardTitle>
              <CardDescription>
                Arquivo .pfx — funciona como a "assinatura em cartório" digital da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fiscal.certificado_digital_url ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700 dark:text-green-400">Certificado digital enviado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">Nenhum certificado enviado</span>
                </div>
              )}

              {isAdmin && (
                <div>
                  <Label
                    htmlFor="cert-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingCert ? "Enviando..." : fiscal.certificado_digital_url ? "Substituir Certificado" : "Enviar Certificado (.pfx)"}
                  </Label>
                  <input
                    id="cert-upload"
                    type="file"
                    accept=".pfx,.p12"
                    className="hidden"
                    onChange={handleCertUpload}
                    disabled={uploadingCert || !isAdmin}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Arquivo .pfx ou .p12 — Máx 10MB.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Senha do certificado</Label>
                <Input
                  type="password"
                  value={certPassword}
                  onChange={e => setCertPassword(e.target.value)}
                  placeholder="Senha do arquivo .pfx"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground">Necessária ao salvar a configuração fiscal</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end gap-2">
          {isWizard && onComplete && (
            <Button variant="ghost" onClick={onComplete}>
              Pular por agora
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isWizard ? "Salvar e Continuar" : "Salvar Configuração Fiscal"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConfiguracaoFiscal;
