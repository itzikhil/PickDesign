interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export function LoadingSpinner({ message, submessage }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Elegant pulsing dots */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full bg-accent animate-pulse-soft"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-3 h-3 rounded-full bg-accent animate-pulse-soft"
          style={{ animationDelay: '300ms' }}
        />
        <div
          className="w-3 h-3 rounded-full bg-accent animate-pulse-soft"
          style={{ animationDelay: '600ms' }}
        />
      </div>
      {message && (
        <p className="mt-6 font-display text-xl font-semibold text-ink">{message}</p>
      )}
      {submessage && (
        <p className="mt-2 text-sm text-ink/60">{submessage}</p>
      )}
    </div>
  );
}
