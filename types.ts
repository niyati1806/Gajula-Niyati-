
export enum AppStep {
  PROFILE_SELECT,
  LANGUAGE_SELECT,
  DASHBOARD_VIEW,
  INPUT_METHOD_SELECT,
  BODY_MAP,
  BODY_PART_DETAILS,
  VOICE_INPUT,
  CHAT_INPUT,
  TRIAGE_LOADING,
  FOLLOW_UP_INPUT,
  RESULTS,
  BOOKING_SLOT_SELECTION,
  BOOKING_CONFIRMED,
  HISTORY_DETAIL,
  RESCHEDULE_VIEW
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  SPANISH = 'Spanish'
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  distance: string;
  rating: number;
  availability: string;
  consultationFee: string;
  hospitalName: string;
  address: string;
}

export interface TriageResult {
  urgency: 'Low' | 'Medium' | 'High';
  specialty: string;
  specialistReason: string; // Why this specific specialist?
  summary: string;
  careAdvice: string;
  recommendedDoctors: Doctor[];
  followUpQuestion?: string;
}

export interface BodyPart {
  id: string;
  name: string;
  path: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  urgency: 'Low' | 'Medium' | 'High';
  symptoms: string;
  diagnosis: string;
  careAdvice: string;
}
