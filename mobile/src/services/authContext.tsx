import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseAuth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  User,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  updateName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = firebaseAuth();
    if (!auth) throw new Error('Firebase Auth nie jest zainicjalizowany.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const auth = firebaseAuth();
    if (!auth) throw new Error('Firebase Auth nie jest zainicjalizowany.');
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
    }
  };

  const logout = async () => {
    const auth = firebaseAuth();
    if (!auth) throw new Error('Firebase Auth nie jest zainicjalizowany.');
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    const auth = firebaseAuth();
    if (!auth) throw new Error('Firebase Auth nie jest zainicjalizowany.');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signInAsGuest = async () => {
    const auth = firebaseAuth();
    if (!auth) throw new Error('Firebase Auth nie jest zainicjalizowany.');
    await signInAnonymously(auth);
  };

  const updateName = async (displayName: string) => {
    const auth = firebaseAuth();
    if (!auth || !auth.currentUser) throw new Error('Brak zalogowanego użytkownika');
    await updateProfile(auth.currentUser, { displayName: displayName.trim() });
    setUser({ ...auth.currentUser } as User);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        logout,
        resetPassword,
        signInAsGuest,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
