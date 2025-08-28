# Firebase Indexes Setup Guide

The Quiz Management System requires specific Firestore indexes to function properly. Follow these steps to create the required indexes:

## Required Indexes

### 1. Quizzes Collection Indexes

#### For Admin Dashboard:
- **Fields to index**: 
  - `createdBy` (Ascending)
  - `createdAt` (Descending)

#### For Student Dashboard:
- **Fields to index**:
  - `isPublished` (Ascending)
  - `createdAt` (Descending)

### 2. Attempts Collection Indexes

#### For Admin View:
- **Fields to index**:
  - `quizCreatedBy` (Ascending)
  - `completedAt` (Descending)

#### For Student View:
- **Fields to index**:
  - `studentId` (Ascending)
  - `completedAt` (Descending)

## How to Create Indexes

### Option 1: Using the Firebase Console (Recommended)

1. Click on the error links in your browser console:
   ```
   https://console.firebase.google.com/v1/r/project/quizmanagement-8207e/firestore/indexes/...
   ```

2. This will take you directly to the Firebase console with the index creation form pre-filled.

3. Click "Create index" to create each required index.

### Option 2: Manual Creation

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "quizmanagement-8207e"
3. In the left sidebar, click on "Firestore Database"
4. Select the "Indexes" tab
5. Click "Add index"
6. Fill in the collection name and fields as specified above
7. Click "Create"

## Verifying Indexes

After creating the indexes, they will take a few minutes to build. You can check their status in the Firebase Console under Firestore Database > Indexes.

Once all indexes are built, restart your application and the errors should be resolved.
