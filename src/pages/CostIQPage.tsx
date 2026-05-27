import { useAction, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

// ── V3 System Prompt ──
const SYSTEM_PROMPT = `You are a senior DoD cost estimator with 15+ years of experience across ACAT II and III programs spanning sustainment, development (RDT&E), procurement, and DevSecOps software efforts. You support Air Force, Space Force, Army, and Navy programs at the PEO and base level.

Your role: When a cost estimator comes to you stuck — no good data, facing a sufficiency review, or trying to figure out where to start — you are the senior colleague they brainstorm with. Direct, practical, no jargon for its own sake.

=== CRITICAL BEHAVIOR — IGCE PEDIGREE WALK-THROUGH ===

DO NOT jump straight to a methodology recommendation. Your FIRST job in every conversation is to walk the estimator through the IGCE data source pedigree from top to bottom, pushing them toward the highest-tier data they can realistically access. Only AFTER establishing what data is available do you discuss methodology. The methodology follows from the data — not the other way around.

IGCE DATA SOURCE PEDIGREE (best to worst — walk through each tier):

Tier 1: CSDR (Cost and SW Data Reporting)
  - Detailed WBS actuals with hours/$ and paired technical scope inputs
  - Scaling: all detailed inputs can be assessed and scaled for technical, scope, programmatic, size, complexity reasons
  - Rarely available for ACAT III, but ALWAYS ask. A similar ACAT I/II program may have CSDR data in CADE usable as an analogy.

Tier 2: IPMDAR / EVM
  - Similar to CSDR, WBS-based cost data, but tailored for EVM vice cost analysis
  - Scaling: all detailed inputs can be assessed and scaled
  - Ask: "Does this program or a similar one have EVM reporting?"

Tier 3: Contract Invoices
  - Sometimes useful, but not typically reported by scope-based WBS
  - Scaling: available inputs can be assessed and scaled
  - Ask: "Can you get invoice data from contracting? Even CLIN-level invoices are actuals."

Tier 4: Historical Obligation Actuals — CCAR & EDA/Ctr Mod Docs
  - High-level actuals by CLIN, paired with best understanding of funding changes/adds
  - Scaling: high-level analogous costs can be scaled for technical, scope, programmatic, size, complexity reasons
  - THIS IS THE MOST PRACTICALLY ACCESSIBLE SOURCE FOR ACAT III. Push hard here.
  - Ask: "Have you pulled CCAR data? What about EDA contract mod documents? Even high-level obligation data is actuals and that beats proposals."

Tier 5: Proposal Data from Completed Efforts
  - MUST verify proposal data tracks to final actual obligations in CCAR/EDA/Ctr Mod Docs. Assists in allowing more granularity in scaling actuals.
  - Scaling: available inputs can be assessed and scaled
  - CRITICAL: If estimator mentions proposal data, immediately ask whether they have verified it against actual obligations. Unverified proposal data is NOT a primary source. Push them to get the actuals first, then use proposals for granularity.

Tier 6: Proposal Data from Incomplete Efforts
  - RISKY — efforts are incomplete, proposals are not actuals
  - Push back explicitly: "Proposals from incomplete efforts are risky. A tech director will ask why you are anchoring to data that has not been validated by actual performance. Is there ANY completed effort you can use instead?"

Tier 7: Engineering Team Assessment of FTE/Duration
  - Reflects informed experience by engineering team, but should still be validated by historical actuals even if at a high level
  - THIS IS THE WEAKEST SOURCE. Do NOT let the estimator default here without exhausting higher tiers.
  - If the estimator jumps here: "Before we go to engineering assessment — that is the bottom of the pedigree. Let me walk you back up. Have you checked CCAR obligation data? Even rough actuals are stronger than an engineering estimate."

PEDIGREE WALK-THROUGH PROTOCOL:
1. Your FIRST questions must be about data availability. Start at Tier 1 and work down.
2. Ask explicitly: "What data do you currently have access to? Let me walk through the options from strongest to weakest."
3. For each tier, ask whether they have it or can get it. Do not skip tiers.
4. When they mention a data source, immediately identify its pedigree tier OUT LOUD: "That is Tier 4 — obligation actuals. Good. Before we anchor there, is there anything higher? Any CSDR data from a similar program in CADE?"
5. If they have multiple sources, RANK them explicitly: "Your CCAR actuals are primary. The proposal data is a cross-check only — never the anchor."
6. ONLY after establishing the best available data do you discuss methodology.
7. If the estimator tries to skip to methodology or jump to engineering build-up: "Hold on — let us figure out what data you have first. Engineering build-up is the methodology of last resort when no historical data exists at any tier. Let me walk you through what might be available before we go there."

=== END PEDIGREE WALK-THROUGH ===

O&S COST ELEMENT STRUCTURE (CES): 1.1 Unit-Level Manpower, 1.2 Unit Operations (fuel/POL/munitions/TDY), 1.3 Maintenance (consumables 1.3.1, DLRs 1.3.2, intermediate 1.3.3, depot scheduled 1.3.4.1, depot unscheduled 1.3.4.2, PHS&T 1.3.6), 1.4 Sustaining Support (training 1.4.1, support equipment 1.4.2, sustaining engineering 1.4.3, supply chain/CLS 1.4.4), 1.5 Continuing System Improvements, 1.6 Indirect Support.

RDT&E WBS (MIL-STD-881F): System Engineering & Integration, Hardware Development by subsystem, Software Development by CSCI, DT&E, OT&E, Program Management, Training, Data, Peculiar Support Equipment, Initial Spares, Industrial Facilities.

PROCUREMENT WBS: End Item/Prime Mission Product, IATC, SE&PM, Training, Data, Support Equipment, Initial Spares, Facilities.

DevSecOps (Software Acquisition Pathway DODI 5000.87): Agile Development Labor (Scrum teams, sprint velocity), Platform/Cloud Infrastructure (AWS GovCloud, Azure Gov, Platform One), CI/CD Pipeline & Toolchain, Security & ATO/cATO (often 20-30% of total), DevSecOps Toolchain licenses, Operations & SRE. Platform One/Iron Bank dramatically changes cost model vs. building your own software factory.

DATA SOURCES: CADE (restricted DoD), Haystack (DoD contracts), FPDS (public), PIEE (DoD procurement), Technomics Contract Database (proprietary), pricing proposals, Advana (DoD analytics), direct contractor inquiry, university SMEs, DTIC.

METHODOLOGY OPTIONS (choose AFTER establishing data availability — methodology follows from the data):
- Actuals-based (strongest — when Tier 1-4 data exists)
- Analogy (most common ACAT III — requires comparable program with actuals)
- Parametric (needs data depth — CERs from multiple data points)
- Learning curve (recurring production items)
- Story point velocity (Agile/DevSecOps)
- Engineering build-up (LAST RESORT — only when no historical data exists at any tier)
- SME opinion (weakest — document heavily, validate against any available actuals)

IPT FUNCTIONALS: Engineering (complexity, TRL, analogous systems), Logistics (maintenance concept, depot relationship), Contracting (contract history, FFP vs CPFF), Software (SLOC, sprint velocity, tech debt), Cyber (ATO type, STIG count), Budget (obligation rates, prior year actuals).

ESTIMATE PURPOSE:
IGCE — Focus on price reasonableness. Key question: what should the government pay? Sources: FPDS historical awards, GSA schedules, market surveys, commercial pricing. FAR 13.106/15.404. Sole source needs stronger justification. Common failure: estimating what program wants to spend vs. what market will bear.
SUFFICIENCY REVIEW — Focus on methodology defensibility. Key question: is the methodology appropriate and data adequate? Tech director at PEO/base level for ACAT III (NOT CAPE). Scrutinizes: scope clarity, methodology choice, data pedigree, cross checks from different program offices.

AAF PATHWAYS: MCA (traditional milestones, CSDR typically required), MTA Rapid Prototyping (≤5 years, OT authority, CSDR usually NOT required, prototype cost focus), MTA Rapid Fielding (≤5 years, OT, minimal reporting, production + sustainment focus), Software Acquisition Pathway (continuous delivery, no milestones, team velocity-based cost).

HOW TO RESPOND:
1. First message: ask 2-3 focused questions about DATA AVAILABILITY — start at the top of the pedigree. Do not ask about methodology yet.
2. PEDIGREE WALK-THROUGH: Systematically walk the estimator through the 7 tiers. Push for the highest tier they can access. Name the tiers explicitly.
3. RANK AND ADVOCATE: When estimator describes their data, rank it by pedigree tier out loud. If they have actuals AND proposals, say clearly: actuals are primary, proposals are cross-check only. Push back if they gravitate toward lower-tier data.
4. ONLY THEN discuss methodology — the methodology follows from the data available, not the other way around.
5. Present 3-4 concrete options with honest pros/cons
6. Specific data source recommendations — not generic, situation-specific
7. Specific IPT questions that get cost-relevant answers
8. Be honest when data probably doesn't exist
9. Call out dead ends: "That will not survive a sufficiency review because..."
10. Short paragraphs, plain language, direct
11. Always push on cross check: who estimated something similar from a different program office?
12. If the estimator wants to jump to engineering build-up or SME opinion without exploring higher tiers: PUSH BACK. "That is the bottom of the pedigree. A tech director will ask why you did not look for actuals first. Let us walk back up."`;

// ── Constants ──

const SYSTEM_TYPES = [
  "Aircraft — Fixed Wing","Aircraft — Rotary Wing / Helicopter","UAS / Unmanned Aerial System",
  "Ground Vehicle / Armored","Missile / Munition / Weapon System","Radar / EW / Sensor System",
  "C2 / Command & Control System","Communications System (SATCOM / Tactical)","ISR / Intelligence System",
  "Cyber / Information System","Space System / Satellite","Satellite Ground System",
  "Ship / Maritime Surface","Submarine","Software-Intensive System","Training System / Simulator",
  "Contractor Logistics Support (CLS)","Nuclear System","Other",
];

const PROGRAM_PHASES = [
  "Sustainment (O&S)",
  "MCA — Development / RDT&E (Milestone B→C)",
  "MCA — Production & Deployment (Post-Milestone C)",
  "MTA — Rapid Prototyping (≤5 years)",
  "MTA — Rapid Fielding (≤5 years)",
  "Software Acquisition Pathway (DevSecOps / Agile)",
  "Mixed — Development + Sustainment",
];

const PHASE_NOTES: Record<string, string | null> = {
  "Sustainment (O&S)": null,
  "MCA — Development / RDT&E (Milestone B→C)": "Traditional milestone pathway. CSDR typically required. WBS per MIL-STD-881F.",
  "MCA — Production & Deployment (Post-Milestone C)": "Traditional milestone pathway. Learning curve and production rate are key cost drivers.",
  "MTA — Rapid Prototyping (≤5 years)": "OT authority common — CSDR typically not required. Prototype cost focus, not full production.",
  "MTA — Rapid Fielding (≤5 years)": "Deploys proven technology. OT authority common. Cost focus on production lots and initial sustainment.",
  "Software Acquisition Pathway (DevSecOps / Agile)": "DODI 5000.87 pathway. No traditional milestones. Cost estimated by team composition and iteration cycles.",
  "Mixed — Development + Sustainment": "Life cycle estimate spanning development and sustainment phases.",
};

const WBS_BY_PHASE: Record<string, string[]> = {
  "Sustainment (O&S)": [
    "1.1 Unit-Level Manpower","1.2 Unit Operations (Fuel, POL, Munitions)",
    "1.3.1 Consumables & Repair Parts","1.3.2 Depot-Level Reparables (DLRs)",
    "1.3.3 Intermediate Maintenance","1.3.4.1 Depot Maintenance — Scheduled Overhaul",
    "1.3.4.2 Depot Maintenance — Unscheduled","1.3.6 PHS&T",
    "1.4.1 System Specific Training","1.4.2 Support Equipment Replacement & Repair",
    "1.4.3 Sustaining / Systems Engineering","1.4.4 Supply Chain Management / CLS",
    "1.5 Continuing System Improvements (Mods)","1.6 Indirect Support","Full O&S Estimate",
  ],
  "MCA — Development / RDT&E (Milestone B→C)": [
    "System Engineering & Integration (SE&I)","Hardware Development — Airframe / Platform",
    "Hardware Development — Propulsion","Hardware Development — Electronics / Avionics",
    "Hardware Development — Other Subsystems","Software Development (all CSCIs)",
    "Cybersecurity / IA Engineering","Development Test & Evaluation (DT&E)",
    "Operational Test & Evaluation (OT&E)","Program Management",
    "Training — Development Phase","Data / Technical Documentation",
    "Peculiar Support Equipment (PSE)","Common Support Equipment (CSE)",
    "Initial Spares & Repair Parts","Industrial Facilities & Equipment",
    "Full RDT&E Estimate — per MIL-STD-881F",
  ],
  "MCA — Production & Deployment (Post-Milestone C)": [
    "End Item / Prime Mission Product (per unit)","Integration, Assembly, Test & Checkout (IATC)",
    "Systems Engineering & Program Management","Training — Production Phase","Data",
    "Peculiar Support Equipment","Common Support Equipment","Initial Spares & Repair Parts",
    "Facilities","Full Procurement Estimate — per MIL-STD-881F",
  ],
  "MTA — Rapid Prototyping (≤5 years)": [
    "Prototype Unit(s) — Hardware / Software","System Engineering & Integration",
    "Software Development","Test & Evaluation (prototype-focused)","Program Management",
    "Data / Documentation (streamlined)","Support Equipment (prototype phase)",
    "Full Rapid Prototyping Estimate",
  ],
  "MTA — Rapid Fielding (≤5 years)": [
    "Production Units (proven technology)","Integration & Installation",
    "Systems Engineering & Program Management","Training","Initial Spares & Sustaining Support",
    "Data","Full Rapid Fielding Estimate",
  ],
  "Software Acquisition Pathway (DevSecOps / Agile)": [
    "Agile Development Labor (Scrum teams, Product Owners)",
    "Platform / Cloud Infrastructure (AWS GovCloud, Azure Gov)",
    "CI/CD Pipeline & Toolchain (GitLab, SonarQube, etc.)",
    "Platform One / Iron Bank Integration",
    "Security & ATO / cATO (STIG, scanning, pen test)",
    "Container Orchestration (Kubernetes, Docker)",
    "Operations & Site Reliability Engineering (SRE)",
    "Automated Testing & Security Scanning",
    "Program Management","Training & Onboarding",
    "Full DevSecOps Estimate — per DODI 5000.87 (illustrative)",
  ],
  "Mixed — Development + Sustainment": [
    "Development — System Engineering & Integration","Development — Hardware / Software Development",
    "Development — Test & Evaluation","Development — Program Management",
    "Transition — Initial Spares & Support Equipment","Sustainment — Consumables & Repair Parts",
    "Sustainment — Depot Maintenance","Sustainment — Sustaining Engineering",
    "Sustainment — CLS / Support Contract","Full Life Cycle Cost Estimate",
  ],
};

const PURPOSES = [
  { v:"igce", label:"IGCE", sub:"Independent Government Cost Estimate", desc:"Price reasonableness before contract award or modification" },
  { v:"sufficiency", label:"Sufficiency Review", sub:"Program Cost Estimate", desc:"Defending a program estimate to a technical director or cost chief" },
  { v:"both", label:"Both / Not Sure", sub:"", desc:"Cover both price reasonableness and estimate defensibility" },
];

const PLAYBOOK = [
  { label:"Idea", done:true },
  { label:"MVP", active:true },
  { label:"Launch" },
  { label:"Scale" },
];

// ── Types ──

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface Context {
  purpose: string;
  sys: string;
  progPhase: string;
  wbs: string;
  known: string;
}

// ── Styles ──

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Fira+Code:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1E3A5A;border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  .msg-in{animation:fadeUp 0.25s ease forwards}
  .pulse{animation:blink 0.9s ease-in-out infinite}
  .ciq-field{background:#0D1E35;border:1px solid #1E3A5A;border-radius:8px;color:#E2EAF4;font-size:13px;padding:9px 12px;width:100%;outline:none;transition:border 0.15s;font-family:inherit}
  .ciq-field:focus{border-color:#0EA5E9;box-shadow:0 0 0 3px rgba(14,165,233,0.08)}
  .ciq-field option{background:#0D1E35}
  textarea.ciq-field{resize:vertical;min-height:76px;line-height:1.6}
  .btn-p{background:#0EA5E9;border:none;color:#fff;padding:10px 22px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s}
  .btn-p:hover{background:#38BDF8;transform:translateY(-1px)}
  .btn-p:disabled{background:#1A2E45;color:#3A5570;cursor:not-allowed;transform:none}
  .btn-g{background:transparent;border:1px solid #1E3A5A;color:#7A9BBD;padding:6px 12px;border-radius:6px;font-family:inherit;font-size:12px;cursor:pointer;transition:all 0.15s}
  .btn-g:hover{border-color:#0EA5E9;color:#38BDF8}
`;

// ── Component ──

const EMAIL_KEY = "costiq_user_email";

export default function CostIQPage() {
  const sendMessage = useAction(api.chat.sendMessage);
  const registerVisitor = useMutation(api.visitors.register);

  const [phase, setPhase] = useState<"email" | "intake" | "chat">(() =>
    localStorage.getItem(EMAIL_KEY) ? "intake" : "email"
  );
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || "");
  const [emailError, setEmailError] = useState("");
  const [ctx, setCtx] = useState<Context>({ purpose:"", sys:"", progPhase:"Sustainment (O&S)", wbs:"", known:"" });
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const wbsOptions = WBS_BY_PHASE[ctx.progPhase] || WBS_BY_PHASE["Sustainment (O&S)"];

  async function submitEmail() {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    try { await registerVisitor({ email: trimmed }); } catch { /* ok */ }
    localStorage.setItem(EMAIL_KEY, trimmed);
    setPhase("intake");
  }

  useEffect(() => { setCtx(c => ({...c, wbs:""})); }, [ctx.progPhase]);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs, loading]);

  async function callAI(history: Array<{role:string;content:string}>) {
    try {
      const reply = await sendMessage({ system: SYSTEM_PROMPT, messages: history });
      return reply;
    } catch {
      return "Connection error — please retry.";
    }
  }

  async function startSession() {
    if (!ctx.purpose || !ctx.sys || !ctx.wbs) return;
    setPhase("chat");
    const purposeLabel = PURPOSES.find(p => p.v === ctx.purpose)?.label || "";
    const opening = `Estimate purpose: ${purposeLabel}. Working on a ${ctx.wbs} estimate for a ${ctx.sys} (${ctx.progPhase}).${ctx.known ? ` What I have: ${ctx.known}` : " I don't have much data yet."}`;
    const history = [{role:"user", content:opening}];
    setMsgs([{role:"user", content:opening, ts:Date.now()}]);
    setLoading(true);
    const reply = await callAI(history);
    setMsgs(prev => [...prev, {role:"assistant", content:reply, ts:Date.now()}]);
    setExchanges(1);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  async function send() {
    if (!inp.trim() || loading) return;
    const text = inp.trim();
    const newMsgs: Message[] = [...msgs, {role:"user", content:text, ts:Date.now()}];
    setMsgs(newMsgs);
    setInp("");
    setLoading(true);
    const reply = await callAI(newMsgs.map(m => ({role:m.role, content:m.content})));
    setMsgs(prev => [...prev, {role:"assistant", content:reply, ts:Date.now()}]);
    setExchanges(e => e+1);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const pc = ctx.progPhase.includes("Software") ? "#A78BFA"
    : ctx.progPhase.includes("RDT&E") ? "#F59E0B"
    : ctx.progPhase.includes("Production") ? "#34D399"
    : ctx.progPhase.includes("MTA") ? "#FB923C"
    : "#0EA5E9";

  return (
    <div style={{background:"#071426", minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:"#060F1E", borderBottom:"1px solid #0D1E35", padding:"11px 20px", display:"flex", alignItems:"center", gap:16, flexShrink:0}}>
        <div style={{display:"flex", alignItems:"center", gap:10, flex:1}}>
          <div style={{width:30, height:30, background:`linear-gradient(135deg,${pc},#0369A1)`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center"}}>
            <span style={{fontSize:14}}>⬡</span>
          </div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:"#E2EAF4", letterSpacing:"0.05em", textTransform:"uppercase" as const}}>CostIQ</div>
            <div style={{fontSize:9, color:"#2A4060", letterSpacing:"0.07em", textTransform:"uppercase" as const, fontFamily:"'Fira Code',monospace"}}>DoD Cost Brainstorming Partner</div>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:5}}>
          {PLAYBOOK.map((s,i) => (
            <div key={s.label} style={{display:"flex", alignItems:"center", gap:5}}>
              <div style={{display:"flex", alignItems:"center", gap:4}}>
                <div style={{width:16, height:16, borderRadius:"50%", border:`1.5px solid ${s.active?"#0EA5E9":s.done?"#10B981":"#1E3A5A"}`, background:s.active?"rgba(14,165,233,0.15)":s.done?"rgba(16,185,129,0.1)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  {s.done&&!s.active&&<span style={{fontSize:8,color:"#10B981"}}>✓</span>}
                  {s.active&&<div style={{width:5,height:5,borderRadius:"50%",background:"#0EA5E9"}}/>}
                </div>
                <span style={{fontSize:11, color:s.active?"#38BDF8":s.done?"#34D399":"#2A4060", fontWeight:s.active?600:400}}>{s.label}</span>
              </div>
              {i<PLAYBOOK.length-1&&<div style={{width:12,height:1,background:"#0D1E35"}}/>}
            </div>
          ))}
        </div>
        {phase==="chat"&&<button className="btn-g" onClick={()=>{setPhase("intake");setMsgs([]);setInp("");setCtx({purpose:"",sys:"",progPhase:"Sustainment (O&S)",wbs:"",known:""});setExchanges(0);}}>↩ New</button>}
        {phase!=="email"&&<span style={{fontSize:10,color:"#1E3A5A",fontFamily:"'Fira Code',monospace"}}>{email}</span>}
      </div>

      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>

        {/* EMAIL GATE */}
        {phase==="email"&&(
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
            <div style={{width:"100%", maxWidth:420, textAlign:"center"}}>
              <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:20, padding:"3px 10px", marginBottom:16}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#0EA5E9"}} className="pulse"/>
                <span style={{fontSize:10,color:"#38BDF8",fontFamily:"'Fira Code',monospace",letterSpacing:"0.05em"}}>SENIOR ANALYST ONLINE</span>
              </div>
              <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:700,color:"#E2EAF4",letterSpacing:"0.03em",marginBottom:8}}>Welcome to CostIQ</h1>
              <p style={{fontSize:13,color:"#4A6880",lineHeight:1.6,marginBottom:24}}>Your AI-powered DoD cost estimator brainstorming partner.<br/>Enter your email to get started.</p>
              <div style={{background:"#0B1A2E",border:"1px solid #152840",borderRadius:12,padding:24,display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{fontSize:10,color:"#3A6280",display:"block",marginBottom:6,textTransform:"uppercase" as const,letterSpacing:"0.07em",fontFamily:"'Fira Code',monospace",textAlign:"left"}}>Email address</label>
                  <input
                    className="ciq-field"
                    type="email"
                    value={email}
                    onChange={e=>{setEmail(e.target.value);setEmailError("");}}
                    onKeyDown={e=>{if(e.key==="Enter") submitEmail();}}
                    placeholder="you@agency.mil"
                    autoFocus
                  />
                  {emailError&&<p style={{fontSize:11,color:"#F87171",marginTop:6,textAlign:"left"}}>{emailError}</p>}
                </div>
                <button className="btn-p" style={{width:"100%",padding:"12px"}} onClick={submitEmail}>
                  Continue →
                </button>
              </div>
              <p style={{fontSize:10,color:"#152840",marginTop:12,fontFamily:"'Fira Code',monospace"}}>PROTOTYPE · UNCLASSIFIED / NON-CUI USE ONLY</p>
            </div>
          </div>
        )}

        {/* INTAKE */}
        {phase==="intake"&&(
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflowY:"auto"}}>
            <div style={{width:"100%", maxWidth:560}}>
              <div style={{textAlign:"center", marginBottom:24}}>
                <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:20, padding:"3px 10px", marginBottom:12}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#0EA5E9"}} className="pulse"/>
                  <span style={{fontSize:10,color:"#38BDF8",fontFamily:"'Fira Code',monospace",letterSpacing:"0.05em"}}>SENIOR ANALYST ONLINE</span>
                </div>
                <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:700,color:"#E2EAF4",letterSpacing:"0.03em",marginBottom:6}}>What are you estimating?</h1>
                <p style={{fontSize:13,color:"#4A6880",lineHeight:1.6}}>Describe your situation and I'll help you think through data sources, methodology, and IPT questions.</p>
              </div>

              <div style={{background:"#0B1A2E",border:"1px solid #152840",borderRadius:12,padding:20,display:"flex",flexDirection:"column",gap:14}}>

                {/* Purpose */}
                <div>
                  <label style={{fontSize:10,color:"#3A6280",display:"block",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:"0.07em",fontFamily:"'Fira Code',monospace"}}>What is this estimate for? *</label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {PURPOSES.map(p=>(
                      <div key={p.v} onClick={()=>setCtx(c=>({...c,purpose:p.v}))} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:`1px solid ${ctx.purpose===p.v?"#0EA5E9":"#1E3A5A"}`,borderRadius:8,cursor:"pointer",background:ctx.purpose===p.v?"rgba(14,165,233,0.08)":"transparent",transition:"all 0.15s"}}>
                        <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${ctx.purpose===p.v?"#0EA5E9":"#2A4060"}`,background:ctx.purpose===p.v?"#0EA5E9":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {ctx.purpose===p.v&&<div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}
                        </div>
                        <div>
                          <div style={{display:"flex",alignItems:"baseline",gap:7}}>
                            <span style={{fontSize:13,fontWeight:600,color:ctx.purpose===p.v?"#E2EAF4":"#7A9BBD"}}>{p.label}</span>
                            {p.sub&&<span style={{fontSize:11,color:"#4A6880"}}>{p.sub}</span>}
                          </div>
                          <div style={{fontSize:11,color:"#3A5570",marginTop:1}}>{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System + Phase */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <label style={{fontSize:10,color:"#3A6280",display:"block",marginBottom:5,textTransform:"uppercase" as const,letterSpacing:"0.07em",fontFamily:"'Fira Code',monospace"}}>System type *</label>
                    <select className="ciq-field" value={ctx.sys} onChange={e=>setCtx({...ctx,sys:e.target.value})}>
                      <option value="">— select —</option>
                      {SYSTEM_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:"#3A6280",display:"block",marginBottom:5,textTransform:"uppercase" as const,letterSpacing:"0.07em",fontFamily:"'Fira Code',monospace"}}>Program phase / AAF pathway</label>
                    <select className="ciq-field" value={ctx.progPhase} onChange={e=>setCtx({...ctx,progPhase:e.target.value,wbs:""})} style={{borderColor:ctx.progPhase.includes("Software")?"rgba(167,139,250,0.4)":ctx.progPhase.includes("MTA")?"rgba(251,146,60,0.4)":ctx.progPhase.includes("MCA")?"rgba(245,158,11,0.4)":"#1E3A5A"}}>
                      {PROGRAM_PHASES.map(p=><option key={p}>{p}</option>)}
                    </select>
                    {PHASE_NOTES[ctx.progPhase]&&<p style={{fontSize:10,color:"#4A7090",marginTop:4,lineHeight:1.5,fontFamily:"'Fira Code',monospace"}}>{PHASE_NOTES[ctx.progPhase]}</p>}
                  </div>
                </div>

                {/* WBS */}
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <label style={{fontSize:10,color:"#3A6280",textTransform:"uppercase" as const,letterSpacing:"0.07em",fontFamily:"'Fira Code',monospace"}}>Cost element / WBS area *</label>
                    <span style={{fontSize:9,fontFamily:"'Fira Code',monospace",padding:"1px 6px",borderRadius:3,background:`${pc}15`,border:`1px solid ${pc}30`,color:pc}}>
                      {ctx.progPhase.includes("O&S")?"O&S CES":ctx.progPhase.includes("RDT&E")?"MIL-STD-881F":ctx.progPhase.includes("Production")?"MIL-STD-881F":ctx.progPhase.includes("MTA")?"MTA":ctx.progPhase.includes("Software")?"DODI 5000.87":"Mixed WBS"}
                    </span>
                  </div>
                  <select className="ciq-field" value={ctx.wbs} onChange={e=>setCtx({...ctx,wbs:e.target.value})}>
                    <option value="">— select cost element —</option>
                    {wbsOptions.map(w=><option key={w}>{w}</option>)}
                  </select>
                </div>

                {/* Known */}
                <div>
                  <label style={{fontSize:10,color:"#3A6280",display:"block",marginBottom:5,textTransform:"uppercase" as const,letterSpacing:"0.07em",fontFamily:"'Fira Code',monospace"}}>
                    What do you have so far? <span style={{color:"#1E3A5A",textTransform:"none" as const,letterSpacing:0,fontFamily:"'DM Sans',sans-serif"}}>optional</span>
                  </label>
                  <textarea className="ciq-field" value={ctx.known} onChange={e=>setCtx({...ctx,known:e.target.value})} placeholder={ctx.progPhase.includes("Software")?"e.g. 4-person Agile team on Platform One, no velocity history, need 18 months plus cATO...":ctx.progPhase.includes("MTA")?"e.g. OT authority, 3-year prototype timeline, no CSDR required...":"e.g. CCAR obligation actuals FY20-23 but CLIN-level only, 3000-hour overhaul interval, no CSDR..."}/>
                </div>

                <button className="btn-p" style={{width:"100%",padding:"12px"}} onClick={startSession} disabled={!ctx.purpose||!ctx.sys||!ctx.wbs}>
                  Start brainstorming →
                </button>
              </div>
              <p style={{textAlign:"center",fontSize:10,color:"#152840",marginTop:10,fontFamily:"'Fira Code',monospace"}}>PROTOTYPE · UNCLASSIFIED / NON-CUI USE ONLY</p>
            </div>
          </div>
        )}

        {/* CHAT */}
        {phase==="chat"&&(
          <>
            <div style={{background:"#060F1E",borderBottom:"1px solid #0B1929",padding:"7px 20px",display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
              {[PURPOSES.find(p=>p.v===ctx.purpose)?.label, ctx.sys, ctx.wbs, ctx.progPhase].filter(Boolean).map((tag,i)=>(
                <span key={i} style={{fontSize:11,fontFamily:"'Fira Code',monospace",padding:"2px 7px",borderRadius:4,background:i===3?`${pc}15`:"rgba(14,165,233,0.08)",border:`1px solid ${i===3?pc+"30":"rgba(14,165,233,0.15)"}`,color:i===3?pc:"#38BDF8"}}>{tag}</span>
              ))}
              <span style={{marginLeft:"auto",fontSize:10,color:"#1E3A5A",fontFamily:"'Fira Code',monospace"}}>{exchanges} exchange{exchanges!==1?"s":""}</span>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"18px 20px 0"}}>
              <div style={{maxWidth:680,margin:"0 auto",display:"flex",flexDirection:"column",gap:16}}>
                {msgs.map((m,i)=>(
                  <div key={i} className="msg-in" style={{display:"flex",gap:10,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
                    <div style={{width:30,height:30,background:m.role==="assistant"?`linear-gradient(135deg,${pc},#0369A1)`:"#0D1E35",border:m.role==="user"?"1px solid #1E3A5A":"none",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,fontSize:14}}>
                      {m.role==="assistant"?"⬡":"👤"}
                    </div>
                    <div style={{maxWidth:"80%"}}>
                      <div style={{fontSize:9,color:"#2A4060",marginBottom:4,fontFamily:"'Fira Code',monospace",letterSpacing:"0.04em",textAlign:m.role==="user"?"right":"left"}}>
                        {m.role==="assistant"?"SENIOR ANALYST":"YOU"} · {new Date(m.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                      </div>
                      <div style={{background:m.role==="assistant"?"#0B1929":"#0A2040",border:`1px solid ${m.role==="assistant"?"#152840":"#1E3A5A"}`,borderRadius:m.role==="assistant"?"3px 10px 10px 10px":"10px 3px 10px 10px",padding:"11px 14px",fontSize:13,lineHeight:1.7,color:"#C8DCF0",whiteSpace:"pre-wrap",position:"relative"}}>
                        {m.role==="assistant"&&<div style={{position:"absolute",left:0,top:6,bottom:6,width:2.5,background:pc,borderRadius:"0 2px 2px 0",opacity:0.7}}/>}
                        <div style={{paddingLeft:m.role==="assistant"?6:0}}>{m.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading&&(
                  <div className="msg-in" style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:30,height:30,background:`linear-gradient(135deg,${pc},#0369A1)`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>⬡</div>
                    <div style={{background:"#0B1929",border:"1px solid #152840",borderRadius:"3px 10px 10px 10px",padding:"13px 16px",display:"flex",gap:5,alignItems:"center"}}>
                      {[0,1,2].map(i=><div key={i} className="pulse" style={{width:6,height:6,borderRadius:"50%",background:pc,animationDelay:`${i*0.2}s`,opacity:0.6}}/>)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} style={{height:16}}/>
              </div>
            </div>

            <div style={{background:"#060F1E",borderTop:"1px solid #0B1929",padding:"12px 20px",flexShrink:0}}>
              <div style={{maxWidth:680,margin:"0 auto",display:"flex",gap:10}}>
                <textarea ref={inputRef} className="ciq-field" value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Describe your situation, share what you found, or ask a follow-up..." rows={2} style={{flex:1,minHeight:"unset",resize:"none",lineHeight:1.5}} disabled={loading}/>
                <button className="btn-p" onClick={send} disabled={!inp.trim()||loading} style={{alignSelf:"flex-end",padding:"10px 16px",flexShrink:0}}>→</button>
              </div>
              <div style={{maxWidth:680,margin:"5px auto 0",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:9,color:"#152840",fontFamily:"'Fira Code',monospace"}}>ENTER to send · SHIFT+ENTER for new line</span>
                <span style={{fontSize:9,color:"#152840",fontFamily:"'Fira Code',monospace"}}>NON-CUI ONLY</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
