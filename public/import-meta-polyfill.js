// Polyfill for import.meta to support dependencies that use it
// This is needed because Metro bundler doesn't transform import.meta
if (typeof window !== 'undefined' && !window.importMeta) {
  // Create a global import.meta polyfill
  (function() {
    const script = document.currentScript || document.querySelector('script[src*="import-meta-polyfill"]');
    const baseUrl = script ? new URL(script.src, window.location.href).href.replace(/\/[^/]*$/, '/') : window.location.origin + '/';
    
    // Get NODE_ENV safely
    const getNodeEnv = function() {
      try {
        return (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';
      } catch (e) {
        return 'development';
      }
    };
    
    const nodeEnv = getNodeEnv();
    
    // Polyfill import.meta object
    Object.defineProperty(window, 'importMeta', {
      value: {
        url: baseUrl,
        env: {
          MODE: nodeEnv,
          DEV: nodeEnv !== 'production',
          PROD: nodeEnv === 'production',
        }
      },
      writable: false,
      configurable: false
    });

    // Transform import.meta in the global scope
    // This will be handled by the bundler, but we provide a fallback
    if (typeof globalThis !== 'undefined') {
      globalThis.importMeta = window.importMeta;
    }
  })();
}

