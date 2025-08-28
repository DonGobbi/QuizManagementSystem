'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

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
  createdBy: string;
  creatorName?: string;
  timeLimit?: number; // Time limit in minutes
  isPublished?: boolean;
}

export default function TakeQuizPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [hasAttempted, setHasAttempted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [autoSubmitInProgress, setAutoSubmitInProgress] = useState(false);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user || !quizId) return;

      try {
        // Check if user has already attempted this quiz
        const attemptsQuery = query(
          collection(db, 'attempts'),
          where('quizId', '==', quizId),
          where('studentId', '==', user.uid)
        );
        
        const attemptsSnapshot = await getDocs(attemptsQuery);
        if (!attemptsSnapshot.empty) {
          setHasAttempted(true);
          // Redirect to results page if already attempted
          const attemptId = attemptsSnapshot.docs[0].id;
          router.push(`/student/results/${attemptId}`);
          return;
        }
        
        // Fetch quiz data
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId as string));
        
        if (!quizDoc.exists()) {
          toast.error('Quiz not found');
          router.push('/student/quizzes');
          return;
        }
        
        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data()
        } as Quiz;
        
        // Check if quiz is published
        if (!quizData.isPublished) {
          toast.error('This quiz is not available');
          router.push('/student/quizzes');
          return;
        }
        
        // Get creator name
        try {
          const creatorDoc = await getDoc(doc(db, 'users', quizData.createdBy));
          if (creatorDoc.exists()) {
            quizData.creatorName = creatorDoc.data().displayName || 'Unknown';
          }
        } catch (error) {
          console.error('Error fetching creator name:', error);
        }
        
        setQuiz(quizData);
        
        // Initialize timer if quiz has a time limit
        if (quizData.timeLimit) {
          // Convert minutes to seconds
          const totalSeconds = quizData.timeLimit * 60;
          setTimeRemaining(totalSeconds);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [user, quizId, router]);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || loading || submitting) return;
    
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerInterval);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [timeRemaining, loading, submitting]);
  
  // Auto-submit when timer expires
  useEffect(() => {
    if (timerExpired && !submitting && !autoSubmitInProgress && quiz) {
      setAutoSubmitInProgress(true);
      toast.error('Time is up! Submitting your quiz...');
      handleSubmitQuiz(true);
    }
  }, [timerExpired, submitting, autoSubmitInProgress, quiz]);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    
    let correctAnswers = 0;
    
    quiz.questions.forEach(question => {
      const selectedOptionId = selectedAnswers[question.id];
      const correctOption = question.options.find(option => option.isCorrect);
      
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        correctAnswers++;
      }
    });
    
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  const handleSubmitQuiz = async (forceSubmit = false) => {
    if (!quiz || !user) return;
    
    // Check if all questions are answered (unless force submit due to time expiration)
    if (!forceSubmit) {
      const unansweredQuestions = quiz.questions.filter(
        question => !selectedAnswers[question.id]
      );
      
      if (unansweredQuestions.length > 0) {
        toast.error(`Please answer all questions before submitting (${unansweredQuestions.length} remaining)`);
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const score = calculateScore();
      const passed = score >= quiz.passingPercentage;
      
      // Create attempt record
      const attemptData = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId: user.uid,
        studentName: user.displayName,
        quizCreatedBy: quiz.createdBy,
        score,
        passed,
        answers: selectedAnswers,
        completedAt: serverTimestamp()
      };
      
      const attemptRef = await addDoc(collection(db, 'attempts'), attemptData);
      
      toast.success('Quiz submitted successfully!');
      router.push(`/student/results/${attemptRef.id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (hasAttempted) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-center">Redirecting to your previous attempt...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-center text-red-500">Quiz not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const answeredQuestionsCount = Object.keys(selectedAnswers).length;
  const totalQuestionsCount = quiz.questions.length;

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            {timeRemaining !== null && (
              <div className={`text-lg font-bold ${timeRemaining < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-2">{quiz.description}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium text-gray-500">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
            <div className="text-sm font-medium text-gray-500">
              {answeredQuestionsCount} of {totalQuestionsCount} answered
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">{currentQuestion.text}</h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={option.id}
                    name={`question-${currentQuestion.id}`}
                    checked={selectedAnswers[currentQuestion.id] === option.id}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={option.id} className="ml-3 block text-gray-700">
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePreviousQuestion}
              disabled={isFirstQuestion}
              className={`px-4 py-2 rounded-md ${
                isFirstQuestion
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-secondary-200 text-secondary-800 hover:bg-secondary-300'
              }`}
            >
              Previous
            </button>
            
            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => handleSubmitQuiz()}
                disabled={submitting || (!timerExpired && answeredQuestionsCount !== totalQuestionsCount)}
                className={`px-4 py-2 rounded-md ${
                  submitting || answeredQuestionsCount !== totalQuestionsCount
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {quiz.questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`h-10 w-10 rounded-md flex items-center justify-center ${
                  currentQuestionIndex === index
                    ? 'bg-primary-600 text-white'
                    : selectedAnswers[question.id]
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              <span className="inline-block h-3 w-3 bg-primary-100 mr-1"></span>
              <span>Answered</span>
            </div>
            <div>
              <span className="inline-block h-3 w-3 bg-primary-600 mr-1"></span>
              <span>Current</span>
            </div>
            <div>
              <span className="inline-block h-3 w-3 bg-gray-100 mr-1"></span>
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
