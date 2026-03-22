// src/components/AdminGuard.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export function AdminGuard({ children, redirectTo = "/home" }: { children: React.ReactNode; redirectTo?: string }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // 🔥 CHAMAR A FUNÇÃO PUBLIC.is_admin()
      const { data, error } = await supabase
        .rpc('is_admin');

      if (error) {
        console.error('Erro ao verificar admin:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }

    } catch (error) {
      console.error('Erro:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#141414",
        color: "white"
      }}>
        Verificando permissões...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}