import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  requestLoginOtp: (email: string) => Promise<{ error: any }>;
  verifyLoginOtp: (email: string, code: string) => Promise<{ error: any }>;
  requestRegisterOtp: (payload: { email: string; password: string; fullName: string }) => Promise<{ error: any }>;
  verifyRegisterOtp: (email: string, code: string) => Promise<{ error: any }>;
  loginWithGoogle: (credential: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkIsAdmin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper function to get user role
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const userData = await authAPI.getMe();
    return userData.user?.role || 'user';
  } catch (error) {
    return 'user';
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkIsAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    return user.role === 'admin';
  };

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      setSession({ token });
      // Connect to socket
      connectSocket(token);
      // Fetch user data
      authAPI.getMe()
        .then((data) => {
          setUser(data.user);
          setIsAdmin(data.user?.role === 'admin');
          setLoading(false);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          disconnectSocket();
        });
    } else {
      setLoading(false);
    }

    return () => {
      // Cleanup socket on unmount
      disconnectSocket();
    };
  }, []);

  const persistAuth = (data: any) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Connect to socket with new token
      connectSocket(data.token);
    }
    setUser(data.user);
    setSession({ token: data.token });
    setIsAdmin(data.user?.role === 'admin');
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);
      persistAuth(data);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Login failed' } };
    }
  };

  const requestLoginOtp = async (email: string) => {
    try {
      await authAPI.requestLoginOtp(email);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to send code' } };
    }
  };

  const verifyLoginOtp = async (email: string, code: string) => {
    try {
      const data = await authAPI.verifyLoginOtp({ email, code });
      persistAuth(data);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'OTP verification failed' } };
    }
  };

  const requestRegisterOtp = async (payload: { email: string; password: string; fullName: string }) => {
    try {
      await authAPI.requestRegisterOtp(payload);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to send verification code' } };
    }
  };

  const verifyRegisterOtp = async (email: string, code: string) => {
    try {
      const data = await authAPI.verifyRegisterOtp({ email, code });
      persistAuth(data);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Verification failed' } };
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const data = await authAPI.loginWithGoogle(credential);
      persistAuth(data);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Google login failed' } };
    }
  };

  const signOut = async () => {
    authAPI.logout();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        setUser,
        signInWithPassword,
        requestLoginOtp,
        verifyLoginOtp,
        requestRegisterOtp,
        verifyRegisterOtp,
        loginWithGoogle,
        signOut,
        checkIsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
