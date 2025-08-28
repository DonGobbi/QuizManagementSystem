'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-primary-800">Quiz Management System</h1>
          <div className="space-x-4">
            <Link href="/login" className="btn-primary">
              Sign In
            </Link>
            <Link href="/signup" className="btn-secondary">
              Sign Up
            </Link>
          </div>
        </header>

        <main className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Streamlined Quiz Management for Educators and Students
            </h2>
            <p className="text-lg text-secondary-700 mb-8">
              Create, manage, and take quizzes with our intuitive platform. 
              Perfect for educators to assess student knowledge and for students to test their understanding.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup?role=admin" className="btn-primary text-center py-3 px-8">
                I&apos;m an Educator
              </Link>
              <Link href="/signup?role=student" className="btn-secondary text-center py-3 px-8">
                I&apos;m a Student
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-xl p-6 border border-primary-100">
              <h3 className="text-2xl font-bold text-primary-800 mb-4">Key Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900">Easy Quiz Creation</h4>
                    <p className="text-secondary-700">Create multiple-choice and true/false quizzes with customizable passing criteria.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900">Instant Feedback</h4>
                    <p className="text-secondary-700">Students receive immediate pass/fail results after completing quizzes.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900">Comprehensive Analytics</h4>
                    <p className="text-secondary-700">Track student performance and quiz statistics over time.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
