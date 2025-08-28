'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useForm, useFieldArray } from 'react-hook-form';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

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
  timeLimit: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FormValues {
  title: string;
  description: string;
  passingPercentage: number;
  timeLimit: number;
  isPublished: boolean;
  questions: Question[];
}

export default function EditQuizPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions'
  });
  
  const watchQuestions = watch('questions');

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user || !quizId) return;

      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId as string));
        
        if (!quizDoc.exists()) {
          toast.error('Quiz not found');
          router.push('/admin/quizzes');
          return;
        }
        
        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data(),
          createdAt: quizDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: quizDoc.data().updatedAt?.toDate() || new Date()
        } as Quiz;
        
        // Verify this quiz belongs to the current admin
        if (quizData.createdBy !== user.uid) {
          toast.error('You do not have permission to edit this quiz');
          router.push('/admin/quizzes');
          return;
        }
        
        // Set form values
        setValue('title', quizData.title);
        setValue('description', quizData.description);
        setValue('passingPercentage', quizData.passingPercentage);
        setValue('timeLimit', quizData.timeLimit || 30); // Default to 30 minutes if not set
        setValue('isPublished', quizData.isPublished);
        setValue('questions', quizData.questions);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [user, quizId, router, setValue]);

  const addQuestion = () => {
    append({
      id: uuidv4(),
      text: '',
      type: 'multiple-choice',
      options: [
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false }
      ]
    });
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = watchQuestions[questionIndex].options || [];
    setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { id: uuidv4(), text: '', isCorrect: false }
    ]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = [...watchQuestions[questionIndex].options];
    currentOptions.splice(optionIndex, 1);
    setValue(`questions.${questionIndex}.options`, currentOptions);
  };

  const handleOptionCorrectChange = (questionIndex: number, optionIndex: number) => {
    const currentOptions = [...watchQuestions[questionIndex].options];
    
    // Set all options to not correct
    currentOptions.forEach((option, idx) => {
      currentOptions[idx] = { ...option, isCorrect: false };
    });
    
    // Set the selected option to correct
    currentOptions[optionIndex] = { ...currentOptions[optionIndex], isCorrect: true };
    
    setValue(`questions.${questionIndex}.options`, currentOptions);
  };

  const onSubmit = async (data: FormValues) => {
    if (!user || !quizId) return;
    
    // Validate that each question has a correct answer
    const invalidQuestions = data.questions.filter(question => 
      !question.options.some(option => option.isCorrect)
    );
    
    if (invalidQuestions.length > 0) {
      toast.error(`Please select a correct answer for all questions (${invalidQuestions.length} missing)`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const quizRef = doc(db, 'quizzes', quizId as string);
      
      await updateDoc(quizRef, {
        title: data.title,
        description: data.description,
        passingPercentage: data.passingPercentage,
        timeLimit: data.timeLimit,
        isPublished: data.isPublished,
        questions: data.questions,
        updatedAt: new Date()
      });
      
      toast.success('Quiz updated successfully!');
      router.push('/admin/quizzes');
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Failed to update quiz');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <DashboardLayout requireAdmin>
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/quizzes" className="text-primary-600 hover:text-primary-800 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quiz Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Quiz Title
                </label>
                <input
                  id="title"
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="input-field w-full"
                  placeholder="Enter quiz title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  rows={3}
                  className="input-field w-full"
                  placeholder="Enter quiz description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="passingPercentage" className="block text-sm font-medium text-gray-700">
                  Passing Percentage
                </label>
                <input
                  id="passingPercentage"
                  type="number"
                  min="1"
                  max="100"
                  {...register('passingPercentage', { 
                    required: 'Passing percentage is required',
                    min: { value: 1, message: 'Minimum value is 1%' },
                    max: { value: 100, message: 'Maximum value is 100%' },
                    valueAsNumber: true
                  })}
                  className="input-field w-full"
                />
                {errors.passingPercentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.passingPercentage.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                  Time Limit (minutes)
                </label>
                <input
                  id="timeLimit"
                  type="number"
                  min="1"
                  {...register('timeLimit', { 
                    required: 'Time limit is required',
                    min: { value: 1, message: 'Minimum time limit is 1 minute' },
                    valueAsNumber: true
                  })}
                  className="input-field w-full"
                />
                {errors.timeLimit && (
                  <p className="text-red-500 text-sm mt-1">{errors.timeLimit.message}</p>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  id="isPublished"
                  type="checkbox"
                  {...register('isPublished')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                  Publish quiz (make it available to students)
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-secondary text-sm"
              >
                Add Question
              </button>
            </div>
            
            {fields.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No questions added yet. Click "Add Question" to start.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((question, questionIndex) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900">Question {questionIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => remove(questionIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`questions.${questionIndex}.text`} className="block text-sm font-medium text-gray-700">
                          Question Text
                        </label>
                        <input
                          id={`questions.${questionIndex}.text`}
                          type="text"
                          {...register(`questions.${questionIndex}.text` as const, { 
                            required: 'Question text is required' 
                          })}
                          className="input-field w-full"
                          placeholder="Enter question text"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`questions.${questionIndex}.type`} className="block text-sm font-medium text-gray-700">
                          Question Type
                        </label>
                        <select
                          id={`questions.${questionIndex}.type`}
                          {...register(`questions.${questionIndex}.type` as const)}
                          className="input-field w-full"
                        >
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Options (select one correct answer)
                          </label>
                          <button
                            type="button"
                            onClick={() => addOption(questionIndex)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Add Option
                          </button>
                        </div>
                        
                        {watchQuestions && watchQuestions[questionIndex]?.options?.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center space-x-2 mb-2">
                            <input
                              type="radio"
                              id={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                              name={`questions[${questionIndex}].correctOption`}
                              checked={option.isCorrect}
                              onChange={() => handleOptionCorrectChange(questionIndex, optionIndex)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <input
                              type="text"
                              {...register(`questions.${questionIndex}.options.${optionIndex}.text` as const, {
                                required: 'Option text is required'
                              })}
                              className="input-field flex-grow"
                              placeholder="Option text"
                            />
                            {watchQuestions[questionIndex].options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete option"
                                aria-label="Delete option"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link href="/admin/quizzes" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`btn-primary ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
