import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    virtualBalance: v.optional(v.number()),
    isAdmin: v.optional(v.boolean()),
    // New leaderboard fields
    lifetimeProfit: v.optional(v.number()),
    totalBets: v.optional(v.number()),
    wins: v.optional(v.number()),
    losses: v.optional(v.number()),
    pushes: v.optional(v.number()),
  }).index("by_email", ["email"])
    .index("by_lifetime_profit", ["lifetimeProfit"]),

  games: defineTable({
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
    status: v.union(v.literal("upcoming"), v.literal("live"), v.literal("final")),
  }).index("by_status", ["status"]),

  props: defineTable({
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
    result: v.union(
      v.literal("pending"),
      v.literal("over_win"),
      v.literal("under_win"),
      v.literal("push")
    ),
  }).index("by_game", ["gameId"]),

  bets: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("single"), v.literal("parlay")),
    stake: v.number(),
    potentialPayout: v.number(),
    status: v.union(v.literal("pending"), v.literal("won"), v.literal("lost"), v.literal("push")),
  }).index("by_user", ["userId"]),

  betLegs: defineTable({
    betId: v.id("bets"),
    propId: v.id("props"),
    side: v.union(v.literal("over"), v.literal("under")),
    odds: v.number(),
    legResult: v.union(v.literal("pending"), v.literal("won"), v.literal("lost"), v.literal("push")),
    // New fields for custom lines
    customLineValue: v.optional(v.number()),
    isCustomLine: v.optional(v.boolean()),
  }).index("by_bet", ["betId"]),

  // New table for public bet feed
  publicBets: defineTable({
    userId: v.id("users"),
    username: v.string(),
    betId: v.id("bets"),
    type: v.union(v.literal("single"), v.literal("parlay")),
    stake: v.number(),
    potentialPayout: v.number(),
    status: v.union(v.literal("pending"), v.literal("won"), v.literal("lost"), v.literal("push")),
    legs: v.array(v.object({
      propId: v.id("props"),
      playerName: v.string(),
      propType: v.string(),
      gameInfo: v.string(),
      side: v.union(v.literal("over"), v.literal("under")),
      lineValue: v.number(),
      odds: v.number(),
      isCustomLine: v.optional(v.boolean()),
    })),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
