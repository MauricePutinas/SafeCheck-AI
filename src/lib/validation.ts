// Zentrale Zod-Schemas fuer API-Eingaben.
import { z } from "zod";

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
export const categorySchema = z.enum([
  "secret",
  "pii",
  "internal",
  "prompt_injection",
  "risky_instruction",
]);
export const inputTypeSchema = z.enum(["text", "code", "email"]);

export const findingSchema = z.object({
  ruleId: z.string().min(1).max(120),
  category: categorySchema,
  severity: severitySchema,
  title: z.string().min(1).max(200),
  maskedMatch: z.string().max(400),
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  explanation: z.string().max(2000),
  recommendation: z.string().max(2000),
});

export const categoryCountSchema = z.object({
  category: categorySchema,
  count: z.number().int().nonnegative(),
});

export const scanResultSchema = z.object({
  inputType: inputTypeSchema,
  riskScore: z.number().int().min(0).max(100),
  severity: severitySchema,
  findings: z.array(findingSchema).max(2000),
  findingCount: z.number().int().nonnegative(),
  categoryCounts: z.array(categoryCountSchema).max(10),
  redactedText: z.string().max(200_000),
  inputLength: z.number().int().nonnegative(),
  summary: z.string().max(2000),
  scannedAt: z.string().max(40),
});

export const saveScanSchema = z.object({
  result: scanResultSchema,
  originalText: z.string().max(200_000).nullable().optional(),
  storeOriginal: z.boolean().default(false),
});

// Server-seitiger Scan (optionaler Endpoint)
export const scanRequestSchema = z.object({
  text: z.string().max(200_000),
  inputType: inputTypeSchema.default("text"),
  strictMode: z.boolean().optional(),
});

export const settingsSchema = z.object({
  storeOriginalText: z.boolean().optional(),
  strictMode: z.boolean().optional(),
  saveHistory: z.boolean().optional(),
});

export const watchlistTypeSchema = z.enum([
  "company",
  "project",
  "customer",
  "tool",
  "other",
]);

export const createWatchlistSchema = z.object({
  term: z.string().min(1).max(120),
  type: watchlistTypeSchema.default("other"),
  severity: severitySchema.default("medium"),
  caseSensitive: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const licenseActivateSchema = z.object({
  licenseKey: z.string().min(6).max(200),
  instanceName: z.string().max(120).optional(),
});
