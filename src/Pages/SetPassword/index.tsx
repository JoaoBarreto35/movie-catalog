// src/Pages/SetPassword/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import styles from "./styles.module.css";

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Pegar email e token da URL
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validações
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Se tiver token de recovery, usa ele
      if (token) {
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;

        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      // Se não tiver token, tenta criar nova senha via email
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);

    } catch (err: any) {
      console.error("Erro ao definir senha:", err);
      setError(err.message || "Erro ao definir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h1 className={styles.title}>Senha criada com sucesso!</h1>
          <p className={styles.message}>
            Agora você pode fazer login com seu email e senha.
          </p>
          <p className={styles.redirect}>
            Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crie sua senha de acesso</h1>

        <p className={styles.subtitle}>
          Sua conta já foi criada. Agora só falta definir uma senha.
        </p>

        <div className={styles.emailBox}>
          <span className={styles.emailLabel}>📧 Email:</span>
          <strong className={styles.emailValue}>{email}</strong>
        </div>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Sua senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={styles.input}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirme sua senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar minha senha"}
          </button>
        </form>

        <p className={styles.help}>
          Depois de criar sua senha, você poderá acessar com email + senha.
        </p>
      </div>
    </div>
  );
}