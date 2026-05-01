
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import styles from './styles.module.css';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    // Validações
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'As novas senhas não coincidem' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
      setLoading(false);
      return;
    }

    // Primeiro, verificar se a senha atual está correta
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMsg({ type: 'error', text: 'Usuário não autenticado' });
      setLoading(false);
      navigate('/login');
      return;
    }

    // Tentar fazer login com a senha atual para verificar
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      setMsg({ type: 'error', text: 'Senha atual incorreta' });
      setLoading(false);
      return;
    }

    // Atualizar a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setMsg({ type: 'error', text: updateError.message });
    } else {
      setMsg({ type: 'success', text: '✅ Senha alterada com sucesso!' });

      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    }

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}></div>

      <form onSubmit={handleChangePassword} className={styles.form}>
        <header className={styles.logoHeader}>
          <img
            src="/logocomnome.png"
            alt="BarretoFlix"
            className={styles.logo}
          />
          <p>Alterar senha</p>
        </header>

        <div className={styles.divider}></div>

        {msg && (
          <div className={`${styles.message} ${styles[msg.type]}`}>
            {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.label}>
            SENHA ATUAL
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={styles.input}
          />
          <span className={styles.inputIcon}>🔐</span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.label}>
            NOVA SENHA
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            placeholder="mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className={styles.input}
          />
          <span className={styles.inputIcon}>🔒</span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            CONFIRMAR NOVA SENHA
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="digite novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={styles.input}
          />
          <span className={styles.inputIcon}>✓</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${styles.button} ${loading ? styles.loading : ''}`}
        >
          {loading ? "ALTERANDO..." : "ALTERAR SENHA"}
        </button>

        <div className={styles.backLink}>
          <button type="button" onClick={() => navigate('/profile')} className={styles.backButton}>
            ← Voltar para o perfil
          </button>
        </div>
      </form>

      <div className={styles.filmStrip}></div>
      <div className={`${styles.filmStrip} ${styles.filmStripRight}`}></div>
      <div className={styles.filmCode}>BARRETOFLIX_001</div>
    </div>
  );
}