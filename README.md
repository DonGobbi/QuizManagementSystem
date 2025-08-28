# Quiz Management System

A comprehensive web application for creating, managing, and taking quizzes. Built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## Features

### For Administrators
- Create and manage quizzes with multiple-choice and true/false questions
- Set custom passing criteria for each quiz
- Set time limits for quiz completion
- View detailed analytics of student performance
- Publish or unpublish quizzes to control student access
- Edit existing quizzes
- View detailed results for each student attempt

### For Students
- Browse available published quizzes
- Take quizzes with an intuitive interface
- View countdown timer during timed quizzes
- Auto-submit when time expires
- Can only take each quiz once
- Receive instant pass/fail feedback
- Review detailed results with correct answers
- Track performance history across all quizzes

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Heroicons

## Project Structure

```
quiz-management-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin pages
│   │   ├── student/            # Student pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # UI components
│   ├── context/                # React context
│   │   └── AuthContext.tsx     # Authentication context
│   └── lib/                    # Utility functions
│       └── firebase.ts         # Firebase configuration
├── package.json                # Dependencies
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/quiz-management-system.git
cd quiz-management-system
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up Firebase
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```
   - You can find these values in your Firebase project settings

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Collections

#### users
- `uid`: string (Firebase Auth UID)
- `email`: string
- `displayName`: string
- `role`: string ('admin' or 'student')
- `createdAt`: timestamp

#### quizzes
- `id`: string (auto-generated)
- `title`: string
- `description`: string
- `questions`: array of Question objects
- `passingPercentage`: number
- `timeLimit`: number (minutes)
- `isPublished`: boolean
- `createdBy`: string (admin UID)
- `createdAt`: timestamp
- `updatedAt`: timestamp

#### attempts
- `id`: string (auto-generated)
- `quizId`: string (reference to quiz)
- `quizTitle`: string
- `studentId`: string (reference to user)
- `studentName`: string
- `quizCreatedBy`: string (admin UID)
- `score`: number
- `passed`: boolean
- `answers`: object (questionId -> selectedOptionId)
- `completedAt`: timestamp

## License

This project is licensed under the MIT License.

## Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Firebase for the backend services
