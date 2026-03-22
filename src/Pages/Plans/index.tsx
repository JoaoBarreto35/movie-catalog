import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import styles from "./styles.module.css";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  popular: boolean;
  perfectpay_product_id: string;
  checkout_link: string;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("price");

      if (error) {
        console.error("Erro ao buscar planos:", error);
        setPlans([]);
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  function handleSubscribe(plan: Plan) {
    const confirmSubscribe = window.confirm(
      `⚠️ ATENÇÃO!\n\n` +
      `Você está logado como: ${userEmail}\n\n` +
      `Para ativação automática, use o MESMO email na Perfect Pay!\n\n` +
      `Continuar?`
    );

    if (confirmSubscribe) {
      window.location.href = plan.checkout_link;
    }
  }

  if (loading) {
    return <div className={styles.loading}>Carregando planos...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Escolha seu plano</h1>
      <p className={styles.subtitle}>
        Assine agora e tenha acesso ilimitado a todos os filmes e séries
      </p>

      {userEmail && (
        <div className={styles.emailWarning}>
          <strong>📧 Email vinculado:</strong> {userEmail}
          <br />
          <small>Use este email na Perfect Pay para ativação automática</small>
        </div>
      )}

      <div className={styles.grid}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.card} ${plan.popular ? styles.popular : ""}`}
          >
            {plan.popular && (
              <span className={styles.badge}>Mais popular</span>
            )}

            <h2 className={styles.planName}>{plan.name}</h2>

            <div className={styles.price}>
              R$ {plan.price.toFixed(2)}{" "}
              <span className={styles.period}>
                /{plan.interval === "month" ? "mês" : "ano"}
              </span>
            </div>

            <p className={styles.description}>{plan.description}</p>

            <ul className={styles.features}>
              {plan.features.map((feature, i) => (
                <li key={i}>✓ {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              className={styles.button}
            >
              Assinar agora
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p>
          Já é assinante? <a href="/home">Ir para home</a>
        </p>
      </div>
    </div>
  );
}