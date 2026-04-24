// src/Pages/Welcome/index.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage(error.message);
    } else {
      navigate('/home');
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}></div>

      <div className={styles.card}>
        <div className={styles.icon}>🎉</div>

        <h1 className={styles.title}>Bem-vindo ao Aura Flix!</h1>


        {!showPasswordForm ? (
          <>
            <p className={styles.message}>
              Sua conta foi criada com sucesso!<br />
              Para sua segurança, recomendamos trocar sua senha.
            </p>

            <div className={styles.buttonGroup}>
              <button
                onClick={() => setShowPasswordForm(true)}
                className={styles.primaryButton}
              >
                🔐 Trocar minha senha
              </button>
              <button
                onClick={() => navigate('/home')}
                className={styles.secondaryButton}
              >
                🎬 Ir assistir (trocar depois)
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleChangePassword} className={styles.passwordForm}>
            <p className={styles.message}>Digite sua nova senha:</p>

            {message && (
              <div className={styles.errorMessage}>{message}</div>
            )}

            <div className={styles.formGroup}>
              <input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                required
                minLength={6}
              />
              <span className={styles.inputIcon}>🔒</span>
            </div>

            <div className={styles.formGroup}>
              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
              />
              <span className={styles.inputIcon}>✓</span>
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" disabled={loading} className={styles.primaryButton}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className={styles.secondaryButton}
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}