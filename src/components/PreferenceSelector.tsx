import type {
  DesignIntent,
  SpaceType,
  Goal,
  StylePreference,
  BudgetRange,
  SpecialNeed,
} from '../lib/types';
import {
  DESIGN_INTENTS,
  SPACE_TYPES,
  GOALS,
  STYLES,
  BUDGETS,
  SPECIAL_NEEDS,
} from '../lib/types';

interface PreferenceSelectorProps {
  designIntent: DesignIntent | null;
  spaceTypes: SpaceType[];
  goals: Goal[];
  styles: StylePreference[];
  budget: BudgetRange | null;
  specialNeeds: SpecialNeed[];
  onDesignIntentChange: (value: DesignIntent) => void;
  onSpaceTypeToggle: (value: SpaceType) => void;
  onGoalToggle: (value: Goal) => void;
  onStyleToggle: (value: StylePreference) => void;
  onBudgetChange: (value: BudgetRange) => void;
  onSpecialNeedToggle: (value: SpecialNeed) => void;
  onComplete: () => void;
}

interface ChipButtonProps<T extends string> {
  value: T;
  label: string;
  selected: boolean;
  onClick: (value: T) => void;
  multiSelect?: boolean;
}

function ChipButton<T extends string>({
  value,
  label,
  selected,
  onClick,
  multiSelect = false,
}: ChipButtonProps<T>) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        px-4 py-2.5 rounded-full font-medium text-sm transition-all
        flex items-center gap-2
        ${selected
          ? 'bg-accent text-white shadow-md'
          : 'bg-white border border-warm hover:border-accent hover:bg-accent-light/20'
        }
      `}
    >
      {multiSelect && selected && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </button>
  );
}

interface IntentCardProps {
  value: DesignIntent;
  label: string;
  description: string;
  selected: boolean;
  onClick: (value: DesignIntent) => void;
}

function IntentCard({ value, label, description, selected, onClick }: IntentCardProps) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        w-full p-4 rounded-xl text-left transition-all
        ${selected
          ? 'bg-accent text-white shadow-lg ring-2 ring-accent ring-offset-2'
          : 'bg-white border border-warm hover:border-accent hover:shadow-md'
        }
      `}
    >
      <p className={`font-semibold text-lg ${selected ? 'text-white' : 'text-ink'}`}>
        {label}
      </p>
      <p className={`text-sm mt-1 ${selected ? 'text-white/80' : 'text-ink/60'}`}>
        {description}
      </p>
    </button>
  );
}

interface QuestionSectionProps {
  title: string;
  subtitle?: string;
  multiSelect?: boolean;
  children: React.ReactNode;
}

function QuestionSection({ title, subtitle, multiSelect, children }: QuestionSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {multiSelect && (
          <span className="text-xs px-2 py-0.5 bg-sage-light text-sage rounded-full font-medium">
            Multi-select
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-ink/60 mb-3">{subtitle}</p>
      )}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function PreferenceSelector({
  designIntent,
  spaceTypes,
  goals,
  styles,
  budget,
  specialNeeds,
  onDesignIntentChange,
  onSpaceTypeToggle,
  onGoalToggle,
  onStyleToggle,
  onBudgetChange,
  onSpecialNeedToggle,
  onComplete,
}: PreferenceSelectorProps) {
  const isComplete = designIntent && spaceTypes.length > 0 && goals.length > 0 && styles.length > 0 && budget;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Design Intent - First question */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold text-ink mb-2">
          What would you like to do with this space?
        </h3>
        <p className="text-sm text-ink/60 mb-4">
          This helps us tailor the design approach
        </p>
        <div className="space-y-3">
          {DESIGN_INTENTS.map((option) => (
            <IntentCard
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              selected={designIntent === option.value}
              onClick={onDesignIntentChange}
            />
          ))}
        </div>
      </div>

      <QuestionSection
        title="What type of space is this?"
        subtitle="Select all that apply"
        multiSelect
      >
        {SPACE_TYPES.map((option) => (
          <ChipButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={spaceTypes.includes(option.value)}
            onClick={onSpaceTypeToggle}
            multiSelect
          />
        ))}
      </QuestionSection>

      <QuestionSection
        title="What are your goals?"
        subtitle="Select all that apply"
        multiSelect
      >
        {GOALS.map((option) => (
          <ChipButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={goals.includes(option.value)}
            onClick={onGoalToggle}
            multiSelect
          />
        ))}
      </QuestionSection>

      <QuestionSection
        title="What styles do you like?"
        subtitle="Mix and match styles"
        multiSelect
      >
        {STYLES.map((option) => (
          <ChipButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={styles.includes(option.value)}
            onClick={onStyleToggle}
            multiSelect
          />
        ))}
      </QuestionSection>

      <QuestionSection title="What's your budget?" subtitle="For all items combined">
        {BUDGETS.map((option) => (
          <ChipButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={budget === option.value}
            onClick={onBudgetChange}
          />
        ))}
      </QuestionSection>

      <QuestionSection title="Any special requirements?" subtitle="Select all that apply" multiSelect>
        {SPECIAL_NEEDS.map((option) => (
          <ChipButton
            key={option.value}
            value={option.value}
            label={option.label}
            selected={specialNeeds.includes(option.value)}
            onClick={onSpecialNeedToggle}
            multiSelect
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
        {isComplete ? 'Generate Design' : 'Complete all sections to continue'}
      </button>
    </div>
  );
}
