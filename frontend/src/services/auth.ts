export type UserRole = 'student' | 'faculty' | 'placement_officer' | 'admin';
export type PublicUserRole = 'student' | 'faculty' | 'placement_officer';

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  role: PublicUserRole;
}

export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

const TOKEN_KEY = 'campusorbit_access_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  getUser(): { email: string; role: string } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return {
        email: decoded.sub || '',
        role: decoded.role || '',
      };
    } catch {
      return null;
    }
  },
};

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
 * Register a new user
 * Calls POST /api/auth/register
 */
export async function registerUser(data: RegisterData): Promise<UserResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorMessage = await parseError(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Login an existing user
 * Calls POST /api/auth/login with application/x-www-form-urlencoded
 */
export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorMessage = await parseError(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch current authenticated user details from server
 * Calls GET /api/auth/me
 */
export async function fetchCurrentUser(token?: string): Promise<UserResponse> {
  const authToken = token || authStorage.getToken();
  if (!authToken) {
    throw new Error('No authentication token available');
  }

  const response = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorMessage = await parseError(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

