import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <div className="text-6xl text-neutral-700 mb-3">404</div>
        <h1 className="text-lg font-medium text-neutral-200 mb-1">Page not found</h1>
        <p className="text-sm text-neutral-500 mb-6">This is the admin panel for CertiPractice.</p>
        <Link to="/" className="btn btn-primary">Go to dashboard</Link>
      </div>
    </div>
  );
}
