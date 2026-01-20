/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bets from "../bets.js";
import type * as bets_new from "../bets_new.js";
import type * as games from "../games.js";
import type * as games_new from "../games_new.js";
import type * as http from "../http.js";
import type * as props from "../props.js";
import type * as props_new from "../props_new.js";
import type * as router from "../router.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bets: typeof bets;
  bets_new: typeof bets_new;
  games: typeof games;
  games_new: typeof games_new;
  http: typeof http;
  props: typeof props;
  props_new: typeof props_new;
  router: typeof router;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
