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
        px-5 py-3 rounded-full font-medium transition-all
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
  // Use sage for refresh, accent for others
  const isRefresh = value === 'refresh';
  const selectedBg = isRefresh ? 'bg-sage' : 'bg-accent';
  const selectedRing = isRefresh ? 'ring-sage' : 'ring-accent';

  return (
    <button
      onClick={() => onClick(value)}
      className={`
        w-full p-5 rounded-2xl text-left transition-all
        ${selected
          ? `${selectedBg} text-white shadow-lg ring-2 ${selectedRing} ring-offset-2`
          : 'bg-white border border-warm hover:border-sage hover:shadow-md'
        }
      `}
    >
      <p className={`font-display text-xl font-semibold ${selected ? 'text-white' : 'text-ink'}`}>
        {label}
      </p>
      <p className={`text-sm mt-1 ${selected ? 'text-white/80' : 'text-ink/60'}`}>
        {description}
      </p>
    </button>
  );
}

// Style card images from Unsplash
const styleImages: Record<StylePreference, string | null> = {
  modern: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
  scandinavian: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
  industrial: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&q=80',
  bohemian: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=400&q=80',
  classic: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
  minimalist: 'https://images.unsplash.com/photo-1598928506311-c55ece93a745?w=400&q=80',
  no_preference: null, // Neutral card without image
};

interface StyleCardProps {
  value: StylePreference;
  label: string;
  selected: boolean;
  onClick: (value: StylePreference) => void;
}

function StyleCard({ value, label, selected, onClick }: StyleCardProps) {
  const imageUrl = styleImages[value];
  const isNoPreference = value === 'no_preference';

  // No preference gets a simple neutral card
  if (isNoPreference) {
    return (
      <button
        onClick={() => onClick(value)}
        className={`
          relative aspect-[4/3] rounded-2xl overflow-hidden transition-all
          bg-warm/50 flex items-center justify-center
          ${selected
            ? 'ring-4 ring-sage ring-offset-2 scale-[1.02] shadow-xl'
            : 'hover:scale-[1.02] hover:shadow-lg hover:bg-warm/70'
          }
        `}
      >
        {selected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-sage rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <p className="font-display text-lg font-semibold text-ink/70">{label}</p>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(value)}
      className={`
        relative aspect-[4/3] rounded-2xl overflow-hidden transition-all
        ${selected
          ? 'ring-4 ring-accent ring-offset-2 scale-[1.02] shadow-xl'
          : 'hover:scale-[1.02] hover:shadow-lg'
        }
      `}
    >
      {/* Background image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Label */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <p className="font-display text-lg font-semibold text-white">
          {label}
        </p>
      </div>
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
    <div className="mb-10">
      <h3 className="font-display text-xl font-semibold text-ink mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-ink/60 mb-4">{subtitle}</p>
      )}
      <div className="flex flex-wrap gap-3">{children}</div>
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
        <h3 className="font-display text-2xl font-semibold text-ink mb-2">
          What would you like to do?
        </h3>
        <p className="text-sm text-ink/60 mb-5">
          Choose how we should approach your space
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

      {/* Style Selection - Visual Cards */}
      <div className="mb-10">
        <h3 className="font-display text-xl font-semibold text-ink mb-1">
          What's your style?
        </h3>
        <p className="text-sm text-ink/60 mb-5">
          Mix and match to create your look
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STYLES.map((option) => (
            <StyleCard
              key={option.value}
              value={option.value}
              label={option.label}
              selected={styles.includes(option.value)}
              onClick={onStyleToggle}
            />
          ))}
        </div>
      </div>

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

      <QuestionSection title="Any special requirements?" subtitle="Optional">
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
          w-full mt-6 py-4 px-6 rounded-full font-semibold text-lg transition-all
          ${isComplete
            ? 'bg-ink text-cream hover:shadow-lg hover:-translate-y-0.5'
            : 'bg-warm text-ink/40 cursor-not-allowed'
          }
        `}
      >
        {isComplete ? 'Create My Design' : 'Complete all sections'}
      </button>
    </div>
  );
}
