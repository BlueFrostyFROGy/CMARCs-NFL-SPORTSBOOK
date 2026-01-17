import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listGames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .withIndex("by_status")
      .collect();
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const createGame = mutation({
  args: {
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      homeTeam: args.homeTeam,
      awayTeam: args.awayTeam,
      startTime: args.startTime,
      status: "upcoming",
    });
  },
});

export const updateGameStatus = mutation({
  args: {
    gameId: v.id("games"),
    status: v.union(v.literal("upcoming"), v.literal("live"), v.literal("final")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, {
      status: args.status,
    });
  },
});
