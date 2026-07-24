export const DEFAULT_WHATSAPP_PRE_MESSAGE = "Faça os lançamentos pelo Whatsapp";

const addTextParam = (url: string, message: string): string => {
  const text = message.trim();
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
};

const normalizeInputUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

export const normalizeWhatsAppUrl = (rawUrl: string | null | undefined, message = ""): string => {
  const normalizedInput = normalizeInputUrl(rawUrl || "");
  if (!normalizedInput) return "";

  try {
    const url = new URL(normalizedInput);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const isWhatsAppHost = host === "wa.me" || host === "api.whatsapp.com" || host === "web.whatsapp.com" || host === "whatsapp.com";

    if (!isWhatsAppHost) return normalizedInput;

    const phoneFromQuery = (url.searchParams.get("phone") || "").replace(/\D/g, "");
    const phoneFromPath = url.pathname.replace(/^\/+/, "").split("/")[0].replace(/\D/g, "");
    const phone = phoneFromQuery || phoneFromPath;

    if (phone) {
      return addTextParam(`https://wa.me/${phone}`, message);
    }

    if (host === "wa.me" && /^\/message\//i.test(url.pathname)) {
      return normalizedInput;
    }

    return normalizedInput;
  } catch {
    return normalizedInput;
  }
};

export const buildWhatsAppPhoneUrl = (rawPhone: string | null | undefined, message = ""): string | null => {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return normalizeWhatsAppUrl(`https://wa.me/${phone}`, message);
};