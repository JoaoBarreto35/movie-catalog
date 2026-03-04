// Home.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGenres, getMoviesByCategory, getPopularMovies } from "../../services/movieService";
import { Carousel } from "../../components/Carousel";
import styles from "./styles.module.css";

function Home() {
  const [popular, setPopular] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const popularMovies = await getPopularMovies();
        setPopular(popularMovies);

        // Pega um filme aleatório dos populares pra ser o herói
        if (popularMovies.length > 0) {
          const randomIndex = Math.floor(Math.random() * popularMovies.length);
          setHeroMovie(popularMovies[randomIndex]);
        }

        const gs = await getGenres();
        setGenres(gs);

        const results: Record<number, any[]> = {};
        for (const g of gs.slice(0, 5)) { // 5 categorias fica bom
          const { results: movies } = await getMoviesByCategory(g.id, 1);
          results[g.id] = movies.slice(0, 20); // limita a 10 filmes
        }
        setMoviesByCategory(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHero}></div>
        <div className={styles.skeletonCarousel}></div>
        <div className={styles.skeletonCarousel}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Section - Destaque igual Netflix/HBO */}
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
            <p className={styles.heroOverview}>
              {heroMovie.overview?.slice(0, 150)}...
            </p>
            <div className={styles.heroButtons}>
              <Link to={`/details/${heroMovie.id}`} className={styles.heroButton}>
                ▶ ASSISTIR
              </Link>
              <button className={styles.heroButtonOutline}>
                + MINHA LISTA
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Seção de Populares com título estilizado */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>POPULARES</h2>
          <span className={styles.sectionBadge}>🔥</span>
        </div>
        <Carousel movies={popular.slice(0, 15)} />
      </section>

      {/* Categorias */}
      {genres.slice(0, 5).map((g) => (
        <section key={g.id} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{g.name}</h2>
            <Link to={`/category/${g.id}`} className={styles.seeAll}>
              VER TUDO →
            </Link>
          </div>
          <Carousel movies={moviesByCategory[g.id] || []} />
        </section>
      ))}
    </div>
  );
}

export default Home;