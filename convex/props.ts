import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getGameProps = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("props")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const createProp = mutation({
  args: {
    gameId: v.id("games"),
    playerName: v.string(),
    propType: v.union(
      v.literal("passing_yards"),
      v.literal("rushing_yards"),
      v.literal("receiving_yards"),
      v.literal("receptions"),
      v.literal("anytime_td")
    ),
    lineValue: v.number(),
    overOdds: v.number(),
    underOdds: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("props", {
      gameId: args.gameId,
      playerName: args.playerName,
      propType: args.propType,
      lineValue: args.lineValue,
      overOdds: args.overOdds,
      underOdds: args.underOdds,
      result: "pending",
    });
  },
});

export const gradeProp = mutation({
  args: {
    propId: v.id("props"),
    result: v.union(
      v.literal("over_win"),
      v.literal("under_win"),
      v.literal("push")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.propId, {
      result: args.result,
    });

    // Grade all bets on this prop
    const betLegs = await ctx.db
      .query("betLegs")
      .filter((q) => q.eq(q.field("propId"), args.propId))
      .collect();

    for (const leg of betLegs) {
      let legResult: "won" | "lost" | "push" = "push";
      
      if (args.result === "push") {
        legResult = "push";
      } else if (
        (args.result === "over_win" && leg.side === "over") ||
        (args.result === "under_win" && leg.side === "under")
      ) {
        legResult = "won";
      } else {
        legResult = "lost";
      }

      await ctx.db.patch(leg._id, { legResult });
    }

    // Grade parent bets and update user stats
    const uniqueBetIds = [...new Set(betLegs.map(leg => leg.betId))];
    
    for (const betId of uniqueBetIds) {
      const bet = await ctx.db.get(betId);
      if (!bet) continue;

      const allLegs = await ctx.db
        .query("betLegs")
        .withIndex("by_bet", (q) => q.eq("betId", betId))
        .collect();

      const pendingLegs = allLegs.filter(leg => leg.legResult === "pending");
      
      if (pendingLegs.length === 0) {
        // All legs are graded, determine bet result
        const wonLegs = allLegs.filter(leg => leg.legResult === "won");
        const pushLegs = allLegs.filter(leg => leg.legResult === "push");
        
        let betStatus: "won" | "lost" | "push";
        let payout = 0;
        let profitLoss = 0;

        if (bet.type === "single") {
          // Single bet - should only have one leg
          const leg = allLegs[0];
          if (leg.legResult === "won") {
            betStatus = "won";
            payout = bet.potentialPayout;
            profitLoss = bet.potentialPayout - bet.stake;
          } else if (leg.legResult === "push") {
            betStatus = "push";
            payout = bet.stake; // Refund
            profitLoss = 0;
          } else {
            betStatus = "lost";
            profitLoss = -bet.stake;
          }
        } else {
          // Parlay bet
          if (wonLegs.length === allLegs.length) {
            betStatus = "won";
            payout = bet.potentialPayout;
            profitLoss = bet.potentialPayout - bet.stake;
          } else if (pushLegs.length > 0 && wonLegs.length + pushLegs.length === allLegs.length) {
            betStatus = "push";
            payout = bet.stake; // Refund
            profitLoss = 0;
          } else {
            betStatus = "lost";
            profitLoss = -bet.stake;
          }
        }

        await ctx.db.patch(betId, { status: betStatus });

        // Update user balance
        if (payout > 0) {
          const user = await ctx.db.get(bet.userId);
          if (user) {
            await ctx.db.patch(bet.userId, {
              virtualBalance: (user.virtualBalance || 0) + payout,
            });
          }
        }

        // Update user stats for leaderboard
        await ctx.runMutation(internal.users.updateUserStats, {
          userId: bet.userId,
          betResult: betStatus,
          profitLoss,
        });

        // Update public bet feed
        await ctx.db
          .query("publicBets")
          .filter((q) => q.eq(q.field("betId"), betId))
          .collect()
          .then(async (publicBets) => {
            for (const publicBet of publicBets) {
              await ctx.db.patch(publicBet._id, { status: betStatus });
            }
          });
      }
    }
  },
});

// Calculate custom odds based on line adjustment
export const calculateCustomOdds = query({
  args: {
    baseOdds: v.number(),
    baseLine: v.number(),
    customLine: v.number(),
    side: v.union(v.literal("over"), v.literal("under")),
  },
  handler: async (ctx, args) => {
    const lineDifference = args.customLine - args.baseLine;
    
    // Odds adjustment logic
    let oddsAdjustment = 0;
    
    if (args.side === "over") {
      // Higher line for over = better odds (more plus money)
      oddsAdjustment = lineDifference * 6; // 6 points per 1 unit of line
    } else {
      // Lower line for under = better odds (more plus money)
      oddsAdjustment = -lineDifference * 6; // 6 points per 1 unit of line
    }
    
    const newOdds = args.baseOdds + oddsAdjustment;
    
    // Ensure odds don't go below -500 or above +1000
    return Math.max(-500, Math.min(1000, Math.round(newOdds)));
  },
});
