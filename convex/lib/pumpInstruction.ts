const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Official Pump program discriminators from the public IDL. */
export const PUMP_CREATE = [24, 30, 200, 40, 5, 28, 7, 119] as const;
export const PUMP_CREATE_V2 = [214, 144, 76, 236, 95, 139, 49, 180] as const;

/** Decode enough base58 for Solana instruction discriminators without adding a dependency. */
export function decodeBase58(input: string): Uint8Array {
  let value = 0n;
  for (const char of input) {
    const digit = BASE58.indexOf(char);
    if (digit < 0) throw new Error("invalid base58");
    value = value * 58n + BigInt(digit);
  }
  const body: number[] = [];
  while (value > 0n) {
    body.push(Number(value & 255n));
    value >>= 8n;
  }
  body.reverse();
  let leading = 0;
  while (leading < input.length && input[leading] === "1") leading += 1;
  return Uint8Array.from([...new Array(leading).fill(0), ...body]);
}

export function isPumpCreateInstructionData(data: string): boolean {
  try {
    const decoded = decodeBase58(data);
    if (decoded.length < 8) return false;
    const discriminator = [...decoded.slice(0, 8)];
    return [PUMP_CREATE, PUMP_CREATE_V2].some((known) =>
      known.every((value, index) => discriminator[index] === value),
    );
  } catch {
    return false;
  }
}

export type SolanaInstructionLike = {
  programId?: string;
  accounts?: string[];
  data?: string;
};

/**
 * Resolve the mint from already-flattened top-level + CPI instructions.
 * This intentionally performs no heuristic inference: the Pump program id and
 * an official create/create_v2 discriminator must both match.
 */
export function findPumpCreateMintInInstructions(
  instructions: SolanaInstructionLike[],
  pumpProgramId: string,
): string | null {
  for (const instruction of instructions) {
    if (instruction.programId !== pumpProgramId || typeof instruction.data !== "string") continue;
    if (!isPumpCreateInstructionData(instruction.data)) continue;
    const mint = instruction.accounts?.[0];
    if (typeof mint === "string" && mint.length > 0) return mint;
  }
  return null;
}
