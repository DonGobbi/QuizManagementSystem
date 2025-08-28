'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  passingPercentage: number;
  questions: Question[];
  createdAt: any;
  createdBy: string;
  isPublished: boolean;
}

export default function QuizDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        
        if (!quizDoc.exists()) {
          setError('Quiz not found');
          return;
        }
        
        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data(),
        } as Quiz;
        
        setQuiz(quizData);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !quiz) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error || 'Quiz not found'}</p>
          </div>
          <Link href="/admin/quizzes" className="btn-secondary">
            Back to Quizzes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <div className="flex space-x-3">
            <Link 
              href={`/admin/quizzes/edit/${quiz.id}/`}
              className="btn-secondary"
            >
              Edit Quiz
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Quiz Details</h2>
            <p className="text-gray-600 mb-4">{quiz.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Time Limit:</span> {quiz.timeLimit} minutes
              </div>
              <div>
                <span className="text-gray-500">Passing Score:</span> {quiz.passingPercentage}%
              </div>
              <div>
                <span className="text-gray-500">Questions:</span> {quiz.questions?.length || 0}
              </div>
              <div>
                <span className="text-gray-500">Created:</span> {formatDate(quiz.createdAt)}
              </div>
              <div>
                <span className="text-gray-500">Status:</span> 
                <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                  quiz.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Questions</h2>
            
            {quiz.questions && quiz.questions.length > 0 ? (
              <div className="space-y-6">
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {index + 1}. {question.text}
                    </h3>
                    
                    <div className="ml-4 space-y-2">
                      {question.options.map((option) => (
                        <div 
                          key={option.id} 
                          className={`p-2 rounded ${
                            option.isCorrect 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 mr-2 rounded-full ${
                              option.isCorrect 
                                ? 'bg-green-500' 
                                : 'bg-gray-300'
                            }`}></div>
                            <span className={option.isCorrect ? 'font-medium' : ''}>
                              {option.text}
                            </span>
                            {option.isCorrect && (
                              <span className="ml-2 text-xs text-green-600">
                                (Correct Answer)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions added to this quiz yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Link href="/admin/quizzes" className="btn-secondary">
            Back to Quizzes
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
