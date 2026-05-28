import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new session when user starts brainstorming
export const create = mutation({
  args: {
    email: v.string(),
    purpose: v.string(),
    systemType: v.string(),
    programPhase: v.string(),
    wbsElement: v.string(),
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      email: args.email,
      purpose: args.purpose,
      systemType: args.systemType,
      programPhase: args.programPhase,
      wbsElement: args.wbsElement,
      startedAt: now,
      lastActiveAt: now,
      exchangeCount: 0,
      status: "active",
    });
  },
});

// Bump exchange count + lastActiveAt on each AI reply
export const recordExchange = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    await ctx.db.patch(sessionId, {
      exchangeCount: session.exchangeCount + 1,
      lastActiveAt: Date.now(),
    });
    return null;
  },
});

// Mark session completed (when user clicks "New")
export const complete = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    await ctx.db.patch(sessionId, {
      status: "completed",
      lastActiveAt: Date.now(),
    });
    return null;
  },
});

// ── Admin queries ──

// All sessions, newest first
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("sessions"),
      _creationTime: v.number(),
      email: v.string(),
      purpose: v.string(),
      systemType: v.string(),
      programPhase: v.string(),
      wbsElement: v.string(),
      startedAt: v.number(),
      lastActiveAt: v.number(),
      exchangeCount: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_startedAt")
      .order("desc")
      .collect();
  },
});

// Summary stats
export const stats = query({
  args: {},
  returns: v.object({
    totalSessions: v.number(),
    totalExchanges: v.number(),
    uniqueUsers: v.number(),
    avgExchangesPerSession: v.number(),
    activeSessions: v.number(),
    purposeBreakdown: v.array(
      v.object({ purpose: v.string(), count: v.number() })
    ),
    phaseBreakdown: v.array(
      v.object({ phase: v.string(), count: v.number() })
    ),
    systemBreakdown: v.array(
      v.object({ system: v.string(), count: v.number() })
    ),
    dailySessions: v.array(
      v.object({ date: v.string(), count: v.number() })
    ),
  }),
  handler: async (ctx) => {
    const all = await ctx.db.query("sessions").collect();

    const totalSessions = all.length;
    const totalExchanges = all.reduce((s, r) => s + r.exchangeCount, 0);
    const uniqueUsers = new Set(all.map((r) => r.email)).size;
    const avgExchangesPerSession =
      totalSessions > 0
        ? Math.round((totalExchanges / totalSessions) * 10) / 10
        : 0;
    const activeSessions = all.filter((r) => r.status === "active").length;

    // Purpose breakdown
    const purposeMap = new Map<string, number>();
    for (const s of all) {
      purposeMap.set(s.purpose, (purposeMap.get(s.purpose) || 0) + 1);
    }
    const purposeBreakdown = [...purposeMap.entries()]
      .map(([purpose, count]) => ({ purpose, count }))
      .sort((a, b) => b.count - a.count);

    // Phase breakdown
    const phaseMap = new Map<string, number>();
    for (const s of all) {
      phaseMap.set(s.programPhase, (phaseMap.get(s.programPhase) || 0) + 1);
    }
    const phaseBreakdown = [...phaseMap.entries()]
      .map(([phase, count]) => ({ phase, count }))
      .sort((a, b) => b.count - a.count);

    // System breakdown
    const sysMap = new Map<string, number>();
    for (const s of all) {
      sysMap.set(s.systemType, (sysMap.get(s.systemType) || 0) + 1);
    }
    const systemBreakdown = [...sysMap.entries()]
      .map(([system, count]) => ({ system, count }))
      .sort((a, b) => b.count - a.count);

    // Daily sessions (last 30 days)
    const dailyMap = new Map<string, number>();
    for (const s of all) {
      const d = new Date(s.startedAt).toISOString().slice(0, 10);
      dailyMap.set(d, (dailyMap.get(d) || 0) + 1);
    }
    const dailySessions = [...dailyMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return {
      totalSessions,
      totalExchanges,
      uniqueUsers,
      avgExchangesPerSession,
      activeSessions,
      purposeBreakdown,
      phaseBreakdown,
      systemBreakdown,
      dailySessions,
    };
  },
});
