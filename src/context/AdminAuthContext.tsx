import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_admin: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const userData = await adminApi.getCurrentUser();
      console.log('Fetched user:', userData); // Debug log
      
      // Check if user is admin
      if (userData.is_admin) {
        setUser(userData);
      } else {
        console.log('User is not admin, logging out');
        localStorage.removeItem('adminToken');
        setToken(null);
        toast.error('Unauthorized access - Admin only');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('adminToken');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('Starting login with username:', username);
      const response = await adminApi.login(username, password);
      console.log('Login response received:', response); // Debug log
      
      // Check if user is admin
      if (!response.user.is_admin) {
        toast.error('You do not have admin privileges');
        return;
      }
      
      localStorage.setItem('adminToken', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      toast.success('Login successful');
    } catch (error: any) {
      console.error('Login failed with error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      toast.error(`Login failed: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Register as admin
      const newUser = await adminApi.registerAdmin(data);
      console.log('Registration successful:', newUser); // Debug log
      
      toast.success('Registration successful! Please login.');
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AdminAuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};