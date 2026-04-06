import type {
  SpaceType,
  Goal,
  StylePreference,
  BudgetRange,
  SpecialNeed,
} from '../lib/types';
import {
  SPACE_TYPES,
  GOALS,
  STYLES,
  BUDGETS,
  SPECIAL_NEEDS,
} from '../lib/types';

interface PreferenceSelectorProps {
  spaceType: SpaceType | null;
  goal: Goal | null;
  style: StylePreference | null;
  budget: BudgetRange | null;
  specialNeeds: SpecialNeed[];
  onSpaceTypeChange: (value: SpaceType) => void;
  onGoalChange: (value: Goal) => void;
  onStyleChange: (value: StylePreference) => void;
  onBudgetChange: (value: BudgetRange) => void;
  onSpecialNeedToggle: (value: SpecialNeed) => void;
  onComplete: () => void;
}

interface OptionButtonProps<T extends string> {
  value: T;
  label: string;
  selected: boolean;
  onClick: (value: T) => void;
}

function OptionButton<T extends string>({
  value,
  label,
  selected,
  onClick,
}: OptionButtonProps<T>) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        px-4 py-3 rounded-xl font-medium text-sm transition-all
        ${selected
          ? 'bg-accent text-white shadow-md'
          : 'bg-white border border-warm hover:border-accent hover:bg-accent-light/20'
        }
      `}
    >
      {label}
    </button>
  );
}

interface QuestionSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function QuestionSection({ title, subtitle, children }: QuestionSectionProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-ink/60 mb-3">{subtitle}</p>
      )}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function PreferenceSelector({
  spaceType,
  goal,
  style,
  budget,
  specialNeeds,
  onSpaceTypeChange,
  onGoalChange,
  onStyleChange,
  onBudgetChange,
  onSpecialNeedToggle,
  onComplete,
}: PreferenceSelectorProps) {
  const isComplete = spaceType && goal && style && budget;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <QuestionSection title="What type of space is this?">
        {SPACE_TYPES.map((option) => (
          <OptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={spaceType === option.value}
            onClick={onSpaceTypeChange}
          />
        ))}
      </QuestionSection>

      <QuestionSection title="What's your main goal?" subtitle="What do you want to achieve in this space?">
        {GOALS.map((option) => (
          <OptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={goal === option.value}
            onClick={onGoalChange}
          />
        ))}
      </QuestionSection>

      <QuestionSection title="What style do you prefer?">
        {STYLES.map((option) => (
          <OptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={style === option.value}
            onClick={onStyleChange}
          />
        ))}
      </QuestionSection>

      <QuestionSection title="What's your budget?" subtitle="For all items combined">
        {BUDGETS.map((option) => (
          <OptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={budget === option.value}
            onClick={onBudgetChange}
          />
        ))}
      </QuestionSection>

      <QuestionSection title="Any special requirements?" subtitle="Select all that apply">
        {SPECIAL_NEEDS.map((option) => (
          <OptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={specialNeeds.includes(option.value)}
            onClick={onSpecialNeedToggle}
          />
        ))}
      </QuestionSection>

      <button
        onClick={onComplete}
        disabled={!isComplete}
        className={`
          w-full mt-4 py-4 px-6 rounded-full font-semibold text-lg transition-all
          ${isComplete
            ? 'bg-accent text-white hover:shadow-lg hover:-translate-y-0.5'
            : 'bg-warm text-ink/40 cursor-not-allowed'
          }
        `}
      >
        {isComplete ? 'Generate Design' : 'Answer all questions to continue'}
      </button>
    </div>
  );
}
