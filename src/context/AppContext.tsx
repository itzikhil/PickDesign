import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  AppState,
  SpaceAnalysis,
  Measurement,
  UserPreferences,
  DesignRecommendation,
  ProductMatch,
  SpaceType,
  Goal,
  StylePreference,
  BudgetRange,
  SpecialNeed,
} from '../lib/types';

const initialPreferences: UserPreferences = {
  spaceTypes: [],
  goals: [],
  styles: [],
  budget: null,
  specialNeeds: [],
};

const initialState: AppState = {
  photo: null,
  spaceAnalysis: null,
  isAnalyzing: false,
  measurements: [],
  preferences: initialPreferences,
  designRecommendation: null,
  isGeneratingDesign: false,
  productMatches: [],
  isLoadingProducts: false,
  renderedImage: null,
  isRenderingImage: false,
};

type Action =
  | { type: 'SET_PHOTO'; payload: string }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_SPACE_ANALYSIS'; payload: SpaceAnalysis }
  | { type: 'SET_MEASUREMENTS'; payload: Measurement[] }
  | { type: 'UPDATE_MEASUREMENT'; payload: { id: string; value: number | null } }
  | { type: 'TOGGLE_SPACE_TYPE'; payload: SpaceType }
  | { type: 'TOGGLE_GOAL'; payload: Goal }
  | { type: 'TOGGLE_STYLE'; payload: StylePreference }
  | { type: 'SET_BUDGET'; payload: BudgetRange }
  | { type: 'TOGGLE_SPECIAL_NEED'; payload: SpecialNeed }
  | { type: 'SET_GENERATING_DESIGN'; payload: boolean }
  | { type: 'SET_DESIGN_RECOMMENDATION'; payload: DesignRecommendation }
  | { type: 'SET_LOADING_PRODUCTS'; payload: boolean }
  | { type: 'SET_PRODUCT_MATCHES'; payload: ProductMatch[] }
  | { type: 'SET_RENDERING_IMAGE'; payload: boolean }
  | { type: 'SET_RENDERED_IMAGE'; payload: string | null }
  | { type: 'CLEAR_DESIGN' }
  | { type: 'RESET' };

function toggleArrayItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PHOTO':
      return { ...state, photo: action.payload };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_SPACE_ANALYSIS':
      return {
        ...state,
        spaceAnalysis: action.payload,
        measurements: action.payload.surfaces_to_measure.map((s) => ({
          id: s.id,
          label: s.label,
          value: null,
        })),
      };
    case 'SET_MEASUREMENTS':
      return { ...state, measurements: action.payload };
    case 'UPDATE_MEASUREMENT':
      return {
        ...state,
        measurements: state.measurements.map((m) =>
          m.id === action.payload.id ? { ...m, value: action.payload.value } : m
        ),
      };
    case 'TOGGLE_SPACE_TYPE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          spaceTypes: toggleArrayItem(state.preferences.spaceTypes, action.payload),
        },
      };
    case 'TOGGLE_GOAL':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          goals: toggleArrayItem(state.preferences.goals, action.payload),
        },
      };
    case 'TOGGLE_STYLE':
      // If selecting 'no_preference', clear others; if selecting others, remove 'no_preference'
      if (action.payload === 'no_preference') {
        return {
          ...state,
          preferences: {
            ...state.preferences,
            styles: state.preferences.styles.includes('no_preference') ? [] : ['no_preference'],
          },
        };
      }
      return {
        ...state,
        preferences: {
          ...state.preferences,
          styles: toggleArrayItem(
            state.preferences.styles.filter((s) => s !== 'no_preference'),
            action.payload
          ),
        },
      };
    case 'SET_BUDGET':
      return {
        ...state,
        preferences: { ...state.preferences, budget: action.payload },
      };
    case 'TOGGLE_SPECIAL_NEED':
      // If 'none' is selected, clear all others
      if (action.payload === 'none') {
        return {
          ...state,
          preferences: {
            ...state.preferences,
            specialNeeds: state.preferences.specialNeeds.includes('none') ? [] : ['none'],
          },
        };
      }
      return {
        ...state,
        preferences: {
          ...state.preferences,
          specialNeeds: toggleArrayItem(
            state.preferences.specialNeeds.filter((n) => n !== 'none'),
            action.payload
          ),
        },
      };
    case 'SET_GENERATING_DESIGN':
      return { ...state, isGeneratingDesign: action.payload };
    case 'SET_DESIGN_RECOMMENDATION':
      return { ...state, designRecommendation: action.payload };
    case 'SET_LOADING_PRODUCTS':
      return { ...state, isLoadingProducts: action.payload };
    case 'SET_PRODUCT_MATCHES':
      return { ...state, productMatches: action.payload };
    case 'SET_RENDERING_IMAGE':
      return { ...state, isRenderingImage: action.payload };
    case 'SET_RENDERED_IMAGE':
      return { ...state, renderedImage: action.payload };
    case 'CLEAR_DESIGN':
      return {
        ...state,
        designRecommendation: null,
        productMatches: [],
        renderedImage: null,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
