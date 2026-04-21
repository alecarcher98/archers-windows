import { NextResponse } from "next/server";
import { CUSTOMER_CSV_HEADER, customerToCsvRow } from "@/lib/customerUtils";
import { getCustomersByIds, listCustomerIds } from "@/lib/kv";

export async function GET() {
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  customers.sort((a, b) => a.name.localeCompare(b.name));
  const lines = [CUSTOMER_CSV_HEADER, ...customers.map((c) => customerToCsvRow(c).map(escapeCsv).join(","))];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="customers.csv"',
    },
  });
}

function escapeCsv(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replaceAll('"', '""')}"`;
  }
  return v;
}
