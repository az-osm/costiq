import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const register = mutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, { email }) => {
    const normalised = email.trim().toLowerCase();
    const existing = await ctx.db
      .query("visitors")
      .withIndex("by_email", (q) => q.eq("email", normalised))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        sessions: existing.sessions + 1,
      });
    } else {
      await ctx.db.insert("visitors", {
        email: normalised,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        sessions: 1,
      });
    }
    return null;
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("visitors"),
      _creationTime: v.number(),
      email: v.string(),
      firstSeen: v.number(),
      lastSeen: v.number(),
      sessions: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("visitors").order("desc").collect();
  },
});
