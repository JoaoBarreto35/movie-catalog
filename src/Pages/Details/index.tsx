import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieDetails, getSimilarMovies, getMovieVideos } from "../../services/movieService";
import { addToList, removeFromList, isInList } from "../../services/listService";
import { MovieCard } from "../../components/MovieCard";
import styles from "./styles.module.css";

function Details() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);

  const [movie, setMovie] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [trailer, setTrailer] = useState<any>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Estados para minha lista
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const details = await getMovieDetails(movieId);
        setMovie(details);
        
        // Verificar status nos favoritos
        const favoriteStatus = await isInList(movieId.toString(), 'favorites');
        setIsFavorite(favoriteStatus);
        
        // Verificar status na watchlist
        const watchlistStatus = await isInList(movieId.toString(), 'watchlist');
        setIsInWatchlist(watchlistStatus);
        
        const video = await getMovieVideos(movieId);
        setTrailer(video);

        const sims = await getSimilarMovies(movieId);
        setSimilar(sims);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [movieId]);

  // Função para alternar favorito
  const toggleFavorite = async () => {
    if (favoriteLoading) return;
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        const result = await removeFromList(movieId.toString(), 'favorites');
        if (result.success) setIsFavorite(false);
      } else {
        const result = await addToList(movieId.toString(), 'movie', 'favorites');
        if (result.success) setIsFavorite(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Função para alternar watchlist
  const toggleWatchlist = async () => {
    if (watchlistLoading) return;
    
    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        const result = await removeFromList(movieId.toString(), 'watchlist');
        if (result.success) setIsInWatchlist(false);
      } else {
        const result = await addToList(movieId.toString(), 'movie', 'watchlist');
        if (result.success) setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar watchlist:", error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Carregando detalhes do filme...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Hero com backdrop */}
      {movie.backdrop_path && (
        <div className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            className={styles.heroBackdrop}
          />
          <div className={styles.heroGradient}></div>
        </div>
      )}

      <div className={styles.contentWrapper}>
        <div className={styles.infoSection}>
          <div className={styles.posterPlaceholder}>
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className={styles.poster}
              />
            ) : (
              <div className={styles.noPoster}>🎬</div>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{movie.title}</h1>

            <div className={styles.metadata}>
              {movie.release_date && (
                <span className={styles.year}>{movie.release_date.slice(0, 4)}</span>
              )}

              {movie.vote_average > 0 && (
                <span className={styles.rating}>
                  <span className={styles.star}>★</span>
                  {movie.vote_average.toFixed(1)}
                </span>
              )}

              {movie.runtime > 0 && (
                <span className={styles.runtime}>{movie.runtime} min</span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className={styles.genres}>
                {movie.genres.map((genre: any) => (
                  <Link
                    key={genre.id}
                    to={`/category/${genre.id}`}
                    className={styles.genre}
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {movie.tagline && (
              <p className={styles.tagline}>"{movie.tagline}"</p>
            )}

            {movie.overview && (
              <div className={styles.synopsisSection}>
                <h3>Sinopse</h3>
                <p className={styles.synopsis}>{movie.overview}</p>
              </div>
            )}

            {/* Botões de ação */}
<div className={styles.actionButtons}>
  {trailer && (
    <button
      onClick={() => setShowTrailer(true)}
      className={styles.trailerButton}
    >
      ▶ VER TRAILER
    </button>
  )}

  {/* Botão Minha Lista */}
  <button
    onClick={toggleWatchlist}
    className={`${styles.listButton} ${isInWatchlist ? styles.inList : ''}`}
    disabled={watchlistLoading}
    title={isInWatchlist ? "Remover da lista" : "Adicionar à lista"}
  >
    {watchlistLoading ? (
      <div className={styles.spinnerSmall}></div>
    ) : (
      <>
        <svg
          viewBox="0 0 24 24"
          fill={isInWatchlist ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.listIcon}
        >
          {isInWatchlist ? (
            <polyline points="20 6 9 17 4 12"></polyline> // Ícone de Check
          ) : (
            <>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </>
          )}
        </svg>
        <span className={styles.listButtonText}>
          {isInWatchlist ? "NA LISTA" : "MINHA LISTA"}
        </span>
      </>
    )}
  </button>

  {/* Botão de Favorito */}
  <button
    onClick={toggleFavorite}
    className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
    disabled={favoriteLoading}
    title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
  >
    <svg
      viewBox="0 0 24 24"
      fill={isFavorite ? "var(--color-primary, #ff5e00)" : "none"}
      stroke={isFavorite ? "var(--color-primary, #ff5e00)" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.heartIcon}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  </button>
</div>
          </div>
        </div>

        {/* Player Section */}
        <div className={styles.playerSection}>
          <h3 className={styles.sectionTitle}>Assistir Agora</h3>
          <div className={styles.playerWrapper}>
            <iframe
              src={`https://playerflixapi.com/filme/${id}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              scrolling="no"
              className={styles.player}
              title={movie.title}
            />
          </div>
        </div>

        {/* Filmes Semelhantes */}
        {similar.length > 0 && (
          <div className={styles.similarSection}>
            <h3 className={styles.sectionTitle}>Filmes Semelhantes</h3>
            <div className={styles.grid}>
              {similar.map((m) => (
                <MovieCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  posterPath={m.poster_path}
                  voteAverage={m.vote_average}
                  releaseDate={m.release_date}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal do Trailer */}
      {showTrailer && trailer && (
        <div className={styles.modalOverlay} onClick={() => setShowTrailer(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowTrailer(false)}>
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title={trailer.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.trailerIframe}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;