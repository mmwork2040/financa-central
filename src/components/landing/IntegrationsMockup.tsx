import React from "react";
import { BarChart3 } from "lucide-react";

const MetaLogo = () => (
  <svg viewBox="0 0 512 512" className="h-9 w-9">
    <linearGradient id="meta-g" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#0064E0" />
      <stop offset="50%" stopColor="#0064E0" />
      <stop offset="100%" stopColor="#0073FA" />
    </linearGradient>
    <path fill="url(#meta-g)" d="M115.2 169.6c-34.5 0-62.4 23.5-82.5 58.7C11.2 265.6 0 313.6 0 352c0 46.4 22.4 80 64 80 33.6 0 59.2-20.8 91.2-72l28.8-46.4c12.8-20.8 24-38.4 36.8-56-15.2-28.8-33.6-49.6-52.8-66.4-20.8-14.4-35.2-21.6-52.8-21.6zm281.6 0c-17.6 0-32 7.2-52.8 21.6-19.2 16.8-37.6 37.6-52.8 66.4 12.8 17.6 24 35.2 36.8 56l28.8 46.4c32 51.2 57.6 72 91.2 72 41.6 0 64-33.6 64-80 0-38.4-11.2-86.4-32.7-123.7-20.1-35.2-48-58.7-82.5-58.7zM256 280c-9.6 14.4-19.2 30.4-28.8 48l-28.8 46.4C168 420.8 139.2 448 102.4 448c-4.8 0-9.6-.8-14.4-1.6C112 472 142.4 488 176 488c41.6 0 64-22.4 80-56 16 33.6 38.4 56 80 56 33.6 0 64-16 88-41.6-4.8.8-9.6 1.6-14.4 1.6-36.8 0-65.6-27.2-96-73.6l-28.8-46.4c-9.6-17.6-19.2-33.6-28.8-48z"/>
  </svg>
);

const GoogleAdsLogo = () => (
  <svg viewBox="0 0 256 256" className="h-8 w-8">
    <path fill="#FBBC04" d="M5.8 163.4L86.2 24.1c12.6-21.8 40.5-29.3 62.3-16.7s29.3 40.5 16.7 62.3L85.8 208.9c-12.6 21.8-40.5 29.3-62.3 16.7S-6.8 185.2 5.8 163.4z"/>
    <path fill="#4285F4" d="M170.2 232.7L89.8 93.4c-12.6-21.8-5.1-49.7 16.7-62.3s49.7-5.1 62.3 16.7l80.4 139.2c12.6 21.8 5.1 49.7-16.7 62.3s-49.7 5.1-62.3-16.6z"/>
    <circle fill="#34A853" cx="53.8" cy="224" r="32"/>
  </svg>
);

const HotmartLogo = () => (
  <svg viewBox="0 0 256 256" className="h-8 w-8">
    <path fill="#F04E23" d="M128 0C57.3 0 0 57.3 0 128s57.3 128 128 128 128-57.3 128-128S198.7 0 128 0z"/>
    <path fill="#fff" d="M128 56c-16 0-28.8 8-36.8 20.8L68.8 116c-4 6.4-4 14.4 0 20.8l22.4 39.2C99.2 188 112 196 128 196s28.8-8 36.8-20.8l22.4-39.2c4-6.4 4-14.4 0-20.8l-22.4-39.2C156.8 64 144 56 128 56z"/>
  </svg>
);

const KiwifyLogo = () => (
  <svg viewBox="0 0 256 256" className="h-8 w-8">
    <rect fill="#22C55E" rx="48" width="256" height="256"/>
    <path fill="#fff" d="M80 72h24v112H80V72zm42.4 0h28.8l33.6 52-33.6 60H122l33.6-60-33.6-52h.4zm0 0"/>
  </svg>
);

const ShopifyLogo = () => (
  <img src="/logos/shopify.png" alt="Shopify" className="h-8 w-8 object-contain" />
);

const StripeLogo = () => (
  <svg viewBox="0 0 120 120" className="h-8 w-8">
    <rect fill="#635BFF" rx="16" width="120" height="120"/>
    <path fill="#fff" d="M55.2 46.8c0-3.6 3-5.1 7.8-5.1 7 0 15.8 2.1 22.8 5.9V33.2c-7.6-3-15.2-4.2-22.8-4.2C48.2 29 37 37.8 37 51.6c0 21.3 29.4 17.9 29.4 27.1 0 4.3-3.7 5.7-9 5.7-7.8 0-17.7-3.2-25.6-7.5v14.7c8.7 3.7 17.5 5.4 25.6 5.4 15.4 0 26-7.6 26-22.6.1-23-29.2-18.9-29.2-27.6z"/>
  </svg>
);

const platforms = [
  { name: "Meta Ads", Logo: MetaLogo },
  { name: "Google Ads", Logo: GoogleAdsLogo },
  { name: "Hotmart", Logo: HotmartLogo },
  { name: "Kiwify", Logo: KiwifyLogo },
  { name: "Shopify", Logo: ShopifyLogo },
  { name: "Stripe", Logo: StripeLogo },
];

const IntegrationsMockup = () => {
  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%)"
      }} />
      <p className="text-xs font-semibold text-foreground mb-4 text-center relative z-10">Plataformas Conectadas</p>
      <div className="flex justify-center mb-5 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/20">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 relative z-10">
        {platforms.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-2 rounded-xl bg-background/60 border border-border/50 p-3 hover:-translate-y-0.5 transition-all">
            <p.Logo />
            <span className="text-[10px] text-muted-foreground font-medium">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsMockup;
