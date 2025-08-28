'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false';
  options: QuestionOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingPercentage: number;
}

interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  completedAt: Date;
}

export default function AdminQuizResultPage() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAttemptAndQuiz = async () => {
      if (!user || !attemptId) return;

      try {
        // Fetch attempt data
        const attemptDoc = await getDoc(doc(db, 'attempts', attemptId as string));
        
        if (!attemptDoc.exists()) {
          toast.error('Attempt not found');
          router.push('/admin/results');
          return;
        }
        
        const attemptData = {
          id: attemptDoc.id,
          ...attemptDoc.data(),
          completedAt: attemptDoc.data().completedAt?.toDate() || new Date()
        } as Attempt;
        
        // Verify this attempt belongs to a quiz created by the current admin
        if (attemptData.quizCreatedBy !== user.uid) {
          toast.error('You do not have permission to view this result');
          router.push('/admin/results');
          return;
        }
        
        setAttempt(attemptData);
        
        // Fetch quiz data
        const quizDoc = await getDoc(doc(db, 'quizzes', attemptData.quizId));
        
        if (!quizDoc.exists()) {
          toast.error('Quiz not found');
          return;
        }
        
        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data()
        } as Quiz;
        
        setQuiz(quizData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptAndQuiz();
  }, [user, attemptId, router]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout requireAdmin>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!attempt || !quiz) {
    return (
      <DashboardLayout requireAdmin>
        <div className="p-6">
          <p className="text-center text-red-500">Result not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requireAdmin>
      <div className="px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Link href="/admin/results" className="text-primary-600 hover:text-primary-800 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Result Details</h1>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Quiz Information</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700"><span className="font-medium">Title:</span> {quiz.title}</p>
                  <p className="text-gray-700 mt-2"><span className="font-medium">Description:</span> {quiz.description}</p>
                  <p className="text-gray-700 mt-2"><span className="font-medium">Passing Score:</span> {quiz.passingPercentage}%</p>
                  <p className="text-gray-700 mt-2"><span className="font-medium">Questions:</span> {quiz.questions.length}</p>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Student Result</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700"><span className="font-medium">Student:</span> {attempt.studentName || 'Unknown'}</p>
                  <p className="text-gray-700 mt-2"><span className="font-medium">Completed:</span> {formatDate(attempt.completedAt)}</p>
                  <p className="text-gray-700 mt-2"><span className="font-medium">Score:</span> <span className="text-lg font-bold text-primary-600">{attempt.score}%</span></p>
                  <p className="text-gray-700 mt-2">
                    <span className="font-medium">Result:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-gray-900 mb-4">Question Analysis</h3>
          
          <div className="space-y-6">
            {quiz.questions.map((question, index) => {
              const selectedOptionId = attempt.answers[question.id];
              const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
              const correctOption = question.options.find(opt => opt.isCorrect);
              const isCorrect = selectedOptionId === correctOption?.id;
              
              return (
                <div 
                  key={question.id} 
                  className={`border rounded-lg p-4 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 mb-4">{question.text}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div 
                        key={option.id} 
                        className={`p-2 rounded ${
                          option.id === selectedOptionId && option.isCorrect
                            ? 'bg-green-200 border border-green-300'
                            : option.id === selectedOptionId && !option.isCorrect
                            ? 'bg-red-200 border border-red-300'
                            : option.isCorrect
                            ? 'bg-green-100 border border-green-200'
                            : 'bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="mr-2">
                            {option.id === selectedOptionId ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={option.isCorrect ? 'font-medium' : ''}>{option.text}</span>
                          {option.isCorrect && (
                            <span className="ml-2 text-green-600 text-sm">(Correct answer)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
