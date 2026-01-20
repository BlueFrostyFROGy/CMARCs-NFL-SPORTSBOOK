import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user || null;
  },
});

export const createUser = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db.get(userId);
    if (existingUser) return existingUser;

    const user = await ctx.db.insert("users", {
      virtualBalance: 100000,
      isAdmin: false,
      lifetimeProfit: 0,
      totalBets: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
    });

    return await ctx.db.get(user);
  },
});

export const updateUserProfile = mutation({
  args: {
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: { username?: string } = {};
    if (args.username) updates.username = args.username;

    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("users")
      .withIndex("by_lifetime_profit", (q) => q.gte("lifetimeProfit", 0))
      .order("desc")
      .take(limit);
  },
});

export const updateUserStats = internalMutation({
  args: {
    userId: v.id("users"),
    betResult: v.union(v.literal("won"), v.literal("lost"), v.literal("push")),
    profitLoss: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: {
      lifetimeProfit: number;
      totalBets: number;
      wins?: number;
      losses?: number;
      pushes?: number;
    } = {
      lifetimeProfit: user.lifetimeProfit + args.profitLoss,
      totalBets: user.totalBets + 1,
    };

    if (args.betResult === "won") {
      updates.wins = user.wins + 1;
    } else if (args.betResult === "lost") {
      updates.losses = user.losses + 1;
    } else if (args.betResult === "push") {
      updates.pushes = user.pushes + 1;
    }

    await ctx.db.patch(args.userId, updates);
  },
});

