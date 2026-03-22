import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

type SubscriptionStatus = "checking" | "active" | "inactive";

export function SubscriptionGuard({
  children,
  redirectTo = "/plans",
}: SubscriptionGuardProps) {
  const [status, setStatus] = useState<SubscriptionStatus>("checking");

  useEffect(() => {
    let isMounted = true;

    async function checkSubscription() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Erro ao buscar usuário:", authError);
          if (isMounted) setStatus("inactive");
          return;
        }

        if (!user) {
          if (isMounted) setStatus("inactive");
          return;
        }

        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("current_period_end", now)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar assinatura:", error);
          if (isMounted) setStatus("inactive");
          return;
        }

        if (isMounted) {
          setStatus(data ? "active" : "inactive");
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar assinatura:", error);
        if (isMounted) setStatus("inactive");
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div >
        <p >Verificand-o assinatura...</p>
      </div>
    );
  }

  if (status === "inactive") {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}