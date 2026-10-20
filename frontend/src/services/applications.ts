import { authStorage, type UserResponse } from './auth';
import { type OpportunityResponse } from './opportunities';

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'accepted'
  | 'rejected';

export interface ApplicationCreate {
  notes?: string;
}

export interface ApplicationStatusUpdate {
  status: ApplicationStatus;
}

export interface ApplicationResponse {
  id: number;
  internship_id: number;
  student_id: number;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string;
  updated_at: string | null;
}

export interface ApplicationWithOpportunityResponse extends ApplicationResponse {
  internship: OpportunityResponse;
}

export interface ApplicationWithApplicantResponse extends ApplicationResponse {
  student: UserResponse;
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
 * Apply for an active opportunity (Student only)
 * Calls POST /api/applications/{opportunity_id}
 */
export async function applyForOpportunity(
  opportunityId: number,
  notes?: string,
  token?: string
): Promise<ApplicationResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/applications/${opportunityId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes: notes?.trim() || undefined }),
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Only registered students can apply for campus opportunities.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetch current student's application history
 * Calls GET /api/applications/me
 */
export async function fetchMyApplications(
  token?: string
): Promise<ApplicationWithOpportunityResponse[]> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch('/api/applications/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Only students can view personal applications.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetch all student applicants for an opportunity (Placement Officer / Admin)
 * Calls GET /api/opportunities/{opportunity_id}/applications
 */
export async function fetchOpportunityApplicants(
  opportunityId: number,
  token?: string
): Promise<ApplicationWithApplicantResponse[]> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/opportunities/${opportunityId}/applications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. You can only view applicants for opportunities you posted.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Update the candidate application review status (Placement Officer / Admin)
 * Calls PATCH /api/applications/{application_id}/status
 */
export async function updateApplicationStatus(
  applicationId: number,
  status: ApplicationStatus,
  token?: string
): Promise<ApplicationResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (response.status === 401) {
    authStorage.removeToken();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. You are not authorized to update status for this opportunity.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}
