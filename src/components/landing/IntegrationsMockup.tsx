import React from "react";
import { BarChart3 } from "lucide-react";

const MetaLogo = () => (
  <img src="/logos/meta-ads.png" alt="Meta Ads" className="h-9 w-9 object-contain" />
);

const HotmartLogo = () => (
  <img src="/logos/hotmart.png" alt="Hotmart" className="h-9 w-9 object-contain" />
);

const GoogleAdsLogo = () => (
  <svg viewBox="0 0 256 256" className="h-8 w-8">
    <path fill="#FBBC04" d="M5.8 163.4L86.2 24.1c12.6-21.8 40.5-29.3 62.3-16.7s29.3 40.5 16.7 62.3L85.8 208.9c-12.6 21.8-40.5 29.3-62.3 16.7S-6.8 185.2 5.8 163.4z"/>
    <path fill="#4285F4" d="M170.2 232.7L89.8 93.4c-12.6-21.8-5.1-49.7 16.7-62.3s49.7-5.1 62.3 16.7l80.4 139.2c12.6 21.8 5.1 49.7-16.7 62.3s-49.7 5.1-62.3-16.6z"/>
    <circle fill="#34A853" cx="53.8" cy="224" r="32"/>
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
