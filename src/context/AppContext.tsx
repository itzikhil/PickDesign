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
  spaceType: null,
  goal: null,
  style: null,
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
};

type Action =
  | { type: 'SET_PHOTO'; payload: string }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_SPACE_ANALYSIS'; payload: SpaceAnalysis }
  | { type: 'SET_MEASUREMENTS'; payload: Measurement[] }
  | { type: 'UPDATE_MEASUREMENT'; payload: { id: string; value: number | null } }
  | { type: 'SET_SPACE_TYPE'; payload: SpaceType }
  | { type: 'SET_GOAL'; payload: Goal }
  | { type: 'SET_STYLE'; payload: StylePreference }
  | { type: 'SET_BUDGET'; payload: BudgetRange }
  | { type: 'TOGGLE_SPECIAL_NEED'; payload: SpecialNeed }
  | { type: 'SET_GENERATING_DESIGN'; payload: boolean }
  | { type: 'SET_DESIGN_RECOMMENDATION'; payload: DesignRecommendation }
  | { type: 'SET_LOADING_PRODUCTS'; payload: boolean }
  | { type: 'SET_PRODUCT_MATCHES'; payload: ProductMatch[] }
  | { type: 'RESET' };

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
    case 'SET_SPACE_TYPE':
      return {
        ...state,
        preferences: { ...state.preferences, spaceType: action.payload },
      };
    case 'SET_GOAL':
      return {
        ...state,
        preferences: { ...state.preferences, goal: action.payload },
      };
    case 'SET_STYLE':
      return {
        ...state,
        preferences: { ...state.preferences, style: action.payload },
      };
    case 'SET_BUDGET':
      return {
        ...state,
        preferences: { ...state.preferences, budget: action.payload },
      };
    case 'TOGGLE_SPECIAL_NEED':
      const needs = state.preferences.specialNeeds;
      const newNeeds = needs.includes(action.payload)
        ? needs.filter((n) => n !== action.payload)
        : [...needs.filter((n) => n !== 'none'), action.payload];
      // If 'none' is selected, clear all others
      if (action.payload === 'none') {
        return {
          ...state,
          preferences: { ...state.preferences, specialNeeds: ['none'] },
        };
      }
      return {
        ...state,
        preferences: { ...state.preferences, specialNeeds: newNeeds },
      };
    case 'SET_GENERATING_DESIGN':
      return { ...state, isGeneratingDesign: action.payload };
    case 'SET_DESIGN_RECOMMENDATION':
      return { ...state, designRecommendation: action.payload };
    case 'SET_LOADING_PRODUCTS':
      return { ...state, isLoadingProducts: action.payload };
    case 'SET_PRODUCT_MATCHES':
      return { ...state, productMatches: action.payload };
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
