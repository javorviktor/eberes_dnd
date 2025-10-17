'use client';
import { useEffect } from 'react';

export default function RootRedirect() {
  useEffect(() => {
    // Check if user is logged in
    const token = sessionStorage.getItem('authToken');
    
    if (token) {
      // User is logged in, redirect to dashboard
      window.location.replace('/home');
    } else {
      // User is not logged in, redirect to auth
      window.location.replace('/auth');
    }
  }, []);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">D&D Character Builder</h1>
        <p className="text-slate-600">Redirecting you to the right place...</p>
      </div>
    </div>
  );
}
