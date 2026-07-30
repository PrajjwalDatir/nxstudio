import "server-only";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { encodeURL, validateTransfer, ValidateTransferError } from "@solana/pay";
import BigNumber from "bignumber.js";
import { solana } from "./config";

/**
 * Solana Pay merchant module. Two responsibilities:
 *
 *   createPaymentRequest() — mint a throwaway `reference` pubkey (Solana Pay spec:
 *     a random public key used only as an on-chain marker; we never need its
 *     secret key) and encode a `solana:` transfer URL. The caller persists the
 *     reference on the user's subscription row so the payment binds to exactly
 *     one user + cycle.
 *
 *   verifyPayment(reference) — find every finalized transaction that carries the
 *     reference and validateTransfer() each against our wallet + amount + an
 *     accepted stablecoin mint. Returns the signature of the first that passes.
 *     All checks (recipient, amount, mint, finality, reference) are on-chain, so
 *     the client cannot forge a longer subscription.
 */

function connections(): Connection[] {
  return solana.rpcUrls().map((u) => new Connection(u, "confirmed"));
}

export interface PaymentRequest {
  reference: string; // base58 pubkey — persist this on the sub row
  url: string; // solana: URL for the QR / deep link
  amount: string; // decimal string, for display
}

/**
 * Build a Solana Pay request. Pass `existingReference` (base58) to rebuild the URL
 * for an in-flight payment so a returning user sees the same request; omit it to
 * mint a fresh reference. Default mint is USDC; USDT is also accepted at verify time.
 */
export function createPaymentRequest(existingReference?: string, tier: string = "pro_10"): PaymentRequest {
  const reference = existingReference
    ? new PublicKey(existingReference)
    : Keypair.generate().publicKey;
  const amtStr = solana.planAmount(tier);
  const amount = new BigNumber(amtStr);
  const tierName = amtStr === "50" ? "Black Label VIP" : "Atelier";
  const url = encodeURL({
    recipient: new PublicKey(solana.walletAddress()),
    amount,
    splToken: new PublicKey(solana.usdcMint()),
    reference,
    label: solana.label(),
    // ASCII only — some wallets fail to parse non-ASCII (e.g. an em dash) in the
    // Solana Pay message and reject the QR as "invalid".
    message: `${solana.label()} ${tierName} - ${solana.cycleDays()} day cycle`,
  }).toString();

  return { reference: reference.toBase58(), url, amount: amount.toString() };
}

export type VerifyResult =
  | { ok: true; signature: string; mint: string; amount: string }
  | { ok: false; reason: "not_found" | "invalid"; message: string };

/**
 * Verify the payment behind `reference`. Scans finalized signatures for the
 * reference (robust to dust/duplicate txs) and validates each against the
 * expected recipient, amount, and USDC/USDT mint.
 */
export async function verifyPayment(
  referenceBase58: string,
  expectedAmountOverride?: string
): Promise<VerifyResult> {
  let reference: PublicKey;
  try {
    reference = new PublicKey(referenceBase58);
  } catch {
    return { ok: false, reason: "invalid", message: "Invalid payment reference." };
  }

  // Try each RPC until one answers; only transport errors fall through (an empty
  // result is a valid "not found yet", not an RPC failure).
  let connection: Connection | null = null;
  let sigs: Awaited<ReturnType<Connection["getSignaturesForAddress"]>> | null = null;
  let lastErr: unknown;
  for (const c of connections()) {
    try {
      sigs = await c.getSignaturesForAddress(reference, undefined, "finalized");
      connection = c;
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!connection || !sigs) throw lastErr ?? new Error("All Solana RPCs failed.");

  if (sigs.length === 0) {
    return { ok: false, reason: "not_found", message: "No finalized payment found for this reference yet." };
  }

  const recipient = new PublicKey(solana.walletAddress());
  const targetAmt = expectedAmountOverride || solana.planAmount();
  const amount = new BigNumber(targetAmt);
  const mints = [
    { mint: solana.usdcMint(), key: new PublicKey(solana.usdcMint()) },
    { mint: solana.usdtMint(), key: new PublicKey(solana.usdtMint()) },
  ];

  for (const { signature } of sigs) {
    for (const { mint, key } of mints) {
      try {
        await validateTransfer(
          connection,
          signature,
          { recipient, amount, splToken: key, reference },
          { commitment: "finalized" }
        );
        return { ok: true, signature, mint, amount: amount.toString() };
      } catch (e) {
        if (e instanceof ValidateTransferError) continue; // wrong mint/amount for this sig — try next
        throw e; // RPC/transport error — surface it
      }
    }
  }

  return {
    ok: false,
    reason: "invalid",
    message: `No transfer of ${amount.toString()} USDC/USDT to the store wallet was found for this reference.`,
  };
}
