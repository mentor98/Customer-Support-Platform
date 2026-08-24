import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isCustomer: boolean;
  switchUser: (userId: string) => Promise<void>;
  registerCustomer: (name: string, email: string, department?: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuth = async () => {
    try {
      const data = await api.getMe();
      setCurrentUser(data.user);
      setAllUsers(data.allUsers);
    } catch (err) {
      console.error('Failed to load active user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const switchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      if (res.success) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  const registerCustomer = async (name: string, email: string, department?: string) => {
    try {
      const res = await api.registerCustomer(name, email, department);
      setCurrentUser(res.user);
      await fetchAuth();
    } catch (err) {
      console.error('Error registering customer:', err);
      throw err;
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isAgent = currentUser?.role === 'agent' || currentUser?.role === 'admin';
  const isCustomer = currentUser?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        isAdmin,
        isAgent,
        isCustomer,
        switchUser,
        registerCustomer,
        refreshAuth: fetchAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
