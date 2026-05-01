import { useState } from "react";
import styles from "./styles.module.css";

const FUNCTION_URL =
  "https://auszyqasqmvxfdanvytz.supabase.co/functions/v1/create-first-access-link";

export default function PaymentSuccess() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">(
    "info"
  );

  async function handleCreateAccessLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setMessageType("info");

      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail) {
        setMessageType("error");
        setMessage("Digite o e-mail usado na compra.");
        return;
      }

      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessageType("error");
        setMessage(data.message || "Não foi possível liberar seu acesso.");
        return;
      }

      setMessageType("success");
      setMessage("Acesso encontrado! Redirecionando...");

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("Erro ao validar seu acesso. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.glowEffect} />

      <section className={styles.card}>
        <div className={styles.icon}>✅</div>

        <p className={styles.badge}>Pagamento confirmado</p>

        <h1 className={styles.title}>Seu acesso está quase pronto!</h1>

        <p className={styles.message}>
          Digite o e-mail usado na compra para liberarmos seu primeiro acesso ao
          Aura Flix.
        </p>

        <form onSubmit={handleCreateAccessLink} className={styles.form}>
          {message && (
            <div
              className={
                messageType === "success"
                  ? styles.successMessage
                  : styles.errorMessage
              }
            >
              {message}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              E-mail da compra
            </label>

            <div className={styles.inputBox}>
              <span className={styles.inputIcon}>✉️</span>

              <input
                id="email"
                type="email"
                placeholder="seuemail@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                className={styles.input}
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.primaryButton}
          >
            {loading ? "Validando..." : "Liberar meu acesso"}
          </button>
        </form>

        <div className={styles.infoBox}>
          <strong>Importante:</strong>
          <p>
            Esse acesso automático funciona apenas no primeiro login. Depois
            disso, entre normalmente com seu e-mail e senha.
          </p>
        </div>

        <p className={styles.footerText}>
          Se você acabou de pagar, aguarde alguns segundos e tente novamente.
        </p>
      </section>
    </main>
  );
}