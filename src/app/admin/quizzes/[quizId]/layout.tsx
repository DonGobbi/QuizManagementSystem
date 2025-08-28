// Server component that exports generateStaticParams
export function generateStaticParams() {
  // For static export, we'll generate a placeholder path
  // The actual data will be fetched client-side
  return [{ quizId: 'placeholder' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
