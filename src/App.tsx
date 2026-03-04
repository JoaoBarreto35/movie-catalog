import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from './Pages/Login';
import Home from './Pages/Home';
import type { Session } from '@supabase/supabase-js';
import { Header } from './components/Header';
import Search from './Pages/Search';
import Category from './Pages/Category';
import Details from './Pages/Details';
import { NotFound } from './Pages/NotFound';

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:id"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Category />
            </ProtectedRoute>
          }
        />
        <Route
          path="/details/:id"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Details />
            </ProtectedRoute>
          }
        />
        {/* <Route path="*" element={<Navigate to={session ? "/home" : "/login"} replace />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;