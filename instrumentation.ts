export async function register() {
  // Polyfill for URL.canParse in older Node.js versions
  if (typeof URL !== 'undefined' && !URL.canParse) {
    URL.canParse = function(input: string, base?: string) {
      try {
        new URL(input, base);
        return true;
      } catch {
        return false;
      }
    };
  }
}