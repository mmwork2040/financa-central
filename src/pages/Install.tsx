
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share, MoreVertical, PlusSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <div className="text-center space-y-2">
          <Smartphone className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Instalar Fluxo de Contas</h1>
          <p className="text-muted-foreground text-sm">
            Acesse o app direto da tela inicial do seu celular, como um app nativo.
          </p>
        </div>

        {isInstalled ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-primary font-medium">✅ O app já está instalado!</p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">Clique no botão abaixo para instalar:</p>
              <Button onClick={handleInstall} className="w-full gap-2">
                <Download className="h-4 w-4" /> Instalar agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {isIOS ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">No iPhone / iPad (Safari)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Step number={1} icon={<Share className="h-5 w-5" />} text='Toque no ícone de compartilhar (quadrado com seta para cima)' />
                  <Step number={2} icon={<PlusSquare className="h-5 w-5" />} text='Role e toque em "Adicionar à Tela de Início"' />
                  <Step number={3} icon={null} text='Confirme tocando em "Adicionar"' />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">No Android (Chrome)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Step number={1} icon={<MoreVertical className="h-5 w-5" />} text="Toque no menu (três pontinhos) no canto superior" />
                  <Step number={2} icon={<Download className="h-5 w-5" />} text='Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"' />
                  <Step number={3} icon={null} text='Confirme tocando em "Instalar"' />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Step = ({ number, icon, text }: { number: number; icon: React.ReactNode; text: string }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
      {number}
    </div>
    <div className="flex items-center gap-2 text-sm text-foreground">
      {icon}
      <span>{text}</span>
    </div>
  </div>
);

export default Install;
