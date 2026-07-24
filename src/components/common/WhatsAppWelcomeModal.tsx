import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useChatUrls } from "@/hooks/useChatUrls";
import { buildWhatsAppPhoneUrl, DEFAULT_WHATSAPP_PRE_MESSAGE, normalizeWhatsAppUrl } from "@/utils/whatsapp";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.214-.515.295-1.176.295-1.724 0-.244-.143-.36-.345-.476-.302-.16-1.404-.732-1.704-.732zM16.045 24.6c-2.052 0-4.06-.65-5.722-1.85l-3.996 1.275 1.302-3.9c-1.343-1.74-2.06-3.87-2.06-6.064 0-5.764 4.713-10.448 10.476-10.448a10.42 10.42 0 0 1 7.41 3.067c1.98 1.97 3.066 4.585 3.066 7.382C26.521 19.926 21.83 24.6 16.045 24.6zm0-22.86C9.097 1.74 3.45 7.39 3.45 14.32a12.5 12.5 0 0 0 1.687 6.3l-1.97 5.84c-.072.215.13.43.345.358l5.96-1.892c1.85.946 3.91 1.447 5.98 1.447 6.97 0 12.6-5.654 12.6-12.6 0-6.948-5.65-12.6-12.6-12.6z" />
  </svg>
);

const STORAGE_KEY = "whatsapp_welcome_shown_v1";

export const WhatsAppWelcomeModal: React.FC = () => {
  const { isAuthenticated, user, userProfile } = useAuth();
  const { chatLancamentosUrl, chatLancamentosMensagem } = useChatUrls();
  const [open, setOpen] = useState(false);
  const preMessage = chatLancamentosMensagem || DEFAULT_WHATSAPP_PRE_MESSAGE;
  const fallbackUrl = buildWhatsAppPhoneUrl(userProfile?.evolution_webhook_url, preMessage);
  const whatsAppUrl = normalizeWhatsAppUrl(chatLancamentosUrl || fallbackUrl, preMessage);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const key = `${STORAGE_KEY}:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(key, "1");
    }, 800);
    return () => clearTimeout(t);
  }, [isAuthenticated, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white">
            <WhatsAppIcon className="h-8 w-8" />
          </div>
          <DialogTitle className="text-center">Lance suas movimentações pelo WhatsApp</DialogTitle>
          <DialogDescription className="text-center">
            Sua pré-mensagem:
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-center font-medium">
          “{preMessage}”
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Agora não</Button>
          {whatsAppUrl && (
            <Button asChild className="bg-[#25D366] hover:bg-[#1ebe5d] text-white">
              <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppWelcomeModal;
