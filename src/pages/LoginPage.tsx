import React from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const handleLogin = async (role: 'citizen' | 'official') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in db
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user doc
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: role,
          heroPoints: 0,
          createdAt: serverTimestamp(),
        });
      } else {
        // Just update the role if they choose a different one? 
        // For simplicity, we can let them update their role on login, or just keep the existing one.
        // Usually, an official might be a specific role assigned by admin, but we'll allow them to choose for this demo.
        await setDoc(userDocRef, {
          role: role
        }, { merge: true });
      }

    } catch (error) {
      console.warn('Error signing in with Google', error);
      alert('Failed to sign in. ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-sand">
        <div className="w-16 h-16 bg-olive rounded-2xl flex items-center justify-center text-white font-serif text-4xl mx-auto mb-6">
          S
        </div>
        <h1 className="font-bold text-3xl font-serif tracking-tight text-olive mb-2">SAHAAY AI</h1>
        <p className="text-gray-500 mb-8">Sign in to continue to the platform.</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleLogin('citizen')}
            className="w-full py-3 px-4 bg-olive text-white font-medium rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in as Citizen
          </button>
          
          <button
            onClick={() => handleLogin('official')}
            className="w-full py-3 px-4 bg-white border border-olive text-olive font-medium rounded-xl hover:bg-olive hover:bg-opacity-5 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in as Official
          </button>
        </div>
      </div>
    </div>
  );
}
