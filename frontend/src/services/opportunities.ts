import { authStorage } from './auth';

export type OpportunityType = 'internship' | 'research' | 'placement';

export interface OpportunityCreate {
  title: string;
  company_name: string;
  location: string;
  opportunity_type: OpportunityType;
  description: string;
  stipend?: string | null;
  min_cgpa: number;
  deadline?: string | null;
}

export interface OpportunityUpdate {
  title?: string;
  company_name?: string;
  location?: string;
  opportunity_type?: OpportunityType;
  description?: string;
  stipend?: string | null;
  min_cgpa?: number;
  deadline?: string | null;
  is_active?: boolean;
}

export interface OpportunityResponse {
  id: number;
  title: string;
  company_name: string;
  location: string;
  opportunity_type: OpportunityType;
  description: string;
  stipend: string | null;
  min_cgpa: number;
  deadline: string | null;
  is_active: boolean;
  posted_by_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface OpportunityFilterParams {
  keyword?: string;
  location?: string;
  opportunity_type?: OpportunityType;
  max_min_cgpa?: number;
  skip?: number;
  limit?: number;
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
 * List opportunities with optional filtering and pagination
 * Calls GET /api/opportunities
 */
export async function fetchOpportunities(
  filters?: OpportunityFilterParams,
  token?: string
): Promise<OpportunityResponse[]> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const queryParams = new URLSearchParams();
  if (filters?.keyword?.trim()) queryParams.set('keyword', filters.keyword.trim());
  if (filters?.location?.trim()) queryParams.set('location', filters.location.trim());
  if (filters?.opportunity_type) queryParams.set('opportunity_type', filters.opportunity_type);
  if (filters?.max_min_cgpa !== undefined && filters.max_min_cgpa !== null) {
    queryParams.set('max_min_cgpa', filters.max_min_cgpa.toString());
  }
  if (filters?.skip !== undefined) queryParams.set('skip', filters.skip.toString());
  if (filters?.limit !== undefined) queryParams.set('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/opportunities${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(endpoint, {
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

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Retrieve one opportunity by ID
 * Calls GET /api/opportunities/{id}
 */
export async function fetchOpportunityById(
  opportunityId: number,
  token?: string
): Promise<OpportunityResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/opportunities/${opportunityId}`, {
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

  if (response.status === 404) {
    throw new Error('Opportunity listing not found or no longer active.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Create a new opportunity (Placement Officer / Admin)
 * Calls POST /api/opportunities
 */
export async function createOpportunity(
  data: OpportunityCreate,
  token?: string
): Promise<OpportunityResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch('/api/opportunities', {
    method: 'POST',
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
    throw new Error('Access denied. Only placement officers or administrators can create opportunities.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Update an existing opportunity (Placement Officer / Admin)
 * Calls PUT /api/opportunities/{id}
 */
export async function updateOpportunity(
  opportunityId: number,
  data: OpportunityUpdate,
  token?: string
): Promise<OpportunityResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/opportunities/${opportunityId}`, {
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
    throw new Error('Access denied. You can only edit opportunities you created.');
  }

  if (response.status === 404) {
    throw new Error('Opportunity listing not found.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Deactivate an opportunity (Placement Officer / Admin)
 * Calls DELETE /api/opportunities/{id}
 */
export async function deactivateOpportunity(
  opportunityId: number,
  token?: string
): Promise<void> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  const response = await fetch(`/api/opportunities/${opportunityId}`, {
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
    throw new Error('Access denied. You can only deactivate opportunities you created.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }
}
