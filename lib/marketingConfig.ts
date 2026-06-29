/**
 * Single place to wire up the RoundMate marketing site once the real
 * links exist. Edit the values below — nothing else needs to change.
 */

/** Stripe Payment Link for the £99 founder setup. Replace "#" once created. */
export const STRIPE_PAYMENT_LINK_URL = "#";

/** The real, live Archer's Windows round — runs in this same app at "/archers". */
export const ARCHERS_WINDOWS_LIVE_URL = "/archers";

/** YouTube/Loom embed URL for the 60-second demo video. */
export const DEMO_VIDEO_EMBED_URL = "#";

/** WhatsApp number in international format, e.g. "447123456789" (no plus, no spaces). */
export const CONTACT_WHATSAPP_NUMBER = "447861518692";

export const CONTACT_EMAIL = "hello@getroundmate.co.uk";

export function whatsAppLink(message: string) {
  if (!CONTACT_WHATSAPP_NUMBER) return "#";
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
