// This file is a server component that exports generateStaticParams
// for Next.js static export compatibility

export function generateStaticParams() {
  // For static export, we'll generate a placeholder path
  // The actual data will be fetched client-side
  return [{ quizId: 'placeholder' }];
}
