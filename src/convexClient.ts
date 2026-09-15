import { ConvexReactClient } from "convex/react";

const configuredUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();

export const convexUrl = configuredUrl || null;
export const convexConfigured = Boolean(configuredUrl);
export const convexClient = configuredUrl ? new ConvexReactClient(configuredUrl) : null;
