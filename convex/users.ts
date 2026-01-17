import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const authUser = await ctx.db.get(userId);
    if (!authUser) return null;

    // Check if user exists in our users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email || undefined))
      .first();

    return user;
  },
});

export const createUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const authUser = await ctx.db.get(userId);
    if (!authUser) throw new Error("Auth user not found");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email || ""))
      .first();

    const username = authUser.email
      ? (authUser as any).name || authUser.email.split("@")[0]
      : `User${Math.floor(Math.random() * 10000)}`;

    if (existingUser) {
      // Ensure existing user has all required fields
      if (!existingUser.username || existingUser.virtualBalance === undefined) {
        await ctx.db.patch(existingUser._id, {
          username: existingUser.username || username,
          virtualBalance: existingUser.virtualBalance ?? 100,
          isAdmin: existingUser.isAdmin ?? false,
          lifetimeProfit: existingUser.lifetimeProfit ?? 0,
          totalBets: existingUser.totalBets ?? 0,
          wins: existingUser.wins ?? 0,
          losses: existingUser.losses ?? 0,
          pushes: existingUser.pushes ?? 0,
        });
      }
      return existingUser._id;
    }

    // Create new user with $100 starting balance and leaderboard fields
    return await ctx.db.insert("users", {
      email: authUser.email || undefined,
      username,
      virtualBalance: 100,
      isAdmin: false,
      lifetimeProfit: 0,
      totalBets: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
    });
  },
});

export const updateBalance = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      virtualBalance: (user.virtualBalance || 0) + args.amount,
    });
  },
});

// New leaderboard query
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_lifetime_profit")
      .order("desc")
      .take(50);

    return users
      .filter(user => user.lifetimeProfit !== undefined)
      .map((user, index) => {
        const totalBets = user.totalBets || 0;
        const wins = user.wins || 0;
        const decidedBets = totalBets - (user.pushes || 0);
        const winRate = decidedBets > 0 ? (wins / decidedBets) * 100 : 0;
        
        return {
          _id: user._id,
          rank: index + 1,
          username: user.username || "Anonymous",
          lifetimeProfit: user.lifetimeProfit || 0,
          totalBets,
          wins,
          losses: user.losses || 0,
          pushes: user.pushes || 0,
          winRate,
        };
      });
  },
});

// Update user stats when bet is graded
export const updateUserStats = internalMutation({
  args: {
    userId: v.id("users"),
    betResult: v.union(v.literal("won"), v.literal("lost"), v.literal("push")),
    profitLoss: v.number(), // Positive for wins, negative for losses, zero for pushes
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: any = {
      lifetimeProfit: (user.lifetimeProfit || 0) + args.profitLoss,
      totalBets: (user.totalBets || 0) + 1,
    };

    if (args.betResult === "won") {
      updates.wins = (user.wins || 0) + 1;
    } else if (args.betResult === "lost") {
      updates.losses = (user.losses || 0) + 1;
    } else if (args.betResult === "push") {
      updates.pushes = (user.pushes || 0) + 1;
    }

    await ctx.db.patch(args.userId, updates);
  },
});
