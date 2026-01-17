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

    // Check if user already exists by email
    let existingUser = null;
    if (authUser.email) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", authUser.email))
        .first();
      
      if (existingUser) {
        return existingUser._id;
      }
    }

    // Generate username with fallback
    let username = `User${Math.floor(Math.random() * 100000)}`;
    if ((authUser as any).name) {
      username = (authUser as any).name;
    } else if (authUser.email) {
      username = authUser.email.split("@")[0];
    }

    // Create new user with all fields
    const newUserId = await ctx.db.insert("users", {
      email: authUser.email,
      username: username,
      virtualBalance: 100,
      isAdmin: false,
      lifetimeProfit: 0,
      totalBets: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
    });

    return newUserId;
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
