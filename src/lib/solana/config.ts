import "server-only";

/**
 * Lazily read + validate the Solana billing config. Like razorpay/config.ts,
 * these are NOT validated at import time, so the app boots before crypto billing
 * is configured; each getter throws a clear error if its env var is missing.
 *
 * Only SOLANA_WALLET_ADDRESS may also be exposed to the browser (for display) as
 * NEXT_PUBLIC_SOLANA_WALLET_ADDRESS — nothing here is secret, but the RPC URL
 * (often a paid key) and the verification logic stay server-side.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Set it in .env to enable crypto billing.`);
  return v;
}

// Canonical mainnet SPL mints — overridable via env for devnet testing.
const MAINNET_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MAINNET_USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

export const solana = {
  rpcUrl: () => process.env.SOLANA_RPC_URL || PUBLIC_RPC,
  /**
   * RPCs to try in order: the configured primary, an optional fallback, then the
   * public endpoint as a last resort. The public RPC rate-limits
   * getSignaturesForAddress, so set SOLANA_RPC_URL to a paid provider in prod and
   * SOLANA_RPC_URL_FALLBACK to a second one for resilience.
   */
  rpcUrls: (): string[] => {
    const primary = process.env.SOLANA_RPC_URL || PUBLIC_RPC;
    const fallback = process.env.SOLANA_RPC_URL_FALLBACK;
    return [...new Set([primary, fallback, PUBLIC_RPC].filter(Boolean) as string[])];
  },
  walletAddress: () => required("SOLANA_WALLET_ADDRESS"),
  usdcMint: () => process.env.SOLANA_USDC_MINT || MAINNET_USDC,
  usdtMint: () => process.env.SOLANA_USDT_MINT || MAINNET_USDT,
  /** Price per cycle, denominated in the stablecoin (e.g. "5" = 5 USDC). */
  planAmount: () => required("CRYPTO_PLAN_AMOUNT"),
  cycleDays: () => Number(process.env.CRYPTO_CYCLE_DAYS ?? 28),
  graceHours: () => Number(process.env.CRYPTO_GRACE_HOURS ?? 48),
  label: () => process.env.CRYPTO_PAY_LABEL || "nxstudio",
};
