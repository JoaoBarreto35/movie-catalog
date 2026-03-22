// src/Pages/PaymentSuccess/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import styles from "./styles.module.css";

export default function PaymentSuccess() {
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Pegar email do usuário logado
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email || "");
    });

    // Contagem regressiva
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/home");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>🎉</div>
        <h1 className={styles.title}>Pagamento confirmado!</h1>
        <p className={styles.message}>
          Sua assinatura foi ativada com sucesso.
        </p>

        <div className={styles.emailBox}>
          <span className={styles.emailLabel}>📧 Email vinculado:</span>
          <strong className={styles.emailValue}>{userEmail}</strong>
        </div>

        <div className={styles.infoBox}>
          <h3>✅ O que acontece agora?</h3>
          <ul>
            <li>Sua assinatura já está ativa</li>
            <li>Acesso ilimitado a todos os filmes e séries</li>
            <li>Pode assistir em até 2 dispositivos</li>
            <li>Próxima cobrança em 30 dias</li>
          </ul>
        </div>

        <button onClick={() => navigate("/home")} className={styles.primaryButton}>
          Começar a assistir agora
        </button>

        <p className={styles.redirect}>
          Redirecionando para home em <strong>{countdown}</strong> segundos...
        </p>
      </div>
    </div>
  );
}