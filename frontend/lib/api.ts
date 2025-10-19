// API configuration utility for both local and production environments
export function getApiUrl(): string {
  // If we're in the browser, use the current hostname with port 4000
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If accessing via production domain, use HTTPS
    if (hostname === 'garagednd.botanyrobotics.com') {
      return 'https://garagednd.botanyrobotics.com';
    }
    
    // If accessing via localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    
    // If accessing via VM IP, use the same IP for API
    if (hostname === '192.168.0.130') {
      return 'http://192.168.0.130:4000';
    }
    
    // For any other local network IP, use the same IP for API
    return `${protocol}//${hostname}:4000`;
  }
  
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export const API_URL = getApiUrl();
