// API configuration utility
export function getApiUrl(): string {
  // If we're in the browser, use the current hostname with port 4000
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If accessing via localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    
    // If accessing via IP address, use the same IP for API
    return `http://${hostname}:4000`;
  }
  
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export const API_URL = getApiUrl();