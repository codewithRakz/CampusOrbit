import { authStorage } from './auth';
import {
  type StudentProfileResponse,
  type StudentSkillItem,
  type StudentProjectItem,
} from './profile';
import { type ApplicationWithOpportunityResponse } from './applications';

export interface AdviseeStudentSummary {
  id: number;
  email: string;
  full_name: string;
  department?: string | null;
  year_of_study?: number | null;
  cgpa?: number | null;
}

export interface FacultyAdviseeResponse {
  id: number;
  faculty_id: number;
  student_id: number;
  notes: string | null;
  is_student_visible: boolean;
  assigned_at: string;
  updated_at: string | null;
  student: AdviseeStudentSummary;
}

export interface AdviseePortfolioResponse {
  student: AdviseeStudentSummary;
  profile: StudentProfileResponse | null;
  skills: StudentSkillItem[];
  projects: StudentProjectItem[];
  applications: ApplicationWithOpportunityResponse[];
  mentorship_notes: string | null;
  is_student_visible: boolean;
  assigned_at: string;
  updated_at: string | null;
}

export interface AssignAdviseePayload {
  student_email: string;
  notes?: string;
  is_student_visible?: boolean;
}

export interface FeedbackUpdatePayload {
  notes?: string;
  is_student_visible: boolean;
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
 * Fetch all advisees assigned to the authenticated faculty member
 * Calls GET /api/faculty/advisees
 */
export async function fetchAdvisees(search?: string, token?: string): Promise<FacultyAdviseeResponse[]> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const queryParams = new URLSearchParams();
  if (search && search.trim()) {
    queryParams.append('search', search.trim());
  }

  const url = `/api/faculty/advisees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Faculty or Administrator privileges required.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Assign an advisee to the authenticated faculty member
 * Calls POST /api/faculty/advisees
 */
export async function assignAdvisee(
  payload: AssignAdviseePayload,
  token?: string
): Promise<FacultyAdviseeResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch('/api/faculty/advisees', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Faculty or Administrator privileges required.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetch complete portfolio for an assigned advisee
 * Calls GET /api/faculty/advisees/{student_id}
 */
export async function fetchAdviseePortfolio(
  studentId: number,
  token?: string
): Promise<AdviseePortfolioResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/faculty/advisees/${studentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. You can only view advisees assigned to you.');
  }

  if (response.status === 404) {
    throw new Error('Advisee not found or not assigned to your mentorship cohort.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Update mentorship feedback for an assigned advisee
 * Calls PUT /api/faculty/advisees/{student_id}/feedback
 */
export async function updateMentorshipFeedback(
  studentId: number,
  payload: FeedbackUpdatePayload,
  token?: string
): Promise<FacultyAdviseeResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/faculty/advisees/${studentId}/feedback`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. You can only update feedback for your assigned advisees.');
  }

  if (response.status === 404) {
    throw new Error('Advisee not found or not assigned to you.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Unassign an advisee from the faculty member's cohort
 * Calls DELETE /api/faculty/advisees/{student_id}
 */
export async function unassignAdvisee(
  studentId: number,
  token?: string
): Promise<void> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/faculty/advisees/${studentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. You can only unassign students assigned to you.');
  }

  if (response.status === 404) {
    throw new Error('Advisee not found or not assigned to you.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }
}

export interface StudentMentorshipItem {
  id: number;
  faculty_name: string;
  faculty_email: string;
  notes: string | null;
  updated_at: string | null;
}

/**
 * Fetch mentorship feedback shared with the current authenticated student
 * Calls GET /api/student/mentorship
 */
export async function fetchMyMentorshipNotes(token?: string): Promise<StudentMentorshipItem[]> {
  const authToken = token || authStorage.getToken();
  if (!authToken) return [];

  const response = await fetch('/api/student/mentorship', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) return [];
  return response.json();
}

