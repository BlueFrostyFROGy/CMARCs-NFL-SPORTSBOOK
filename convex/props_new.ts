import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPropById = query({
  args: { propId: v.id("props") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.propId);
  },
});

export const getPropsByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("props")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const getAllProps = query({
  handler: async (ctx) => {
    return await ctx.db.query("props").collect();
  },
});

export const createProp = mutation({
  args: {
    gameId: v.id("games"),
    externalGameId: v.string(),
    type: v.string(),
    description: v.string(),
    over: v.number(),
    under: v.number(),
    currentLine: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("props", {
      gameId: args.gameId,
      externalGameId: args.externalGameId,
      type: args.type,
      description: args.description,
      over: args.over,
      under: args.under,
      currentLine: args.currentLine,
    });
  },
});

export const updateProp = mutation({
  args: {
    propId: v.id("props"),
    over: v.optional(v.number()),
    under: v.optional(v.number()),
    currentLine: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: {
      over?: number;
      under?: number;
      currentLine?: number;
    } = {};

    if (args.over !== undefined) updates.over = args.over;
    if (args.under !== undefined) updates.under = args.under;
    if (args.currentLine !== undefined) updates.currentLine = args.currentLine;

    await ctx.db.patch(args.propId, updates);
    return await ctx.db.get(args.propId);
  },
});
