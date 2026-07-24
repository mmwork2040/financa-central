
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Lock, User, MessageCircle, Loader2, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALLOWED_TIMEOUTS, getInactivityMinutes, setInactivityMinutes } from "@/components/auth/SessionManager";
import PageHeader from "@/components/common/PageHeader";
import { phoneInputMask } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  isFloatingWAHidden,
  setFloatingWAHidden,
  FLOATING_WA_EVENT,
  FLOATING_WA_STORAGE_KEY,
} from "@/utils/floatingWhatsAppVisibility";

const getInitials = (nome: string) =>
  nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();

const getRoleLabel = (role: string | null, isSuperAdmin: boolean) => {
  if (isSuperAdmin) return "Super Admin";
  switch (role) {
    case "admin": return "Administrador";
    case "usuario": return "Usuário";
    case "leitura": return "Leitura";
    default: return role || "Usuário";
  }
};

const Profile = () => {
  const { userProfile, user, userRole, isSuperAdmin, isTrialActive, trialDaysRemaining, assinaturaStatus } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState(userProfile?.nome || "");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(userProfile?.foto_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawPhone = userProfile?.evolution_webhook_url || "";
  const [evolutionWebhookUrl, setEvolutionWebhookUrl] = useState(rawPhone ? phoneInputMask(rawPhone) : "");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [planoNome, setPlanoNome] = useState<string | null>(null);
  const [inactivityTimeout, setInactivityTimeoutState] = useState<number>(getInactivityMinutes());
  const [waBtnHidden, setWaBtnHidden] = useState<boolean>(() => isFloatingWAHidden());

  useEffect(() => {
    const sync = () => setWaBtnHidden(isFloatingWAHidden());
    const onStorage = (e: StorageEvent) => {
      if (e.key === FLOATING_WA_STORAGE_KEY) sync();
    };
    window.addEventListener(FLOATING_WA_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(FLOATING_WA_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const fetchPlano = async () => {
      if (userProfile?.assinatura_plano_id) {
        const { data } = await (supabase as any)
          .from('planos_assinatura')
          .select('nome')
          .eq('id', userProfile.assinatura_plano_id)
          .single();
        if (data) setPlanoNome(data.nome);
      }
    };
    fetchPlano();
  }, [userProfile?.assinatura_plano_id]);

  const handlePhoneFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    setEvolutionWebhookUrl(phoneInputMask(raw));
  };

  const handleSaveName = async () => {
    if (!nome.trim()) {
      toast.error("O nome não pode ficar vazio");
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ nome: nome.trim() })
        .eq("id", user!.id);
      if (error) throw error;
      toast.success("Nome atualizado com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar nome");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `perfis/${user!.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("perfis")
        .update({ foto_url: publicUrl } as any)
        .eq("id", user!.id);

      if (updateError) throw updateError;

      setFotoUrl(publicUrl);
      toast.success("Foto de perfil atualizada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload da foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveWebhook = async () => {
    const rawPhone = evolutionWebhookUrl.replace(/\D/g, "");
    if (rawPhone.length < 10 || rawPhone.length > 11) {
      toast.error("Informe um número de telefone válido com DDD.");
      return;
    }
    setSavingWebhook(true);
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from("perfis")
        .select("id")
        .eq("evolution_webhook_url", rawPhone)
        .neq("id", user!.id)
        .maybeSingle();

      if (existing) {
        toast.error("Este número de telefone já está cadastrado por outro usuário.");
        setSavingWebhook(false);
        return;
      }

      const { error } = await (supabase as any)
        .from("perfis")
        .update({ evolution_webhook_url: rawPhone })
        .eq("id", user!.id);
      if (error) throw error;
      toast.success("Telefone WhatsApp salvo com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar telefone");
    } finally {
      setSavingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais."
        icon={User}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            <CardDescription>Atualize seu nome e foto de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={fotoUrl || undefined} alt={userProfile?.nome} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(userProfile?.nome || "U")}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{userProfile?.nome}</p>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {getRoleLabel(userRole, isSuperAdmin)}
                </span>
              </div>
            </div>

            {/* Name edit */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <div className="flex gap-2">
                <Input
                  id="nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome"
                />
                <Button onClick={handleSaveName} disabled={savingName} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  {savingName ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password change */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </CardTitle>
            <CardDescription>Defina uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword} className="w-full">
              {savingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>
        {/* Plano Atual */}
        {!isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Meu Plano
              </CardTitle>
              <CardDescription>Informações sobre sua assinatura atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={assinaturaStatus === 'ativo' ? 'default' : assinaturaStatus === 'trial' ? 'secondary' : 'destructive'}>
                  {assinaturaStatus === 'trial' ? 'Teste Gratuito' : assinaturaStatus === 'ativo' ? 'Ativo' : 'Expirado'}
                </Badge>
              </div>
              {planoNome && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plano</span>
                  <span className="text-sm font-medium">{planoNome}</span>
                </div>
              )}
              {assinaturaStatus === 'trial' && trialDaysRemaining !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dias restantes</span>
                    <span className="text-sm font-bold">{trialDaysRemaining} de 30</span>
                  </div>
                  <Progress value={((30 - trialDaysRemaining) / 30) * 100} className="h-2" />
                </div>
              )}
              {!planoNome && assinaturaStatus !== 'trial' && (
                <p className="text-sm text-muted-foreground">Nenhum plano ativo.</p>
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/ver-planos")}>
                Ver planos disponíveis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Telefone WhatsApp */}
        <Card className={isSuperAdmin ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Telefone WhatsApp
            </CardTitle>
            <CardDescription>
              Informe seu número de WhatsApp para identificação automática.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-phone">Número do WhatsApp</Label>
              <div className="flex gap-2">
                <Input
                  id="whatsapp-phone"
                  type="tel"
                  value={evolutionWebhookUrl}
                  onChange={handlePhoneFieldChange}
                  placeholder="(00) 00000-0000"
                  className="font-mono"
                />
                <Button onClick={handleSaveWebhook} disabled={savingWebhook} size="sm">
                  {savingWebhook ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {savingWebhook ? "Salvando..." : "Salvar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formato WhatsApp: (DDD) + número. Este número deve ser único no sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Segurança - Timeout de sessão */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Segurança da sessão
            </CardTitle>
            <CardDescription>
              Defina o tempo de inatividade antes do logout automático. Um aviso aparece 60s antes com opção de estender.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label>Expirar sessão após</Label>
              <Select
                value={String(inactivityTimeout)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setInactivityTimeoutState(n);
                  setInactivityMinutes(n);
                  toast.success(`Sessão expirará após ${n} minutos de inatividade.`);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALLOWED_TIMEOUTS.map(m => (
                    <SelectItem key={m} value={String(m)}>{m} minutos</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
