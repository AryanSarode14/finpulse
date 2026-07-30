/**
 * The stdio transport uses stdout exclusively for JSON-RPC protocol
 * messages -- anything else written there corrupts the stream. All
 * debug/diagnostic logging must go to stderr instead.
 */
export function logToolInvocation(name: string, args: unknown): void {
  console.error(`[finpulse-mcp-server] tool=${name} args=${JSON.stringify(args)}`);
}
