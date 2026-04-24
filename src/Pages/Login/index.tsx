// src/Pages/Login/index.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMsg("Erro ao obter dados do usuário");
      setLoading(false);
      return;
    }

    // 🔥 VERIFICAR SE É PRIMEIRO ACESSO USANDO last_sign_in_at
    // Se last_sign_in_at for null, é o primeiro login!
    const isFirstLogin = !data.user.last_sign_in_at;

    if (isFirstLogin) {
      navigate('/welcome');
    } else {
      navigate('/home');
    }

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}></div>

      <form onSubmit={signIn} className={styles.form}>
        <header className={styles.logoHeader}>
          <img
            src="/logocomnome.png"
            alt="BarretoFlix"
            className={styles.logo}
          />
          <p>Luz, câmera... Logar</p>
        </header>

        <div className={styles.divider}></div>

        {msg && (
          <div className={styles.errorMessage}>
            ⚠️ {msg}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            E-MAIL
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <span className={styles.inputIcon}>🎥</span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            SENHA
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <span className={styles.inputIcon}>🔐</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${styles.button} ${loading ? styles.loading : ''}`}
        >
          {loading ? "ACESSANDO..." : "ACESSAR"}
        </button>

        <div className={styles.signupLink}>
          <span>PRIMEIRA VEZ?</span>
          <a href="/plans">CRIAR CONTA</a>
        </div>
      </form>

      <div className={styles.filmStrip}></div>
      <div className={`${styles.filmStrip} ${styles.filmStripRight}`}></div>
      <div className={styles.filmCode}>AURA_FLIX</div>
    </div>
  );
}