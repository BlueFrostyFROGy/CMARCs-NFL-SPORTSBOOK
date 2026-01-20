import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getGameById = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getGameByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

export const getAllGames = query({
  handler: async (ctx) => {
    return await ctx.db.query("games").collect();
  },
});

export const createGame = mutation({
  args: {
    externalId: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      externalId: args.externalId,
      homeTeam: args.homeTeam,
      awayTeam: args.awayTeam,
      startTime: args.startTime,
      status: args.status,
    });
  },
});

export const updateGame = mutation({
  args: {
    gameId: v.id("games"),
    status: v.optional(v.string()),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: {
      status?: string;
      homeScore?: number;
      awayScore?: number;
    } = {};

    if (args.status !== undefined) updates.status = args.status;
    if (args.homeScore !== undefined) updates.homeScore = args.homeScore;
    if (args.awayScore !== undefined) updates.awayScore = args.awayScore;

    await ctx.db.patch(args.gameId, updates);
    return await ctx.db.get(args.gameId);
  },
});
