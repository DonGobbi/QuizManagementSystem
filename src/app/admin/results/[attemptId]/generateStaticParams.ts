export function generateStaticParams() {
  // For static export, we'll generate a placeholder path
  // The actual data will be fetched client-side
  return [{ attemptId: 'placeholder' }];
}
