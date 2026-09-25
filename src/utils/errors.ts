export function getFriendlyError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please check your email and confirm your account before signing in.';
    }
    if (msg.includes('user already registered')) {
      return 'An account with this email already exists. Please sign in.';
    }
    if (msg.includes('password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (msg.includes('permission denied') || msg.includes('rls')) {
      return "We couldn't complete that request. Please try again.";
    }
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return 'This record already exists.';
    }
    if (msg.includes('jwt expired') || msg.includes('session_expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    if (msg.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }

    // Return message if it seems user-friendly (short, no technical terms)
    if (error.message.length < 100 && !msg.includes('pgrst') && !msg.includes('postgres')) {
      return error.message;
    }
  }

  return "We couldn't complete that request. Please try again.";
}

export function logError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}
