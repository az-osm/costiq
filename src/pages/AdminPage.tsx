import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

const ADMIN_PIN = "costiq2026";
const PIN_KEY = "costiq_admin";

function fmt(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ago(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function dur(start: number, end: number) {
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

const PURPOSE_LABELS: Record<string, string> = {
  igce: "IGCE",
  sufficiency: "Sufficiency",
  both: "Both",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Fira+Code:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1E3A5A;border-radius:2px}
`;

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(PIN_KEY) === "1");
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");

  function tryPin() {
    if (pin === ADMIN_PIN) {
      localStorage.setItem(PIN_KEY, "1");
      setAuthed(true);
    } else {
      setPinErr("Incorrect PIN");
    }
  }

  if (!authed) {
    return (
      <div style={{ background: "#071426", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, color: "#E2EAF4", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>CostIQ Admin</h1>
          <div style={{ background: "#0B1A2E", border: "1px solid #152840", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinErr(""); }}
              onKeyDown={e => { if (e.key === "Enter") tryPin(); }}
              placeholder="Enter admin PIN"
              autoFocus
              style={{ background: "#0D1E35", border: "1px solid #1E3A5A", borderRadius: 8, color: "#E2EAF4", fontSize: 14, padding: "10px 14px", outline: "none", width: "100%", fontFamily: "inherit", textAlign: "center", letterSpacing: "0.15em" }}
            />
            {pinErr && <p style={{ fontSize: 12, color: "#F87171" }}>{pinErr}</p>}
            <button onClick={tryPin} style={{ background: "#0EA5E9", border: "none", color: "#fff", padding: "10px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Enter</button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const stats = useQuery(api.sessions.stats);
  const sessions = useQuery(api.sessions.list);
  const visitors = useQuery(api.visitors.list);
  const [tab, setTab] = useState<"overview" | "sessions" | "visitors">("overview");

  const cardStyle = (accent: string) => ({
    background: "#0B1A2E",
    border: "1px solid #152840",
    borderRadius: 12,
    padding: "18px 20px",
    borderTop: `3px solid ${accent}`,
  });

  const labelStyle = {
    fontSize: 10,
    color: "#3A6280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    fontFamily: "'Fira Code',monospace",
    marginBottom: 4,
  };

  const bigNum = {
    fontSize: 32,
    fontWeight: 700,
    fontFamily: "'Barlow Condensed',sans-serif",
    color: "#E2EAF4",
    lineHeight: 1.1,
  };

  return (
    <div style={{ background: "#071426", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: "#060F1E", borderBottom: "1px solid #0D1E35", padding: "11px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#A78BFA,#0369A1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>📊</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: "#E2EAF4", letterSpacing: "0.05em", textTransform: "uppercase" }}>CostIQ Admin</div>
            <div style={{ fontSize: 9, color: "#2A4060", letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "'Fira Code',monospace" }}>Measurement Dashboard</div>
          </div>
        </div>
        <a href="/" style={{ fontSize: 12, color: "#4A6880", textDecoration: "none", fontFamily: "'Fira Code',monospace" }}>← Back to CostIQ</a>
      </div>

      {/* Tabs */}
      <div style={{ padding: "12px 20px 0", display: "flex", gap: 4 }}>
        {(["overview", "sessions", "visitors"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? "rgba(14,165,233,0.12)" : "transparent",
              border: `1px solid ${tab === t ? "rgba(14,165,233,0.3)" : "#152840"}`,
              color: tab === t ? "#38BDF8" : "#4A6880",
              padding: "6px 14px",
              borderRadius: "8px 8px 0 0",
              fontSize: 12,
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px", maxWidth: 1000, margin: "0 auto" }}>

        {/* OVERVIEW TAB */}
        {tab === "overview" && stats && (
          <>
            {/* KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              <div style={cardStyle("#0EA5E9")}>
                <div style={labelStyle}>Total Sessions</div>
                <div style={bigNum}>{stats.totalSessions}</div>
              </div>
              <div style={cardStyle("#10B981")}>
                <div style={labelStyle}>Unique Users</div>
                <div style={bigNum}>{stats.uniqueUsers}</div>
              </div>
              <div style={cardStyle("#F59E0B")}>
                <div style={labelStyle}>Total Exchanges</div>
                <div style={bigNum}>{stats.totalExchanges}</div>
              </div>
              <div style={cardStyle("#A78BFA")}>
                <div style={labelStyle}>Avg Exchanges / Session</div>
                <div style={bigNum}>{stats.avgExchangesPerSession}</div>
              </div>
              <div style={cardStyle("#FB923C")}>
                <div style={labelStyle}>Active Now</div>
                <div style={bigNum}>{stats.activeSessions}</div>
              </div>
            </div>

            {/* Breakdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {/* Purpose */}
              <div style={cardStyle("#0EA5E9")}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>By Purpose</div>
                {stats.purposeBreakdown.length === 0 && <div style={{ fontSize: 12, color: "#2A4060" }}>No data yet</div>}
                {stats.purposeBreakdown.map(r => (
                  <div key={r.purpose} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#7A9BBD" }}>{PURPOSE_LABELS[r.purpose] || r.purpose}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: Math.max(20, (r.count / (stats.totalSessions || 1)) * 80), height: 6, borderRadius: 3, background: "#0EA5E9" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4", fontFamily: "'Fira Code',monospace", minWidth: 24, textAlign: "right" }}>{r.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phase */}
              <div style={cardStyle("#10B981")}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>By Phase</div>
                {stats.phaseBreakdown.length === 0 && <div style={{ fontSize: 12, color: "#2A4060" }}>No data yet</div>}
                {stats.phaseBreakdown.map(r => {
                  const short = r.phase.split("—")[0].trim().replace(/\s*\(.*/, "");
                  return (
                    <div key={r.phase} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#7A9BBD", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }} title={r.phase}>{short}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: Math.max(20, (r.count / (stats.totalSessions || 1)) * 80), height: 6, borderRadius: 3, background: "#10B981" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4", fontFamily: "'Fira Code',monospace", minWidth: 24, textAlign: "right" }}>{r.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* System */}
              <div style={cardStyle("#F59E0B")}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>By System</div>
                {stats.systemBreakdown.length === 0 && <div style={{ fontSize: 12, color: "#2A4060" }}>No data yet</div>}
                {stats.systemBreakdown.slice(0, 8).map(r => {
                  const short = r.system.split("—")[0].trim().split("/")[0].trim();
                  return (
                    <div key={r.system} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#7A9BBD", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }} title={r.system}>{short}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: Math.max(20, (r.count / (stats.totalSessions || 1)) * 80), height: 6, borderRadius: 3, background: "#F59E0B" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4", fontFamily: "'Fira Code',monospace", minWidth: 24, textAlign: "right" }}>{r.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily chart */}
            {stats.dailySessions.length > 0 && (
              <div style={cardStyle("#0EA5E9")}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>Daily Sessions (last 30 days)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
                  {stats.dailySessions.map(d => {
                    const max = Math.max(...stats.dailySessions.map(x => x.count), 1);
                    const h = Math.max(4, (d.count / max) * 90);
                    return (
                      <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${d.date}: ${d.count} sessions`}>
                        <span style={{ fontSize: 8, color: "#4A6880", fontFamily: "'Fira Code',monospace" }}>{d.count}</span>
                        <div style={{ width: "100%", height: h, background: "linear-gradient(to top, #0369A1, #0EA5E9)", borderRadius: "3px 3px 0 0", minWidth: 6 }} />
                        <span style={{ fontSize: 7, color: "#1E3A5A", fontFamily: "'Fira Code',monospace", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* SESSIONS TAB */}
        {tab === "sessions" && sessions && (
          <div style={cardStyle("#0EA5E9")}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>All Sessions ({sessions.length})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E3A5A" }}>
                    {["User", "Purpose", "System", "Phase", "WBS", "Exchanges", "Duration", "Started", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, color: "#3A6280", fontFamily: "'Fira Code',monospace", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s._id} style={{ borderBottom: "1px solid #0D1E35" }}>
                      <td style={{ padding: "8px 10px", color: "#7A9BBD", fontFamily: "'Fira Code',monospace", fontSize: 11 }}>{s.email.split("@")[0]}</td>
                      <td style={{ padding: "8px 10px", color: "#7A9BBD" }}>{PURPOSE_LABELS[s.purpose] || s.purpose}</td>
                      <td style={{ padding: "8px 10px", color: "#7A9BBD", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.systemType}>{s.systemType.split("—")[0].trim()}</td>
                      <td style={{ padding: "8px 10px", color: "#7A9BBD", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.programPhase}>{s.programPhase.split("—")[0].trim().replace(/\s*\(.*/, "")}</td>
                      <td style={{ padding: "8px 10px", color: "#7A9BBD", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.wbsElement}>{s.wbsElement}</td>
                      <td style={{ padding: "8px 10px", color: "#E2EAF4", fontWeight: 600, fontFamily: "'Fira Code',monospace", textAlign: "center" }}>{s.exchangeCount}</td>
                      <td style={{ padding: "8px 10px", color: "#4A6880", fontFamily: "'Fira Code',monospace", fontSize: 11 }}>{dur(s.startedAt, s.lastActiveAt)}</td>
                      <td style={{ padding: "8px 10px", color: "#4A6880", fontSize: 11 }} title={fmt(s.startedAt)}>{ago(s.startedAt)}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{
                          fontSize: 10, fontFamily: "'Fira Code',monospace", padding: "2px 6px", borderRadius: 4,
                          background: s.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(14,165,233,0.08)",
                          border: `1px solid ${s.status === "active" ? "rgba(16,185,129,0.3)" : "rgba(14,165,233,0.15)"}`,
                          color: s.status === "active" ? "#34D399" : "#38BDF8",
                        }}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 20, textAlign: "center", color: "#2A4060" }}>No sessions yet — data will appear once users start brainstorming.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISITORS TAB */}
        {tab === "visitors" && visitors && (
          <div style={cardStyle("#10B981")}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>All Visitors ({visitors.length})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E3A5A" }}>
                    {["Email", "First Seen", "Last Seen", "Visits"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, color: "#3A6280", fontFamily: "'Fira Code',monospace", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.map(v => (
                    <tr key={v._id} style={{ borderBottom: "1px solid #0D1E35" }}>
                      <td style={{ padding: "8px 10px", color: "#7A9BBD", fontFamily: "'Fira Code',monospace", fontSize: 11 }}>{v.email}</td>
                      <td style={{ padding: "8px 10px", color: "#4A6880", fontSize: 11 }}>{fmt(v.firstSeen)}</td>
                      <td style={{ padding: "8px 10px", color: "#4A6880", fontSize: 11 }} title={fmt(v.lastSeen)}>{ago(v.lastSeen)}</td>
                      <td style={{ padding: "8px 10px", color: "#E2EAF4", fontWeight: 600, fontFamily: "'Fira Code',monospace", textAlign: "center" }}>{v.sessions}</td>
                    </tr>
                  ))}
                  {visitors.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#2A4060" }}>No visitors yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loading state */}
        {(!stats || !sessions || !visitors) && (
          <div style={{ textAlign: "center", padding: 40, color: "#2A4060" }}>Loading...</div>
        )}
      </div>
    </div>
  );
}
