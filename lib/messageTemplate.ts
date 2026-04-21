import type { AppSettings } from "@/lib/models";
import { formatDisplayDate } from "@/lib/formatDate";

export function formatHouseValue(pricePence: number) {
  return `£${(pricePence / 100).toFixed(2)}`;
}

/** Used in SMS templates ({todayDate}, etc.) */
export function formatTodayDate(isoDate: string) {
  return formatDisplayDate(isoDate);
}

export function timeOfDayGreeting(tz = "Europe/London") {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(
      new Date(),
    ),
  );
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export type MessageVars = {
  greeting: string;
  todayDate: string;
  houseValue: string;
  businessName: string;
  customerName: string;
  address: string;
  phone: string;
};

export function renderMessageTemplate(template: string, vars: MessageVars) {
  let out = template;
  const pairs: [string, string][] = [
    ["{{greeting}}", vars.greeting],
    ["{{todayDate}}", vars.todayDate],
    ["{{houseValue}}", vars.houseValue],
    ["{{businessName}}", vars.businessName],
    ["{{customerName}}", vars.customerName],
    ["{{address}}", vars.address],
    ["{{phone}}", vars.phone],
    ["{greeting}", vars.greeting],
    ["{todayDate}", vars.todayDate],
    ["{houseValue}", vars.houseValue],
    ["{businessName}", vars.businessName],
    ["{customerName}", vars.customerName],
    ["{date}", vars.todayDate],
    ["{address}", vars.address],
    ["{phone}", vars.phone],
  ];
  for (const [key, val] of pairs) out = out.replaceAll(key, val);
  return out;
}

export function buildCustomerMessage(
  settings: AppSettings,
  isoDate: string,
  pricePence: number,
  customerName: string,
  address: string,
  phone = "",
) {
  return renderMessageTemplate(settings.smsTemplate, {
    greeting: timeOfDayGreeting(),
    todayDate: formatTodayDate(isoDate),
    houseValue: formatHouseValue(pricePence),
    businessName: settings.businessName,
    customerName,
    address,
    phone,
  });
}
