/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

import CitizenPage from './pages/CitizenPage';
import OfficialPage from './pages/OfficialPage';
import ChatbotPage from './pages/ChatbotPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import { LogOut, Menu, X } from 'lucide-react';

function Navigation({ userRole, handleLogout }: { userRole: 'citizen' | 'official' | null, handleLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden p-2 text-ink hover:text-olive transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold uppercase tracking-widest opacity-60">
        {userRole === 'official' ? (
          <Link to="/official" className="hover:opacity-100 hover:border-b-2 hover:border-olive py-1">Official Dashboard</Link>
        ) : (
          <Link to="/" className="hover:opacity-100 hover:border-b-2 hover:border-olive py-1">Citizen</Link>
        )}
        <Link to="/leaderboard" className="hover:opacity-100 hover:border-b-2 hover:border-olive py-1">Leaderboard</Link>
        <Link to="/chat" className="hover:opacity-100 hover:border-b-2 hover:border-olive py-1">Chatbot</Link>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 hover:opacity-100 hover:text-red-600 transition-colors ml-4 border-l border-sand pl-4"
          title="Sign Out"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-sand shadow-lg md:hidden flex flex-col p-4 space-y-4 z-50 uppercase tracking-widest text-sm font-semibold">
          {userRole === 'official' ? (
            <Link to="/official" className="hover:text-olive px-2 py-1">Official Dashboard</Link>
          ) : (
            <Link to="/" className="hover:text-olive px-2 py-1">Citizen</Link>
          )}
          <Link to="/leaderboard" className="hover:text-olive px-2 py-1">Leaderboard</Link>
          <Link to="/chat" className="hover:text-olive px-2 py-1">Chatbot</Link>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors pt-4 border-t border-sand px-2"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'citizen' | 'official' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to user document for role updates
        const unsubDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role as 'citizen' | 'official');
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Error signing out: ", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center font-sans text-ink">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-canvas flex flex-col font-sans text-ink">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-sand sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Link to={userRole === 'official' ? '/official' : '/'} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-olive rounded-xl flex items-center justify-center text-white font-serif text-2xl">
                S
              </div>
              <span className="font-bold text-xl md:text-2xl font-serif tracking-tight text-olive">SAHAAY AI</span>
            </Link>
          </div>
          <Navigation userRole={userRole} handleLogout={handleLogout} />
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            {userRole === 'official' ? (
              <Route path="/official" element={<OfficialPage />} />
            ) : (
              <Route path="/" element={<CitizenPage />} />
            )}
            <Route path="/chat" element={<ChatbotPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<Navigate to={userRole === 'official' ? "/official" : "/"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
