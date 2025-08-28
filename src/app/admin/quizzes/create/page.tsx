'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

type QuestionType = 'multiple-choice' | 'true-false';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
}

interface FormData {
  title: string;
  description: string;
  passingPercentage: number;
  timeLimit: number;
  questions: Question[];
  isPublished: boolean;
}

export default function CreateQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      passingPercentage: 60,
      timeLimit: 30,
      questions: [
        {
          id: crypto.randomUUID(),
          text: '',
          type: 'multiple-choice',
          options: [
            { id: crypto.randomUUID(), text: '', isCorrect: false },
            { id: crypto.randomUUID(), text: '', isCorrect: false },
            { id: crypto.randomUUID(), text: '', isCorrect: false },
            { id: crypto.randomUUID(), text: '', isCorrect: false }
          ]
        }
      ],
      isPublished: false
    }
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions'
  });

  const watchQuestions = watch('questions');

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type,
      options: type === 'multiple-choice' 
        ? [
            { id: crypto.randomUUID(), text: '', isCorrect: false },
            { id: crypto.randomUUID(), text: '', isCorrect: false },
            { id: crypto.randomUUID(), text: '', isCorrect: false },
            { id: crypto.randomUUID(), text: '', isCorrect: false }
          ]
        : [
            { id: crypto.randomUUID(), text: 'True', isCorrect: false },
            { id: crypto.randomUUID(), text: 'False', isCorrect: false }
          ]
    };
    
    appendQuestion(newQuestion);
  };

  const handleOptionCorrectChange = (questionIndex: number, optionIndex: number) => {
    const newOptions = [...watchQuestions[questionIndex].options];
    
    // For multiple choice, uncheck all other options
    if (watchQuestions[questionIndex].type === 'multiple-choice') {
      newOptions.forEach((option, idx) => {
        newOptions[idx] = { ...option, isCorrect: idx === optionIndex };
      });
    } 
    // For true/false, toggle the selected option and set the other to the opposite
    else {
      newOptions.forEach((option, idx) => {
        newOptions[idx] = { ...option, isCorrect: idx === optionIndex };
      });
    }
    
    setValue(`questions.${questionIndex}.options`, newOptions);
  };

  const onSubmit = async (data: FormData, isDraft: boolean = false) => {
    if (!user) {
      toast.error('You must be logged in to create a quiz');
      return;
    }

    // Validate that each question has a correct answer
    const invalidQuestions = data.questions.filter(question => 
      !question.options.some(option => option.isCorrect)
    );

    if (invalidQuestions.length > 0) {
      toast.error(`Question ${data.questions.indexOf(invalidQuestions[0]) + 1} doesn't have a correct answer selected`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare quiz data
      const quizData = {
        title: data.title,
        description: data.description,
        passingPercentage: data.passingPercentage,
        timeLimit: data.timeLimit,
        questions: data.questions,
        isPublished: !isDraft,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        questionCount: data.questions.length
      };

      // Add quiz to Firestore
      const docRef = await addDoc(collection(db, 'quizzes'), quizData);
      
      toast.success(isDraft ? 'Quiz saved as draft' : 'Quiz published successfully');
      router.push(`/admin/quizzes/${docRef.id}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Quiz</h1>
        
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quiz Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="form-label">Quiz Title</label>
                <input
                  id="title"
                  type="text"
                  className="input-field"
                  placeholder="Enter quiz title"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              
              <div>
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  rows={3}
                  className="input-field"
                  placeholder="Enter quiz description"
                  {...register('description', { required: 'Description is required' })}
                ></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              
              <div>
                <label htmlFor="passingPercentage" className="form-label">Passing Percentage</label>
                <input
                  id="passingPercentage"
                  type="number"
                  min="1"
                  max="100"
                  className="input-field"
                  {...register('passingPercentage', { 
                    required: 'Passing percentage is required',
                    min: {
                      value: 1,
                      message: 'Minimum passing percentage is 1%'
                    },
                    max: {
                      value: 100,
                      message: 'Maximum passing percentage is 100%'
                    }
                  })}
                />
                {errors.passingPercentage && <p className="text-red-500 text-xs mt-1">{errors.passingPercentage.message}</p>}
              </div>
              
              <div>
                <label htmlFor="timeLimit" className="form-label">Time Limit (minutes)</label>
                <input
                  id="timeLimit"
                  type="number"
                  min="1"
                  className="input-field"
                  {...register('timeLimit', { 
                    required: 'Time limit is required',
                    min: {
                      value: 1,
                      message: 'Minimum time limit is 1 minute'
                    }
                  })}
                />
                {errors.timeLimit && <p className="text-red-500 text-xs mt-1">{errors.timeLimit.message}</p>}
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple-choice')}
                  className="btn-secondary text-sm"
                >
                  Add Multiple Choice
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('true-false')}
                  className="btn-secondary text-sm"
                >
                  Add True/False
                </button>
              </div>
            </div>
            
            {questionFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No questions added yet. Use the buttons above to add questions.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {questionFields.map((field, questionIndex) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Question {questionIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Question Text</label>
                        <textarea
                          className="input-field"
                          rows={2}
                          placeholder="Enter your question"
                          {...register(`questions.${questionIndex}.text`, { 
                            required: 'Question text is required' 
                          })}
                        ></textarea>
                        {errors.questions?.[questionIndex]?.text && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.questions[questionIndex]?.text?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label">Options</label>
                        <p className="text-sm text-gray-500 mb-2">
                          Select the correct answer by clicking the radio button.
                        </p>
                        
                        <div className="space-y-2">
                          {watchQuestions[questionIndex].options.map((option, optionIndex) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`question-${questionIndex}-option-${optionIndex}`}
                                name={`question-${questionIndex}-correct`}
                                aria-label={`Mark as correct answer for option ${optionIndex + 1}`}
                                title="Mark as correct answer"
                                checked={option.isCorrect}
                                onChange={() => handleOptionCorrectChange(questionIndex, optionIndex)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                              />
                              <input
                                type="text"
                                className="input-field flex-grow"
                                placeholder={`Option ${optionIndex + 1}`}
                                value={watchQuestions[questionIndex].options[optionIndex].text}
                                readOnly={watchQuestions[questionIndex].type === 'true-false'}
                                {...register(`questions.${questionIndex}.options.${optionIndex}.text`, {
                                  required: 'Option text is required'
                                })}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => onSubmit(watch(), true)}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Quiz'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
