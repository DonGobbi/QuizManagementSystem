'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path ? 'bg-primary-700 text-white' : 'text-primary-100 hover:bg-primary-700 hover:text-white';
  };

  return (
    <nav className="bg-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">
                Quiz Management
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}>
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link href="/admin/quizzes" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/quizzes')}`}>
                      Manage Quizzes
                    </Link>
                    <Link href="/admin/results" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/results')}`}>
                      View Results
                    </Link>
                  </>
                )}
                {user?.role === 'student' && (
                  <>
                    <Link href="/student/quizzes" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/student/quizzes')}`}>
                      Available Quizzes
                    </Link>
                    <Link href="/student/results" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/student/results')}`}>
                      My Results
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="flex items-center">
                  <span className="text-white mr-4">
                    Hello, {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-700 hover:bg-primary-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-700 hover:bg-primary-600">
                    Login
                  </Link>
                  <Link href="/signup" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-500">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-primary-700 inline-flex items-center justify-center p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
            {user?.role === 'admin' && (
              <>
                <Link href="/admin/quizzes" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin/quizzes')}`}>
                  Manage Quizzes
                </Link>
                <Link href="/admin/results" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin/results')}`}>
                  View Results
                </Link>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <Link href="/student/quizzes" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/student/quizzes')}`}>
                  Available Quizzes
                </Link>
                <Link href="/student/results" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/student/results')}`}>
                  My Results
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-primary-700">
            {user ? (
              <div className="px-2 space-y-1">
                <div className="block px-3 py-2 text-base font-medium text-white">
                  {user.displayName || user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-100 hover:text-white hover:bg-primary-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-primary-100 hover:text-white hover:bg-primary-700">
                  Login
                </Link>
                <Link href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-primary-100 hover:text-white hover:bg-primary-700">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
