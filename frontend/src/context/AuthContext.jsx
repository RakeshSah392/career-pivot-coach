import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { candidateApi } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setCandidate(null);
      return null;
    }

    try {
      // Canonical UID-based fetch via authenticated ID token
      const res = await candidateApi.getMe();
      if (res?.data) {
        setCandidate(res.data);
        return res.data;
      }
      return null;
    } catch (err) {
      // If 404, candidate might not have created their profile record yet
      if (err.status === 404) {
        setCandidate(null);
      } else {
        console.warn('[AuthContext] Profile fetch error:', err.message);
        setError(err.message);
      }
      return null;
    }
  }, []);

  // Listen to Firebase auth state changes (persisted in IndexedDB)
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await fetchProfile(firebaseUser);
        } catch (err) {
          console.warn('[AuthContext] Initial profile sync failed:', err.message);
        }
      } else {
        setCandidate(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const login = async (email, password) => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error(
        'Firebase Authentication is not configured. Please supply VITE_FIREBASE_API_KEY in frontend/.env.'
      );
    }
    setError(null);
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await credential.user.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      const profile = await fetchProfile(updatedUser);
      return { user: updatedUser, candidate: profile };
    } catch (err) {
      const msg = mapFirebaseError(err);
      setError(msg);
      throw new Error(msg, { cause: err });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, profileDetails) => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error(
        'Firebase Authentication is not configured. Please supply VITE_FIREBASE_API_KEY in frontend/.env.'
      );
    }
    setError(null);
    setIsLoading(true);

    try {
      // 1. Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const createdUser = credential.user;

      // 2. Send email verification link immediately
      await sendEmailVerification(createdUser);

      // 3. Register CandidateProfile in MongoDB linked to Firebase UID
      const profilePayload = {
        ...profileDetails,
        email: createdUser.email.toLowerCase(),
        firebaseUid: createdUser.uid,
      };

      const res = await candidateApi.createProfile(profilePayload);
      setCandidate(res.data);
      setUser(createdUser);

      return {
        user: createdUser,
        candidate: res.data,
        requiresVerification: true,
      };
    } catch (err) {
      const msg = mapFirebaseError(err);
      setError(msg);
      throw new Error(msg, { cause: err });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setCandidate(null);
    setError(null);
  };

  const resetPassword = async (email) => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not configured.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      const msg = mapFirebaseError(err);
      throw new Error(msg, { cause: err });
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth?.currentUser) {
      throw new Error('No authenticated user found.');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      const msg = mapFirebaseError(err);
      throw new Error(msg, { cause: err });
    }
  };

  const checkVerificationStatus = async () => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true); // Force-refresh token to get updated email_verified claim
    setUser({ ...auth.currentUser });
    return Boolean(auth.currentUser.emailVerified);
  };

  const refreshProfile = async () => {
    if (auth?.currentUser) {
      return await fetchProfile(auth.currentUser);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        candidate,
        email: user?.email || candidate?.email || '',
        firebaseUid: user?.uid || candidate?.firebaseUid || '',
        isAuthenticated: Boolean(user),
        hasProfile: Boolean(candidate),
        isEmailVerified: Boolean(user?.emailVerified),
        isLoading,
        error,
        isFirebaseConfigured,
        login,
        register,
        logout,
        resetPassword,
        resendVerificationEmail,
        checkVerificationStatus,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Map Firebase error codes to user-friendly messages
function mapFirebaseError(err) {
  if (!err?.code) return err.message || 'Authentication failed.';
  switch (err.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to many failed attempts. Try again later or reset password.';
    case 'auth/network-request-failed':
      return 'Network error connecting to Firebase. Check your internet connection.';
    default:
      return err.message || 'Authentication error occurred.';
  }
}
