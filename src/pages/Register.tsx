import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { phoneInputMask } from "@/utils/format";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm({ ...form, phone: phoneInputMask(raw) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawPhone = form.phone.replace(/\D/g, "");

    if (!form.nome || !form.email || !form.password || !rawPhone) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (rawPhone.length < 10 || rawPhone.length > 11) {
      toast.error("Informe um número de telefone válido com DDD.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("register-user", {
        body: {
          email: form.email,
          password: form.password,
          nome: form.nome,
          phone: rawPhone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Conta criada com sucesso! Faça login para acessar o sistema.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer title="Criar Conta" description="Registre-se para acessar o sistema">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium text-foreground">
              Seu Nome <span className="text-destructive">*</span>
            </label>
            <Input
              id="nome"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Telefone WhatsApp <span className="text-destructive">*</span>
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={handlePhoneChange}
              required
              className="font-mono tracking-wider"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirmar Senha <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar Conta"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline">
            Faça login
          </button>
        </p>
      </form>
    </AuthContainer>
  );
};

export default Register;
