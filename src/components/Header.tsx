import { Link } from 'react-router-dom';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ showBack, onBack }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/85 backdrop-blur-md border-b border-black/5">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {showBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-ink/70 hover:text-ink transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        ) : (
          <div />
        )}

        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          Pick<span className="text-accent">Design</span>
        </Link>

        <div className="w-16" /> {/* Spacer for centering */}
      </div>
    </header>
  );
}
