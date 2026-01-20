import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserBets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getBetsByGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bets")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const placeBet = mutation({
  args: {
    userId: v.id("users"),
    gameId: v.string(),
    propId: v.string(),
    amount: v.number(),
    prediction: v.string(),
    odds: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.amount > user.virtualBalance) {
      throw new Error("Insufficient balance");
    }

    const betId = await ctx.db.insert("bets", {
      userId: args.userId,
      gameId: args.gameId,
      propId: args.propId,
      amount: args.amount,
      prediction: args.prediction,
      odds: args.odds,
      settled: false,
    });

    await ctx.db.patch(args.userId, {
      virtualBalance: user.virtualBalance - args.amount,
      totalBets: user.totalBets + 1,
    });

    return betId;
  },
});

export const settleBet = mutation({
  args: {
    betId: v.id("bets"),
    result: v.union(v.literal("win"), v.literal("loss"), v.literal("push")),
  },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");

    const user = await ctx.db.get(bet.userId);
    if (!user) throw new Error("User not found");

    let payout = 0;
    let profitLoss = 0;

    if (args.result === "win") {
      payout = bet.amount * bet.odds;
      profitLoss = payout - bet.amount;
    } else if (args.result === "loss") {
      payout = 0;
      profitLoss = -bet.amount;
    } else if (args.result === "push") {
      payout = bet.amount;
      profitLoss = 0;
    }

    await ctx.db.patch(args.betId, {
      settled: true,
      result: args.result,
    });

    await ctx.db.patch(bet.userId, {
      virtualBalance: user.virtualBalance + payout,
      lifetimeProfit: user.lifetimeProfit + profitLoss,
      wins: args.result === "win" ? user.wins + 1 : user.wins,
      losses: args.result === "loss" ? user.losses + 1 : user.losses,
      pushes: args.result === "push" ? user.pushes + 1 : user.pushes,
    });

    return bet;
  },
});

export const getBet = query({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.betId);
  },
});
