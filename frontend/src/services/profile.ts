import { authStorage } from './auth';

export interface StudentProfileUpdate {
  department?: string | null;
  year_of_study?: number | null;
  cgpa?: number | null;
  bio?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
}

export interface StudentSkillItem {
  id: number;
  student_profile_id: number;
  skill_id: number;
  skill: {
    id: number;
    name: string;
    category: string;
  };
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
}

export interface StudentProjectItem {
  id: number;
  student_profile_id: number;
  title: string;
  description?: string | null;
  tech_stack?: string | null;
  repo_url?: string | null;
  live_url?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface StudentProfileResponse {
  id: number;
  user_id: number;
  department: string | null;
  year_of_study: number | null;
  cgpa: number | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string | null;
  skills: StudentSkillItem[];
  projects: StudentProjectItem[];
}

/**
 * Helper to parse backend error responses cleanly
 */
async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail.map((err: { msg?: string }) => err.msg || 'Validation error').join(', ');
    }
    return 'An unexpected error occurred. Please try again.';
  } catch {
    return `Server returned ${response.status}: ${response.statusText}`;
  }
}

/**
 * Fetch the authenticated student's profile.
 * Returns null if the backend responds with 404 (no profile created yet).
 */
export async function fetchStudentProfile(token?: string): Promise<StudentProfileResponse | null> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch('/api/profile/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    // Student has not initialized a profile yet
    return null;
  }

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Only registered students can access a student profile.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Create or update the authenticated student's profile.
 */
export async function updateStudentProfile(
  data: StudentProfileUpdate,
  token?: string
): Promise<StudentProfileResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch('/api/profile/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Only registered students can update a student profile.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}
