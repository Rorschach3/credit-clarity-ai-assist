import { useState, useCallback } from "react";

interface UseMcpToolReturn<T> {
  loading: boolean;
  error: Error | null;
  callTool: (args: unknown) => Promise<T | null>;
}

export function useMcpTool<T = unknown>(serverName: string, toolName: string): UseMcpToolReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const callTool = useCallback(
    async (args: unknown): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        // @ts-expect-error MCP client is assumed to be globally available or imported
        const response = await window.mcpClient.callTool(serverName, toolName, args);
        setLoading(false);
        return response as T;
      } catch (err) {
        setError(err as Error);
        setLoading(false);
        return null;
      }
    },
    [serverName, toolName]
  );

  return { loading, error, callTool };
}