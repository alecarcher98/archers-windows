/**
 * Single place to wire up the RoundMate marketing site once the real
 * links exist. Edit the values below — nothing else needs to change.
 */

/**
 * The £99 setup fee is taken via a Stripe Payment Link sent manually inside
 * the WhatsApp chat once you've got a lead's customer list — not a site
 * button. Every "£99" CTA on the site links to WhatsApp instead.
 */

/** The real, live Archer's Windows round — runs in this same app at "/archers". */
export const ARCHERS_WINDOWS_LIVE_URL = "/archers";

/** WhatsApp number in international format, e.g. "447123456789" (no plus, no spaces). */
export const CONTACT_WHATSAPP_NUMBER = "447861518692";

export function whatsAppLink(message: string) {
  if (!CONTACT_WHATSAPP_NUMBER) return "#";
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
