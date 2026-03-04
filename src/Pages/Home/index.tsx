import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGenres, getMoviesByCategory, getPopularMovies, getMovieDetails } from "../../services/movieService";
import { addToList, removeFromList, isInList, getUserList } from "../../services/listService";
import { Carousel } from "../../components/Carousel";
import styles from "./styles.module.css";

function Home() {
  const [popular, setPopular] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<any>(null);
  
  // Estados para a Watchlist (Minha Lista)
  const [isMovieInList, setIsMovieInList] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [myListMovies, setMyListMovies] = useState<any[]>([]);

  // Estado para Favoritos
  const [favoriteMovies, setFavoriteMovies] = useState<any[]>([]);

  // Função auxiliar para transformar IDs do banco em detalhes do TMDB
  const fetchMoviesDetails = async (items: any[]) => {
    const promises = items.map(async (item) => {
      try {
        return await getMovieDetails(parseInt(item.item_id));
      } catch (err) {
        return null;
      }
    });
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  };

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Filmes Populares e Hero
        const popularMovies = await getPopularMovies();
        setPopular(popularMovies);

        if (popularMovies.length > 0) {
          const randomIndex = Math.floor(Math.random() * popularMovies.length);
          const selectedHero = popularMovies[randomIndex];
          setHeroMovie(selectedHero);
          const inList = await isInList(selectedHero.id.toString(), 'watchlist');
          setIsMovieInList(inList);
        }

        // 2. Gêneros e Categorias
        const gs = await getGenres();
        setGenres(gs);
        const catResults: Record<number, any[]> = {};
        for (const g of gs.slice(0, 5)) {
          const { results: movies } = await getMoviesByCategory(g.id, 1);
          catResults[g.id] = movies.slice(0, 20);
        }
        setMoviesByCategory(catResults);

        // 3. Carregar "Minha Lista" (Watchlist)
        const { data: watchlistData } = await getUserList('watchlist');
        if (watchlistData) {
          const detailedWatchlist = await fetchMoviesDetails(watchlistData);
          setMyListMovies(detailedWatchlist);
        }

        // 4. Carregar "Favoritos"
        const { data: favoritesData } = await getUserList('favorites');
        if (favoritesData) {
          const detailedFavorites = await fetchMoviesDetails(favoritesData);
          setFavoriteMovies(detailedFavorites);
        }

      } catch (err) {
        console.error("Erro ao carregar dados da Home:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleWatchlist = async () => {
    if (!heroMovie || listLoading) return;
    setListLoading(true);
    try {
      if (isMovieInList) {
        await removeFromList(heroMovie.id.toString(), 'watchlist');
        setIsMovieInList(false);
        // Atualiza o carrossel localmente removendo o filme
        setMyListMovies(prev => prev.filter(m => m.id !== heroMovie.id));
      } else {
        await addToList(heroMovie.id.toString(), 'movie', 'watchlist');
        setIsMovieInList(true);
        // Adiciona o filme atual ao carrossel da lista
        setMyListMovies(prev => [heroMovie, ...prev]);
      }
    } finally {
      setListLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      {heroMovie && (
        <section className={styles.hero}>
          <img
            src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`}
            alt={heroMovie.title}
            className={styles.heroBackdrop}
          />
          <div className={styles.heroGradient}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{heroMovie.title}</h1>
            <p className={styles.heroOverview}>{heroMovie.overview?.slice(0, 150)}...</p>
            <div className={styles.heroButtons}>
              <Link to={`/details/${heroMovie.id}`} className={styles.heroButton}>▶ ASSISTIR</Link>
              <button 
                onClick={handleToggleWatchlist} 
                className={`${styles.heroButton} ${isMovieInList ? styles.activeList : ''}`}
                disabled={listLoading}
              >
                {listLoading ? '...' : isMovieInList ? '✓ NA LISTA' : '+ MINHA LISTA'}
              </button>
            </div>
          </div>
        </section>
      )}

      <div className={styles.content}>

        {/* 2. Populares */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>POPULARES</h2>
            <span className={styles.sectionBadge}>🔥</span>
          </div>
          <Carousel movies={popular.slice(0, 20)} />
        </section>

        {/* 3. Categorias Dinâmicas */}
        {genres.slice(0, 5).map((g) => (
          <section key={g.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{g.name}</h2>
              <Link to={`/category/${g.id}`} className={styles.seeAll}>VER TUDO →</Link>
            </div>
            <Carousel movies={moviesByCategory[g.id] || []} />
          </section>
        ))}
        {/* 1. Minha Lista (Watchlist) - Logo no topo para fácil acesso */}
        {myListMovies.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>MINHA LISTA</h2>
              <span className={styles.sectionBadge}>📝</span>
            </div>
            <Carousel movies={myListMovies} />
          </section>
        )}
        {/* 4. Favoritos - No final da página como curadoria pessoal */}
        {favoriteMovies.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>MEUS FAVORITOS</h2>
              <span className={styles.sectionBadge}>❤️</span>
            </div>
            <Carousel movies={favoriteMovies} />
          </section>
        )}
      </div>
    </div>
  );
}

export default Home;