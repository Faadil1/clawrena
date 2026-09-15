/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _probe from "../_probe.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as clawPump from "../clawPump.js";
import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as evidence from "../evidence.js";
import type * as http from "../http.js";
import type * as lib_claimLease from "../lib/claimLease.js";
import type * as lib_clawpump from "../lib/clawpump.js";
import type * as lib_evidencePassport from "../lib/evidencePassport.js";
import type * as lib_evidencePolicy from "../lib/evidencePolicy.js";
import type * as lib_evidenceScore from "../lib/evidenceScore.js";
import type * as lib_executionAuthority from "../lib/executionAuthority.js";
import type * as lib_http from "../lib/http.js";
import type * as lib_market from "../lib/market.js";
import type * as lib_pumpInstruction from "../lib/pumpInstruction.js";
import type * as lib_risk from "../lib/risk.js";
import type * as lib_tokenEconomics from "../lib/tokenEconomics.js";
import type * as lib_underwriting from "../lib/underwriting.js";
import type * as portfolio from "../portfolio.js";
import type * as queries_internal from "../queries/internal.js";
import type * as queries_portfolio from "../queries/portfolio.js";
import type * as queries_public from "../queries/public.js";
import type * as queries_signal from "../queries/signal.js";
import type * as queries_signals from "../queries/signals.js";
import type * as runAgent from "../runAgent.js";
import type * as scanner from "../scanner.js";
import type * as shieldScan from "../shieldScan.js";
import type * as signals from "../signals.js";
import type * as trades from "../trades.js";
import type * as underwriting from "../underwriting.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

declare const fullApi: ApiFromModules<{
  _probe: typeof _probe;
  agents: typeof agents;
  auth: typeof auth;
  clawPump: typeof clawPump;
  cleanup: typeof cleanup;
  crons: typeof crons;
  evidence: typeof evidence;
  http: typeof http;
  "lib/claimLease": typeof lib_claimLease;
  "lib/clawpump": typeof lib_clawpump;
  "lib/evidencePassport": typeof lib_evidencePassport;
  "lib/evidencePolicy": typeof lib_evidencePolicy;
  "lib/evidenceScore": typeof lib_evidenceScore;
  "lib/executionAuthority": typeof lib_executionAuthority;
  "lib/http": typeof lib_http;
  "lib/market": typeof lib_market;
  "lib/pumpInstruction": typeof lib_pumpInstruction;
  "lib/risk": typeof lib_risk;
  "lib/tokenEconomics": typeof lib_tokenEconomics;
  "lib/underwriting": typeof lib_underwriting;
  portfolio: typeof portfolio;
  "queries/internal": typeof queries_internal;
  "queries/portfolio": typeof queries_portfolio;
  "queries/public": typeof queries_public;
  "queries/signal": typeof queries_signal;
  "queries/signals": typeof queries_signals;
  runAgent: typeof runAgent;
  scanner: typeof scanner;
  shieldScan: typeof shieldScan;
  signals: typeof signals;
  trades: typeof trades;
  underwriting: typeof underwriting;
  users: typeof users;
  wallet: typeof wallet;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
export declare const components: {};
