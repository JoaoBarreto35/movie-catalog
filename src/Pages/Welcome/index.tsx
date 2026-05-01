import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";

export default function Welcome() {
  const navigate = useNavigate();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");

    if (newPassword.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      setMessage("Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.glowEffect} />
      <div className={styles.glowEffectSecondary} />

      <section className={styles.card}>
        <div className={styles.icon}>🎉</div>

        <p className={styles.badge}>Primeiro acesso liberado</p>

        <h1 className={styles.title}>Bem-vindo ao Aura Flix!</h1>

        {!showPasswordForm ? (
          <>
            <p className={styles.message}>
              Sua conta foi criada com sucesso. Agora você já pode assistir, mas
              recomendamos trocar sua senha para manter sua conta segura.
            </p>

            <div className={styles.securityBox}>
              <strong>Recomendação de segurança</strong>
              <span>
                Como este é seu primeiro acesso, defina uma senha pessoal antes
                de continuar usando a plataforma.
              </span>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className={styles.primaryButton}
              >
                🔐 Trocar minha senha
              </button>

              <button
                type="button"
                onClick={() => navigate("/home", { replace: true })}
                className={styles.secondaryButton}
              >
                🎬 Ir assistir agora
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleChangePassword} className={styles.passwordForm}>
            <p className={styles.message}>
              Escolha uma nova senha para proteger sua conta.
            </p>

            {message && <div className={styles.errorMessage}>{message}</div>}

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="new-password">
                Nova senha
              </label>

              <div className={styles.inputBox}>
                <span className={styles.inputIcon}>🔒</span>

                <input
                  id="new-password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="confirm-password">
                Confirmar senha
              </label>

              <div className={styles.inputBox}>
                <span className={styles.inputIcon}>✓</span>

                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="submit"
                disabled={loading}
                className={styles.primaryButton}
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setMessage("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={loading}
                className={styles.secondaryButton}
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}