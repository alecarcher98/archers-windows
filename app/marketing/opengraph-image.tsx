import { ImageResponse } from "next/og";

export const alt = "RoundMate — your round, simplified";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [
  { name: "Mrs Johnson", sub: "Oak Avenue", tone: "paid" as const },
  { name: "Mr Patel", sub: "Oak Avenue", tone: "due" as const },
  { name: "Mrs Carter", sub: "Oak Avenue", tone: "due" as const },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff1e8 0%, #ffffff 65%)",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "70px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: "520px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "999px",
                background: "#c2410c",
                color: "#fff",
                fontSize: "22px",
                fontWeight: 700,
                padding: "10px 24px",
              }}
            >
              RoundMate
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "54px",
                fontWeight: 800,
                color: "#18181b",
                marginTop: "28px",
                lineHeight: 1.15,
              }}
            >
              Your round, simplified.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "28px",
                color: "#52525b",
                marginTop: "20px",
              }}
            >
              Who&rsquo;s due, who&rsquo;s paid — on your phone.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "300px",
              borderRadius: "44px",
              border: "10px solid #18181b",
              background: "#18181b",
              padding: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "34px",
                background: "#fff",
                padding: "24px 20px",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Tuesday · 3 jobs
              </div>
              {ROWS.map((row) => (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#fafafa",
                    borderRadius: "16px",
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: "18px", fontWeight: 700, color: "#18181b" }}>
                      {row.name}
                    </div>
                    <div style={{ display: "flex", fontSize: "14px", color: "#71717a" }}>{row.sub}</div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "999px",
                      padding: "6px 14px",
                      background: row.tone === "paid" ? "#d1fae5" : "#fef3c7",
                      color: row.tone === "paid" ? "#065f46" : "#92400e",
                    }}
                  >
                    {row.tone === "paid" ? "Paid" : "Due"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
