
import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Lock, User, MessageCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

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
  const { userProfile, user, userRole, isSuperAdmin } = useAuth();
  const [nome, setNome] = useState(userProfile?.nome || "");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(userProfile?.foto_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evolutionWebhookUrl, setEvolutionWebhookUrl] = useState(userProfile?.evolution_webhook_url || "");
  const [savingWebhook, setSavingWebhook] = useState(false);

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
    setSavingWebhook(true);
    try {
      const { error } = await (supabase as any)
        .from("perfis")
        .update({ evolution_webhook_url: evolutionWebhookUrl.trim() || null })
        .eq("id", user!.id);
      if (error) throw error;
      toast.success("Webhook da Evolution API salvo com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar webhook");
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
        {/* Evolution API Webhook */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Evolution API — Webhook Pessoal
            </CardTitle>
            <CardDescription>
              Configure a URL do webhook da sua instância Evolution API para receber e enviar mensagens pelo WhatsApp.
              Esta URL será usada automaticamente a cada login para manter o canal de comunicação ativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evolution-webhook">URL do Webhook</Label>
              <div className="flex gap-2">
                <Input
                  id="evolution-webhook"
                  type="url"
                  value={evolutionWebhookUrl}
                  onChange={e => setEvolutionWebhookUrl(e.target.value)}
                  placeholder="https://sua-evolution-api.com/webhook/sua-instancia"
                />
                <Button onClick={handleSaveWebhook} disabled={savingWebhook} size="sm">
                  {savingWebhook ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {savingWebhook ? "Salvando..." : "Salvar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: https://evolution.suaempresa.com/webhook/instancia1
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
