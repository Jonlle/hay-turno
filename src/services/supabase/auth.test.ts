import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('./client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

import {
  getCurrentSession,
  getCurrentUser,
  isAuthenticated,
  signInWithEmail,
  signOut,
  getUserProfile,
} from './auth';

beforeEach(() => {
  vi.clearAllMocks();
});

const mockUser = {
  id: 'user-123',
  email: 'admin@demo.com',
  aud: 'authenticated',
  role: 'authenticated',
};

const mockSession = {
  user: mockUser,
  access_token: 'token-123',
  refresh_token: 'refresh-123',
};

describe('auth service', () => {
  describe('getCurrentSession', () => {
    it('returns session when authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const result = await getCurrentSession();

      expect(result).toEqual(mockSession);
    });

    it('returns null when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await getCurrentSession();

      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      mockGetSession.mockResolvedValue({ data: null, error: { message: 'Session error' } });

      await expect(getCurrentSession()).rejects.toEqual({ message: 'Session error' });
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('throws on error', async () => {
      mockGetUser.mockResolvedValue({ data: null, error: { message: 'Not authenticated' } });

      await expect(getCurrentUser()).rejects.toEqual({ message: 'Not authenticated' });
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('signInWithEmail', () => {
    it('calls signInWithPassword with credentials', async () => {
      const response = { data: { session: mockSession }, error: null };
      mockSignInWithPassword.mockResolvedValue(response);

      const result = await signInWithEmail('admin@demo.com', 'demo1234');

      expect(result).toEqual(response);
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@demo.com',
        password: 'demo1234',
      });
    });
  });

  describe('signOut', () => {
    it('calls supabase auth signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await signOut();

      expect(result).toEqual({ error: null });
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('returns profile when found', async () => {
      const profile = { id: 'user-123', full_name: 'Admin Demo', created_at: '2025-01-01' };
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: profile, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getUserProfile('user-123');

      expect(result).toEqual(profile);
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('returns null when not found (PGRST116)', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getUserProfile('user-123');

      expect(result).toBeNull();
    });

    it('throws on other errors', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'DB error' } }),
      };
      mockFrom.mockReturnValue(chain);

      await expect(getUserProfile('user-123')).rejects.toEqual({ code: 'OTHER', message: 'DB error' });
    });
  });
});
