
import { User, AuthSession, UserRole } from '../types';

const SESSION_KEY = 'cotrac_session';

// Mock User Database
const MOCK_USERS: (User & { verification: string })[] = [
  { id: '1', username: 'admin', fullName: 'Administrator', role: 'ADMIN', verification: 'admin01234' },
  { id: '2', username: 'tech', fullName: 'Lead Technician', role: 'TECHNICIAN', verification: 'tech01234' },
  { id: '3', username: 'sales', fullName: 'Sales Executive', role: 'SALES', verification: 'sales01234' }
];

export const authService = {
  login: async (username: string, verification: string): Promise<AuthSession | null> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    
    const user = MOCK_USERS.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.verification === verification
    );

    if (user) {
      const { verification, ...userData } = user;
      const session: AuthSession = {
        user: userData,
        token: Math.random().toString(36).substring(7)
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentSession: (): AuthSession | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(SESSION_KEY);
  },

  hasRole: (roles: UserRole[]): boolean => {
    const session = authService.getCurrentSession();
    return session ? roles.includes(session.user.role) : false;
  }
};
