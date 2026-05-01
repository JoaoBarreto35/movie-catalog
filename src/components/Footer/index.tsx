import styles from "./styles.module.css";
import tmdbLogo from "/path-to-your-tmdb-logo.svg";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p>
          © {new Date().getFullYear()} AuraFlix. Todos os direitos reservados.
        </p>
        <div className={styles.tmdbAttribution}>
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={tmdbLogo}
              alt="The Movie Database (TMDB) Logo"
              className={styles.tmdbLogo}
            />
          </a>
          <p>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}