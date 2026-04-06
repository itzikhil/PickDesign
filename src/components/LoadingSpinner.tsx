interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export function LoadingSpinner({ message, submessage }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-warm rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      {message && (
        <p className="mt-6 text-lg font-semibold text-ink">{message}</p>
      )}
      {submessage && (
        <p className="mt-2 text-sm text-ink/60">{submessage}</p>
      )}
    </div>
  );
}
