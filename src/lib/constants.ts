// ===== Application Constants =====

// Session Configuration
export const USERS_PER_SESSION = 80;
export const MIN_USERS_FOR_SESSION = 40;
export const MAX_DAILY_SESSIONS = 30;
export const ACTIVE_WINDOW_MINUTES = 15;
export const CHECK_INTERVAL_MINUTES = 5;

// Session Timing (in milliseconds)
export const QUESTION_REVEAL_TIME = 60 * 1000; // 1 minute per question
export const VOTING_TIME = 3 * 60 * 1000; // 3 minutes for voting
export const SESSION_DURATION = 10 * 60 * 1000; // ~10 minutes total

// Questions
export const QUESTIONS_PER_SESSION = 5;
export const MAX_ANSWER_LENGTH = 150;

// Participant Rules
export const APPEARANCE_COOLDOWN_DAYS = 30;
export const MIN_APPEARANCES_FOR_FREEZE = 3;
export const MIN_VOTES_PER_SESSION_FOR_FREEZE = 30;
export const FREEZE_THRESHOLD_PERCENT = 10;

// TrustScore
export const DEFAULT_TRUST_SCORE = 50.0;
