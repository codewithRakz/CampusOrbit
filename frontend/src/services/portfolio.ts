import { authStorage } from './auth';
import {
  fetchStudentProfile,
  type StudentProfileResponse,
  type StudentSkillItem,
  type StudentProjectItem,
} from './profile';

export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced';

export interface StudentSkillCreate {
  name: string;
  category: string;
  proficiency_level: SkillProficiency;
}

export interface StudentProjectCreate {
  title: string;
  description?: string;
  tech_stack?: string;
  repo_url?: string;
  live_url?: string;
}

export interface PortfolioData {
  profile: StudentProfileResponse | null;
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
 * Fetch portfolio data including student profile, skills, and projects
 */
export async function getPortfolioData(token?: string): Promise<PortfolioData> {
  const profile = await fetchStudentProfile(token);
  if (!profile) {
    return {
      profile: null,
      skills: [],
      projects: [],
    };
  }
  return {
    profile,
    skills: profile.skills || [],
    projects: profile.projects || [],
  };
}

/**
 * Add a skill to the student's profile
 * Calls POST /api/profile/skills
 */
export async function addStudentSkill(
  data: StudentSkillCreate,
  token?: string
): Promise<StudentSkillItem> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch('/api/profile/skills', {
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
    throw new Error('Access denied. Only students can manage their skill portfolio.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Remove a skill from the student's profile
 * Calls DELETE /api/profile/skills/{student_skill_id}
 */
export async function removeStudentSkill(
  studentSkillId: number,
  token?: string
): Promise<void> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`/api/profile/skills/${studentSkillId}`, {
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
    throw new Error('Access denied. Only students can manage their skill portfolio.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }
}

/**
 * Add a project to the student's portfolio
 * Calls POST /api/profile/projects
 */
export async function addStudentProject(
  data: StudentProjectCreate,
  token?: string
): Promise<StudentProjectItem> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch('/api/profile/projects', {
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
    throw new Error('Access denied. Only students can manage project portfolios.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Delete a project from the student's portfolio
 * Calls DELETE /api/profile/projects/{project_id}
 */
export async function deleteStudentProject(
  projectId: number,
  token?: string
): Promise<void> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`/api/profile/projects/${projectId}`, {
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
    throw new Error('Access denied. Only students can manage project portfolios.');
  }

  if (!response.ok) {
    const errorMsg = await parseError(response);
    throw new Error(errorMsg);
  }
}
