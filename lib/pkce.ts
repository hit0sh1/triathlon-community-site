/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0 flow
 * RFC 7636: https://tools.ietf.org/html/rfc7636
 */

/**
 * Generate a random string for code verifier
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let text = ''
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * Generate code verifier for PKCE flow
 * Must be between 43 and 128 characters
 */
export function generateCodeVerifier(): string {
  return generateRandomString(128)
}

/**
 * Generate code challenge from code verifier using SHA256
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  if (typeof window !== 'undefined') {
    // Browser environment
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await window.crypto.subtle.digest('SHA-256', data)
    
    // Convert to base64url
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  } else {
    // Node.js environment
    const crypto = require('crypto')
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}

/**
 * Store code verifier in localStorage for later use
 */
export function storeCodeVerifier(codeVerifier: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('strava_code_verifier', codeVerifier)
  }
}

/**
 * Retrieve and remove code verifier from localStorage
 */
export function retrieveCodeVerifier(): string | null {
  if (typeof window !== 'undefined') {
    const codeVerifier = localStorage.getItem('strava_code_verifier')
    localStorage.removeItem('strava_code_verifier')
    return codeVerifier
  }
  return null
}

/**
 * Generate PKCE parameters for OAuth flow
 */
export async function generatePKCEParams(): Promise<{
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: string
}> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  }
}