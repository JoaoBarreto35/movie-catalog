import { Link } from "react-router-dom";
import styles from "./styles.module.css";

export function NotFound() {
  return (
    <div className={styles.container}>
      {/* Efeito de luz de projetor */}
      <div className={styles.projectorLight}></div>

      {/* Rolos de filme decorativos */}
      <div className={styles.filmReel}></div>
      <div className={`${styles.filmReel} ${styles.filmReelRight}`}></div>

      <div className={styles.content}>
        {/* Número 404 estilizado */}
        <div className={styles.errorCode}>
          <span className={styles.digit}>4</span>
          <span className={styles.digit}>0</span>
          <span className={styles.digit}>4</span>
        </div>

        {/* Mensagem principal */}
        <h1 className={styles.title}>FILME NÃO ENCONTRADO</h1>

        <div className={styles.filmStrip}>
          <div className={styles.strip}></div>
          <div className={styles.strip}></div>
          <div className={styles.strip}></div>
        </div>

        <p className={styles.message}>
          Parece que este rolo de filme foi perdido na sala de edição...
        </p>

        <p className={styles.subMessage}>
          O filme que você procura pode ter sido movido, renomeado ou nunca existiu.
        </p>

        {/* Sugestões */}
        <div className={styles.suggestions}>
          <h3>Que tal tentar:</h3>
          <ul>
            <li>🎬 Voltar para o início</li>
            <li>🔍 Buscar outro filme</li>
            <li>🍿 Explorar as categorias</li>
          </ul>
        </div>

        {/* Botões de ação */}
        <div className={styles.actions}>
          <Link to="/home" className={styles.primaryButton}>
            ← VOLTAR PARA HOME
          </Link>
          <Link to="/search" className={styles.secondaryButton}>
            🔍 BUSCAR FILMES
          </Link>
        </div>
      </div>

      {/* Mensagem de código do filme */}
      <div className={styles.filmCode}>
        <span>ERR_FILME_404</span>
        <span>TAKE_01</span>
      </div>
    </div>
  );
}