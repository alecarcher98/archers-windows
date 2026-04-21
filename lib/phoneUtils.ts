export function mapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Google Maps directions with multiple stops (first = origin, last = destination) */
export function dayRouteHref(addresses: string[]) {
  const uniq = addresses.filter(Boolean);
  if (uniq.length === 0) return mapsHref("");
  if (uniq.length === 1) return mapsHref(uniq[0]);
  const path = uniq.map((a) => encodeURIComponent(a)).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}

export function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
