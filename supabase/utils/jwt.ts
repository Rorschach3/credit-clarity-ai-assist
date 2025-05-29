import { Key } from "https://deno.land/x/djwt@v2.9.1/types.ts";

// Generate a secure random key
export const key: Key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-256" },
  true,
  ["sign", "verify"],
);