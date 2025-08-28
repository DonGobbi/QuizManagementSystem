'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface QuizSummary {
  id: string;
  title: string;
  description: string;
  createdAt: string | Date;
  questionCount: number;
  timeLimit?: number;
  isPublished?: boolean;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: string | Date;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentQuizzes, setRecentQuizzes] = useState<QuizSummary[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch data based on user role
        if (user.role === 'admin') {
          // For admin: fetch recent quizzes created by this admin
          const quizzesQuery = query(
            collection(db, 'quizzes'),
            where('createdBy', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          
          const quizzesSnapshot = await getDocs(quizzesQuery);
          const quizzesData = quizzesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          })) as QuizSummary[];
          
          setRecentQuizzes(quizzesData);
          
          // Fetch recent quiz attempts for admin's quizzes
          const attemptsQuery = query(
            collection(db, 'attempts'),
            where('quizCreatedBy', '==', user.uid),
            orderBy('completedAt', 'desc'),
            limit(5)
          );
          
          const attemptsSnapshot = await getDocs(attemptsQuery);
          const attemptsData = attemptsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate?.() || new Date(),
          })) as QuizAttempt[];
          
          setRecentAttempts(attemptsData);
        } else {
          // For student: first fetch all attempts by this student
          try {
            // Fetch all student's quiz attempts (not just recent ones)
            const allAttemptsQuery = query(
              collection(db, 'attempts'),
              where('studentId', '==', user.uid)
            );
            
            const allAttemptsSnapshot = await getDocs(allAttemptsQuery);
            // Create an array of quiz IDs that the student has already taken
            const attemptedQuizIds: string[] = [];
            allAttemptsSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.quizId) {
                attemptedQuizIds.push(data.quizId);
              }
            });
            
            console.log('Attempted quiz IDs:', attemptedQuizIds);
            
            // Now fetch available quizzes
            const quizzesQuery = query(
              collection(db, 'quizzes'),
              limit(20) // Fetch more since we'll filter some out
            );
            
            const quizzesSnapshot = await getDocs(quizzesQuery);
            const quizzesData = quizzesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            })) as QuizSummary[];
            
            console.log('All quizzes before filtering:', quizzesData.map(q => ({ id: q.id, title: q.title })));
            
            // Filter out quizzes the student has already taken
            const availableQuizzes = quizzesData.filter(quiz => {
              const alreadyTaken = attemptedQuizIds.includes(quiz.id);
              console.log(`Quiz ${quiz.id} (${quiz.title}) - already taken: ${alreadyTaken}`);
              return !alreadyTaken;
            });
            
            console.log('Available quizzes after filtering:', availableQuizzes.map(q => ({ id: q.id, title: q.title })));
            
            // Sort client-side instead of using orderBy
            const sortedQuizzes = availableQuizzes.sort((a, b) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime(); // descending order
            }).slice(0, 5); // Take only 5 quizzes
            
            setRecentQuizzes(sortedQuizzes);
            
            // Fetch student's recent quiz attempts for display
            const recentAttemptsQuery = query(
              collection(db, 'attempts'),
              where('studentId', '==', user.uid),
              orderBy('completedAt', 'desc'),
              limit(5)
            );
            
            const attemptsSnapshot = await getDocs(recentAttemptsQuery);
            const attemptsData = attemptsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              completedAt: doc.data().completedAt?.toDate?.() || new Date(),
            })) as QuizAttempt[];
            
            setRecentAttempts(attemptsData);
          } catch (error) {
            console.error('Error fetching student data:', error);
            setRecentQuizzes([]);
            setRecentAttempts([]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatDate = (date: string | Date) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {user?.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
        </h1>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {user?.role === 'admin' ? 'Your Recent Quizzes' : 'Available Quizzes'}
                  </h2>
                  <Link 
                    href={user?.role === 'admin' ? '/admin/quizzes' : '/student/quizzes'} 
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    View all
                  </Link>
                </div>

                {user?.role === 'student' && (
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>
                    {recentQuizzes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentQuizzes.map((quiz) => (
                          <Link 
                            href={`/quizzes/${quiz.id}`} 
                            key={quiz.id}
                            className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                          >
                            <h3 className="font-medium text-lg mb-2">{quiz.title}</h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{quiz.description}</p>
                            <div className="flex justify-between items-center mt-3">
                              <p className="text-xs text-gray-500">{quiz.questionCount} questions</p>
                              <p className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No time limit'}
                              </p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <button className="w-full py-1 px-3 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md transition-colors">
                                Start Quiz
                              </button>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No quizzes available at the moment.</p>
                    )}
                  </section>
                )}

                {user?.role === 'admin' && (
                  <div className="space-y-4">
                    {recentQuizzes.length > 0 ? (
                      recentQuizzes.map((quiz) => (
                        <div key={quiz.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <Link 
                            href={`/admin/quizzes/${quiz.id}`} 
                            className="block"
                          >
                            <h3 className="font-medium text-lg text-gray-900">{quiz.title}</h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{quiz.description}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{quiz.questionCount} questions</span>
                              <span>Created: {formatDate(quiz.createdAt)}</span>
                            </div>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        {user?.role === 'admin' 
                          ? 'You haven\'t created any quizzes yet.' 
                          : 'No quizzes available at the moment.'}
                      </p>
                    )}
                  </div>
                )}

                {user?.role === 'admin' && (
                  <div className="mt-6">
                    <Link href="/admin/quizzes/create" className="btn-primary w-full text-center block">
                      Create New Quiz
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {user?.role === 'admin' ? 'Recent Student Attempts' : 'Your Recent Attempts'}
                  </h2>
                  <Link 
                    href={user?.role === 'admin' ? '/admin/results' : '/student/results'} 
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    View all
                  </Link>
                </div>

                {recentAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {recentAttempts.map((attempt) => (
                      <div key={attempt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <Link 
                          href={user?.role === 'admin' 
                            ? `/admin/results/${attempt.id}` 
                            : `/student/results/${attempt.id}`
                          }
                          className="block"
                        >
                          <h3 className="font-medium text-gray-900">{attempt.quizTitle}</h3>
                          <div className="flex items-center mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              attempt.passed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              Score: {attempt.score}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Completed: {formatDate(attempt.completedAt)}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {user?.role === 'admin' 
                      ? 'No students have attempted your quizzes yet.' 
                      : 'You haven\'t attempted any quizzes yet.'
                    }
                  </div>
                )}

                {user?.role === 'student' && recentQuizzes.length > 0 && (
                  <div className="mt-6">
                    <Link href="/student/quizzes" className="btn-primary w-full text-center block">
                      Take a Quiz
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
