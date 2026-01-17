import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getUserBets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const betsWithLegs = await Promise.all(
      bets.map(async (bet) => {
        const legs = await ctx.db
          .query("betLegs")
          .withIndex("by_bet", (q) => q.eq("betId", bet._id))
          .collect();

        const legsWithProps = await Promise.all(
          legs.map(async (leg) => {
            const prop = await ctx.db.get(leg.propId);
            const game = prop ? await ctx.db.get(prop.gameId) : null;
            return { ...leg, prop, game };
          })
        );

        return { ...bet, legs: legsWithProps };
      })
    );

    return betsWithLegs;
  },
});

export const placeBet = mutation({
  args: {
    userId: v.id("users"),
    legs: v.array(v.object({
      propId: v.id("props"),
      side: v.union(v.literal("over"), v.literal("under")),
      odds: v.number(),
      customLineValue: v.optional(v.number()),
      isCustomLine: v.optional(v.boolean()),
    })),
    stake: v.number(),
    betType: v.union(v.literal("single"), v.literal("parlay")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Calculate total stake for single bets or single stake for parlay
    const totalStake = args.betType === "single" ? args.stake * args.legs.length : args.stake;
    
    if ((user.virtualBalance || 0) < totalStake) {
      throw new Error("Insufficient balance");
    }

    // Deduct stake from balance
    await ctx.db.patch(args.userId, {
      virtualBalance: (user.virtualBalance || 0) - totalStake,
    });

    if (args.betType === "single") {
      // Create separate bets for each leg
      for (const leg of args.legs) {
        const potentialPayout = calculatePayout(args.stake, leg.odds);
        
        const betId = await ctx.db.insert("bets", {
          userId: args.userId,
          type: "single",
          stake: args.stake,
          potentialPayout,
          status: "pending",
        });

        await ctx.db.insert("betLegs", {
          betId,
          propId: leg.propId,
          side: leg.side,
          odds: leg.odds,
          legResult: "pending",
          customLineValue: leg.customLineValue,
          isCustomLine: leg.isCustomLine || false,
        });

        // Add to public bet feed
        await createPublicBetEntry(ctx, betId, user);
      }
    } else {
      // Create single parlay bet
      const parlayOdds = calculateParlayOdds(args.legs.map(leg => leg.odds));
      const potentialPayout = calculatePayout(args.stake, parlayOdds);
      
      const betId = await ctx.db.insert("bets", {
        userId: args.userId,
        type: "parlay",
        stake: args.stake,
        potentialPayout,
        status: "pending",
      });

      for (const leg of args.legs) {
        await ctx.db.insert("betLegs", {
          betId,
          propId: leg.propId,
          side: leg.side,
          odds: leg.odds,
          legResult: "pending",
          customLineValue: leg.customLineValue,
          isCustomLine: leg.isCustomLine || false,
        });
      }

      // Add to public bet feed
      await createPublicBetEntry(ctx, betId, user);
    }

    return { success: true };
  },
});

// Helper function to create public bet entry
async function createPublicBetEntry(ctx: any, betId: any, user: any) {
  const bet = await ctx.db.get(betId);
  if (!bet) return;

  const legs = await ctx.db
    .query("betLegs")
    .withIndex("by_bet", (q: any) => q.eq("betId", betId))
    .collect();

  const legsWithProps = await Promise.all(
    legs.map(async (leg: any) => {
      const prop = await ctx.db.get(leg.propId);
      const game = prop ? await ctx.db.get(prop.gameId) : null;
      return {
        propId: leg.propId,
        playerName: prop?.playerName || "Unknown",
        propType: prop?.propType || "unknown",
        gameInfo: game ? `${game.awayTeam} @ ${game.homeTeam}` : "Unknown Game",
        side: leg.side,
        lineValue: leg.customLineValue || prop?.lineValue || 0,
        odds: leg.odds,
        isCustomLine: leg.isCustomLine || false,
      };
    })
  );

  await ctx.db.insert("publicBets", {
    userId: user._id,
    username: user.username || "Anonymous",
    betId,
    type: bet.type,
    stake: bet.stake,
    potentialPayout: bet.potentialPayout,
    status: bet.status,
    legs: legsWithProps,
  });
}

// Get public bet feed
export const getPublicBetFeed = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("publicBets")
      .order("desc")
      .take(50);
  },
});

// Copy bet to user's slip
export const copyBetToSlip = query({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) return null;

    const legs = await ctx.db
      .query("betLegs")
      .withIndex("by_bet", (q) => q.eq("betId", args.betId))
      .collect();

    const legsWithProps = await Promise.all(
      legs.map(async (leg) => {
        const prop = await ctx.db.get(leg.propId);
        const game = prop ? await ctx.db.get(prop.gameId) : null;
        return {
          propId: leg.propId,
          playerName: prop?.playerName || "Unknown",
          propType: prop?.propType || "unknown",
          lineValue: leg.customLineValue || prop?.lineValue || 0,
          side: leg.side,
          odds: leg.odds,
          gameInfo: game ? `${game.awayTeam} @ ${game.homeTeam}` : "Unknown Game",
          isCustomLine: leg.isCustomLine || false,
          customLineValue: leg.customLineValue,
        };
      })
    );

    return {
      legs: legsWithProps,
      stake: bet.stake,
      betType: bet.type,
    };
  },
});

function calculatePayout(stake: number, americanOdds: number): number {
  if (americanOdds < 0) {
    return stake + (stake * 100) / Math.abs(americanOdds);
  } else {
    return stake + (stake * americanOdds) / 100;
  }
}

function americanToDecimal(americanOdds: number): number {
  if (americanOdds < 0) {
    return 1 + 100 / Math.abs(americanOdds);
  } else {
    return 1 + americanOdds / 100;
  }
}

function calculateParlayOdds(americanOddsArray: number[]): number {
  const decimalOdds = americanOddsArray.map(americanToDecimal);
  const combinedDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  
  // Convert back to American odds
  if (combinedDecimal >= 2) {
    return Math.round((combinedDecimal - 1) * 100);
  } else {
    return Math.round(-100 / (combinedDecimal - 1));
  }
}

export const gradeBet = mutation({
  args: {
    betId: v.id("bets"),
    legResults: v.array(
      v.object({
        legId: v.id("betLegs"),
        result: v.union(
          v.literal("won"),
          v.literal("lost"),
          v.literal("push")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");

    // Update each leg
    for (const leg of args.legResults) {
      await ctx.db.patch(leg.legId, { legResult: leg.result });
    }

    // Fetch updated legs
    const legs = await ctx.db
      .query("betLegs")
      .withIndex("by_bet", (q) => q.eq("betId", args.betId))
      .collect();

    // Determine bet result
    const anyLost = legs.some((l) => l.legResult === "lost");
    const anyPending = legs.some((l) => l.legResult === "pending");
    
    // Filter out pushes for win evaluation
    const nonPushLegs = legs.filter((l) => l.legResult !== "push");
    const allNonPushWon = nonPushLegs.length > 0 && nonPushLegs.every((l) => l.legResult === "won");
    const allPush = legs.every((l) => l.legResult === "push");

    let finalResult: "won" | "lost" | "push" | "pending";

    if (anyLost) {
      finalResult = "lost";
    } else if (anyPending) {
      finalResult = "pending";
    } else if (allNonPushWon || allPush) {
      finalResult = allPush ? "push" : "won";
    } else {
      finalResult = "pending";
    }

    // Update bet status
    await ctx.db.patch(args.betId, { status: finalResult });

    // Calculate profit/loss
    let profitLoss = 0;
    if (finalResult === "won") {
      profitLoss = bet.potentialPayout - bet.stake;
    } else if (finalResult === "lost") {
      profitLoss = -bet.stake;
    } else {
      profitLoss = 0;
    }

    // Update user stats (only if bet is settled, not pending)
    if (finalResult !== "pending") {
      await ctx.runMutation(internal.users.updateUserStats, {
        userId: bet.userId,
        betResult: finalResult,
        profitLoss,
      });
    }

    // Refund stake on push
    if (finalResult === "push") {
      const user = await ctx.db.get(bet.userId);
      await ctx.db.patch(bet.userId, {
        virtualBalance: (user?.virtualBalance || 0) + bet.stake,
      });
    }

    return { result: finalResult, profitLoss };
  },
});
