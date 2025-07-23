// Polyfill for URL.canParse in older Node.js versions
if (!URL.canParse) {
  URL.canParse = function(input, base) {
    try {
      new URL(input, base);
      return true;
    } catch {
      return false;
    }
  };
}