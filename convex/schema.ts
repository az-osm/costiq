import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  visitors: defineTable({
    email: v.string(),
    firstSeen: v.number(),
    lastSeen: v.number(),
    sessions: v.number(),
  }).index("by_email", ["email"]),

  // Session tracking for measurement framework
  sessions: defineTable({
    email: v.string(),
    purpose: v.string(),         // igce | sufficiency | both
    systemType: v.string(),
    programPhase: v.string(),
    wbsElement: v.string(),
    startedAt: v.number(),
    lastActiveAt: v.number(),
    exchangeCount: v.number(),
    status: v.string(),          // active | completed
  })
    .index("by_email", ["email"])
    .index("by_startedAt", ["startedAt"])
    .index("by_status", ["status"]),
});

export default schema;
