import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Risk exits should not wait 15 minutes on launch-market positions.
crons.interval("agent-harness-cycle", { minutes: 1 }, internal.runAgent.run, {});

// Helius webhook remains the preferred realtime discovery path; this is a
// five-minute fallback/reconciliation poll instead of the old hourly demo poll.
crons.interval("launch-scanner", { minutes: 5 }, internal.scanner.discover, {});

crons.interval("telemetry-sweep", { hours: 24 }, internal.cleanup.sweepTelemetry, {});

export default crons;
