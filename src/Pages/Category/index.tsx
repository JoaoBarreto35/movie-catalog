import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMoviesByCategory, getGenres } from "../../services/movieService";
import { MovieCard } from "../../components/MovieCard";
import styles from "./styles.module.css";

function Category() {
  const { id } = useParams<{ id: string }>();
  const genreId = Number(id);

  const [movies, setMovies] = useState<any[]>([]);
  const [genreName, setGenreName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { results, total_pages } = await getMoviesByCategory(genreId, page);
        setMovies(results);
        setTotalPages(total_pages);

        const genres = await getGenres();
        const g = genres.find((x) => x.id === genreId);
        setGenreName(g ? g.name : "Categoria");

        // Scroll pro topo quando muda de página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [genreId, page]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando filmes...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header da categoria */}
      <div className={styles.categoryHeader}>
        <h1 className={styles.categoryTitle}>{genreName}</h1>
        <span className={styles.movieCount}>{movies.length} filmes</span>
      </div>

      {/* Grid de filmes */}
      {movies.length > 0 ? (
        <div className={styles.grid}>
          {movies.map((m) => (
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
      ) : (
        <div className={styles.emptyState}>
          <p>Nenhum filme encontrado nesta categoria</p>
          <Link to="/home" className={styles.backLink}>Voltar para Home</Link>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={styles.pageButton}
          >
            ← Anterior
          </button>

          <div className={styles.pageInfo}>
            <span className={styles.currentPage}>{page}</span>
            <span className={styles.totalPages}>de {totalPages}</span>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className={styles.pageButton}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

export default Category;