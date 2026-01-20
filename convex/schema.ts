import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    virtualBalance: v.number(),
    isAdmin: v.boolean(),
    lifetimeProfit: v.number(),
    totalBets: v.number(),
    wins: v.number(),
    losses: v.number(),
    pushes: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_lifetime_profit", ["lifetimeProfit"]),
  games: defineTable({
    externalId: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
    status: v.string(),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
  }).index("by_external_id", ["externalId"]),
  props: defineTable({
    gameId: v.id("games"),
    externalGameId: v.string(),
    type: v.string(),
    description: v.string(),
    over: v.number(),
    under: v.number(),
    currentLine: v.number(),
  }).index("by_game", ["gameId"]),
  bets: defineTable({
    userId: v.id("users"),
    gameId: v.string(),
    propId: v.string(),
    amount: v.number(),
    prediction: v.string(),
    odds: v.number(),
    settled: v.boolean(),
    result: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_game", ["gameId"]),
  betLegs: defineTable({
    betId: v.id("bets"),
    propId: v.id("props"),
    side: v.union(v.literal("over"), v.literal("under")),
    odds: v.number(),
    legResult: v.union(v.literal("pending"), v.literal("won"), v.literal("lost"), v.literal("push")),
    customLineValue: v.optional(v.number()),
    isCustomLine: v.optional(v.boolean()),
  }).index("by_bet", ["betId"]),
  publicBets: defineTable({
    userId: v.id("users"),
    username: v.string(),
    betId: v.id("bets"),
    type: v.union(v.literal("single"), v.literal("parlay")),
    stake: v.number(),
    potentialPayout: v.number(),
    status: v.union(v.literal("pending"), v.literal("won"), v.literal("lost"), v.literal("push")),
    legs: v.array(
      v.object({
        propId: v.id("props"),
        playerName: v.string(),
        propType: v.string(),
        gameInfo: v.string(),
        side: v.union(v.literal("over"), v.literal("under")),
        lineValue: v.number(),
        odds: v.number(),
        isCustomLine: v.optional(v.boolean()),
      })
    ),
  }),
});
