// src/Pages/PaymentSuccess/index.tsx

import { useState } from "react";

const FUNCTION_URL =
  "https://auszyqasqmvxfdanvytz.supabase.co/functions/v1/create-first-access-link";

export default function PaymentSuccess() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateAccessLink() {
    try {
      setLoading(true);
      setMessage("");

      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail) {
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
        setMessage(data.message || "Não foi possível liberar seu acesso.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setMessage("Erro ao validar seu acesso. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "70vh", padding: 24 }}>
      <section
        style={{
          maxWidth: 480,
          margin: "48px auto",
          padding: 24,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <h1>Pagamento confirmado!</h1>

        <p>
          Digite o e-mail usado na compra para liberar seu primeiro acesso.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
          <input
            type="email"
            placeholder="seuemail@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />

          <button
            type="button"
            onClick={handleCreateAccessLink}
            disabled={loading}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: 0,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {loading ? "Validando..." : "Liberar meu acesso"}
          </button>
        </div>

        {message && (
          <p style={{ marginTop: 16 }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>
          Esse acesso automático só funciona no primeiro login. Depois disso,
          entre normalmente com seu e-mail e senha.
        </p>
      </section>
    </main>
  );
}