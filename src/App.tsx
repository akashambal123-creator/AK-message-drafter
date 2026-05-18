import { useState, CSSProperties } from "react";

const GEMINI_KEY = "YOUR_GEMINI_KEY_HERE";

const SCENARIOS = [
  "Follow-up", "Cold outreach", "Apology", "Negotiation",
  "Declining a request", "Giving feedback", "Asking for something",
  "Setting boundaries", "Responding to feedback", "Delivering bad news",
  "Celebrating / congratulating", "Clarifying a misunderstanding", "Delegating"
];

const CHANNELS = [
  { value: "email", label: "✉ Email", color: "#7F77DD", light: "#EEEDFE" },
  { value: "slack", label: "# Slack", color: "#1D9E75", light: "#E1F5EE" },
  { value: "sms", label: "✆ SMS", color: "#D85A30", light: "#FAECE7" },
  { value: "whatsapp", label: "💬 WhatsApp", color: "#25A244", light: "#E0F5E9" },
  { value: "telegram", label: "✈ Telegram", color: "#2A9FD6", light: "#E0F3FC" },
  { value: "teams", label: "🟦 Teams", color: "#4B53BC", light: "#EAEBFA" },
  { value: "instagram", label: "📸 Instagram", color: "#C2335E", light: "#FAE8EE" },
  { value: "short", label: "⚡ Short", color: "#BA7517", light: "#FAEEDA" },
  { value: "other", label: "⊕ Other", color: "#D4537E", light: "#FBEAF0" },
];

const TONES = [
  { label: "Professional", emoji: "💼" },
  { label: "Friendly", emoji: "😊" },
  { label: "Direct", emoji: "⚡" },
  { label: "Empathetic", emoji: "🤝" },
  { label: "Concise", emoji: "✂" },
];

const DRAFT_COLORS = [
  { bg: "#EEEDFE", border: "#AFA9EC", label: "#3C3489" },
  { bg: "#E1F5EE", border: "#5DCAA5", label: "#085041" },
  { bg: "#FAECE7", border: "#F0997B", label: "#4A1B0C" },
];

interface Draft {
  label: string;
  tradeoff: string;
  subject?: string;
  body: string;
}

export default function App() {
  const [channel, setChannel] = useState("email");
  const [scenario, setScenario] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isEmail = channel === "email";
  const isShort = ["short", "whatsapp", "telegram", "sms", "instagram"].includes(channel);

  async function generate() {
    if (!context.trim()) { setError("Please describe your situation first."); return; }
    setError("");
    setLoading(true);
    setDrafts([]);

    const channelLabel = CHANNELS.find(c => c.value === channel)?.label.replace(/^[^\w]+/, "") || channel;

    const prompt = `You are a message drafting assistant. Generate 2-3 strategic message variants for the user.
Channel: ${channelLabel}
${scenario ? `Scenario: ${scenario}` : ""}
Preferred tone: ${tone}
User's situation: ${context}
Instructions:
- Each variant should represent a DIFFERENT strategic approach.
- For each provide: a short label (3-5 words), a one-line trade-off note, ${isEmail ? "a subject line, " : ""}and the full message body.
- Keep Slack and Teams messages concise, SMS/WhatsApp/Instagram/Telegram very brief, emails appropriately detailed.
- ${isShort ? "SHORT MESSAGE mode: each message body must be 1-2 sentences max, under 30 words." : ""}
- Write in first person, ready to send.
- Respond ONLY with valid JSON array, no markdown:
[{"label":"...","tradeoff":"...",${isEmail ? '"subject":"...",' : ""}"body":"..."}]`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setDrafts(JSON.parse(clean));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Something went wrong: ${msg}`);
    }
    setLoading(false);
  }

  function copy(idx: number, text: string) {
    try { navigator.clipboard.writeText(text); } catch {}
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  const styles: Record<string, CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "#f7f7fb",
      padding: "16px",
      boxSizing: "border-box",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    card: {
      maxWidth: 680,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 16,
      padding: "20px 16px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      boxSizing: "border-box" as const,
      width: "100%",
    },
    label: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      color: "#aaa",
      margin: "0 0 8px",
      display: "block",
    },
    input: {
      width: "100%",
      boxSizing: "border-box" as const,
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: "10px 12px",
      fontSize: 15,
      background: "#fff",
      color: "#111",
      outline: "none",
    },
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        @media (max-width: 480px) {
          .channel-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tone-btn { padding: 6px 10px !important; font-size: 12px !important; }
          .card { padding: 16px 12px !important; border-radius: 12px !important; }
          .header-title { font-size: 17px !important; }
          .logo { width: 40px !important; height: 40px !important; }
          .cta-btn { font-size: 14px !important; padding: 11px !important; }
        }
      `}</style>
      <div style={styles.page}>
        <div style={styles.card} className="card">

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div className="logo" style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, #7F77DD 0%, #1D9E75 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(127,119,221,0.35)"
            }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <path d="M4 22L6.5 15.5L14 4L21.5 15.5L24 22H17.5L14 16L10.5 22H4Z" fill="white" fillOpacity="0.95"/>
                <circle cx="20" cy="8" r="4" fill="#FAEE8A"/>
                <path d="M18.5 8L19.5 9.2L21.8 6.5" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="header-title" style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#111" }}>
                <span style={{ color: "#7F77DD" }}>AK</span>_Message drafter
              </h2>
              <p style={{ fontSize: 13, color: "#888", margin: "3px 0 0" }}>
                Describe your situation → get smart drafts.
              </p>
            </div>
          </div>

          {/* Channel */}
          <div style={{ marginBottom: 18 }}>
            <span style={styles.label}>Channel</span>
            <div className="channel-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {CHANNELS.map(c => (
                <button key={c.value} onClick={() => setChannel(c.value)} style={{
                  padding: "9px 4px", fontSize: 12, fontWeight: channel === c.value ? 600 : 400,
                  borderRadius: 8,
                  border: channel === c.value ? `2px solid ${c.color}` : "1px solid #eee",
                  background: channel === c.value ? c.light : "#fafafa",
                  color: channel === c.value ? c.color : "#555",
                  cursor: "pointer", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div style={{ marginBottom: 18 }}>
            <span style={styles.label}>Tone</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TONES.map(t => (
                <button key={t.label} className="tone-btn" onClick={() => setTone(t.label)} style={{
                  padding: "7px 12px", fontSize: 13, borderRadius: 999,
                  border: tone === t.label ? "2px solid #7F77DD" : "1px solid #eee",
                  background: tone === t.label ? "#EEEDFE" : "#fafafa",
                  color: tone === t.label ? "#3C3489" : "#555",
                  cursor: "pointer", fontWeight: tone === t.label ? 600 : 400,
                }}>{t.emoji} {t.label}</button>
              ))}
            </div>
          </div>

          {/* Scenario */}
          <div style={{ marginBottom: 18 }}>
            <span style={styles.label}>Scenario <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></span>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={styles.input}>
              <option value="">Pick a scenario…</option>
              {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Context */}
          <div style={{ marginBottom: 20 }}>
            <span style={styles.label}>Your situation</span>
            <textarea rows={4} value={context} onChange={e => setContext(e.target.value)}
              placeholder="e.g. I need to follow up with a client who hasn't replied in 2 weeks…"
              style={{ ...styles.input, border: `1.5px solid ${error ? "#E24B4A" : "#ddd"}`, lineHeight: 1.6, resize: "vertical", minHeight: 100 }} />
            {error && <p style={{ fontSize: 12, color: "#E24B4A", margin: "4px 0 0" }}>{error}</p>}
          </div>

          {/* CTA */}
          <button className="cta-btn" onClick={generate} disabled={loading} style={{
            width: "100%", padding: "13px", fontSize: 15, fontWeight: 600,
            borderRadius: 10, border: "none",
            background: loading ? "#c5c2f0" : "linear-gradient(90deg, #7F77DD 0%, #1D9E75 100%)",
            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Crafting your drafts…" : "Generate drafts →"}
          </button>

          {/* Drafts */}
          {drafts.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <span style={styles.label}>Your drafts</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {drafts.map((d, i) => {
                  const col = DRAFT_COLORS[i % DRAFT_COLORS.length];
                  const fullText = isEmail && d.subject ? `Subject: ${d.subject}\n\n${d.body}` : d.body;
                  return (
                    <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${col.border}`, background: col.bg, overflow: "hidden" }}>
                      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${col.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: col.label, display: "block" }}>{d.label}</span>
                          <p style={{ fontSize: 12, color: col.label, opacity: 0.7, margin: "2px 0 0" }}>{d.tradeoff}</p>
                        </div>
                        <button onClick={() => copy(i, fullText)} style={{
                          fontSize: 12, padding: "5px 12px", borderRadius: 999, flexShrink: 0,
                          border: `1px solid ${col.border}`,
                          background: copied === i ? col.label : "transparent",
                          color: copied === i ? "#fff" : col.label,
                          cursor: "pointer", fontWeight: 600,
                        }}>
                          {copied === i ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        {isEmail && d.subject && (
                          <p style={{ fontSize: 13, fontWeight: 600, color: col.label, margin: "0 0 8px" }}>Subject: {d.subject}</p>
                        )}
                        <textarea readOnly value={fullText}
                          rows={Math.min(12, (d.body.match(/\n/g) || []).length + 4)}
                          style={{
                            width: "100%", boxSizing: "border-box" as const,
                            fontSize: 14, lineHeight: 1.7, color: col.label,
                            background: "transparent", border: `1px dashed ${col.border}`,
                            borderRadius: 8, padding: "8px 10px",
                            resize: "none" as const, outline: "none",
                            cursor: "text", fontFamily: "inherit",
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 24, marginBottom: 0 }}>
            Powered by AK_Message Drafter · Built with ❤️ by <span style={{ color: "#7F77DD", fontWeight: 600 }}>AKASH NETHAJI</span>
          </p>
        </div>
      </div>
    </>
  );
}