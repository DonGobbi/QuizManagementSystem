'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  questionCount: number;
  passingPercentage: number;
  createdBy: string;
  creatorName?: string;
}

export default function StudentQuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;

      try {
        // Get all published quizzes
        const quizzesQuery = query(
          collection(db, 'quizzes'),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const quizzesSnapshot = await getDocs(quizzesQuery);
        const quizzesData = quizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Quiz[];
        
        // Get attempted quizzes by this student
        const attemptsQuery = query(
          collection(db, 'attempts'),
          where('studentId', '==', user.uid)
        );
        
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const attemptedQuizIds = new Set(
          attemptsSnapshot.docs.map(doc => doc.data().quizId)
        );
        
        // Add an "attempted" flag to each quiz
        const quizzesWithAttemptedFlag = await Promise.all(
          quizzesData.map(async (quiz) => {
            // Get creator name
            let creatorName = 'Unknown';
            try {
              const creatorDoc = await getDocs(
                query(collection(db, 'users'), where('uid', '==', quiz.createdBy))
              );
              if (!creatorDoc.empty) {
                creatorName = creatorDoc.docs[0].data().displayName || 'Unknown';
              }
            } catch (error) {
              console.error('Error fetching creator name:', error);
            }
            
            return {
              ...quiz,
              attempted: attemptedQuizIds.has(quiz.id),
              creatorName
            };
          })
        );
        
        setQuizzes(quizzesWithAttemptedFlag);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast.error('Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [user]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h1>

        {loading ? (
          <div className="py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
                    
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span>{quiz.questionCount} questions</span>
                      <span>Pass: {quiz.passingPercentage}%</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-6">
                      <p>Created by: {quiz.creatorName}</p>
                      <p>Date: {formatDate(quiz.createdAt)}</p>
                    </div>
                    
                    <Link 
                      href={`/student/quizzes/${quiz.id}`}
                      className="btn-primary w-full text-center block"
                    >
                      Take Quiz
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 mb-4">No quizzes available at the moment.</p>
                <p className="text-gray-500">Please check back later.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
