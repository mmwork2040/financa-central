import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { phoneInputMask } from "@/utils/format";

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string, phone: string) => Promise<void>;
  isLoading: boolean;
}

export const RegisterForm = ({ onRegister, isLoading }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !confirmPassword || !phone) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const phoneClean = phone.replace(/\D/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      toast.error("Telefone inválido. Informe com DDD (10 ou 11 dígitos).");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    try {
      await onRegister(email, password, name, phoneClean);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setPhone("");
    } catch (error) {
      console.error("Erro de registro:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="register-name" className="text-sm font-medium text-foreground">
            Nome <span className="text-destructive">*</span>
          </label>
          <Input id="register-name" type="text" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required className="w-full" />
        </div>
        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-foreground">
            E-mail <span className="text-destructive">*</span>
          </label>
          <Input id="register-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" />
        </div>
        <div className="space-y-2">
          <label htmlFor="register-phone" className="text-sm font-medium text-foreground">
            WhatsApp <span className="text-destructive">*</span>
          </label>
          <Input 
            id="register-phone" 
            type="tel" 
            placeholder="(00) 00000-0000" 
            value={phone} 
            onChange={(e) => setPhone(phoneInputMask(e.target.value))} 
            required 
            maxLength={15}
            className="w-full" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Senha <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input id="register-password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
            Confirmar Senha <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirme sua senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full pr-10" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registrando..." : "Registrar"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Ao se registrar, você concorda com nossos{" "}
        <a href="/termos?tab=termos" target="_blank" className="text-primary hover:underline">
          Termos de Uso
        </a>{" "}
        e{" "}
        <a href="/termos?tab=privacidade" target="_blank" className="text-primary hover:underline">
          Política de Privacidade
        </a>.
      </p>
    </form>
  );
};

export default RegisterForm;
