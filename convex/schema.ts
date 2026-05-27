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
});

export default schema;
