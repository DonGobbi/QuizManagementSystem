'use client';

import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    router.push('/login');
    return null;
  }

  // If admin access required but user is not admin, redirect to dashboard
  if (requireAdmin && user.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
