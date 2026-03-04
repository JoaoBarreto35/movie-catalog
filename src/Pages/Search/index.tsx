import { useState, useEffect } from "react";
import { searchMovies } from "../../services/movieService";
import { MovieCard } from "../../components/MovieCard";
import styles from "./styles.module.css";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const { results, total_pages } = await searchMovies(query, page);
      setResults(results);
      setTotalPages(total_pages);

      // Scroll pro topo quando busca
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function nextPage() {
    if (page < totalPages) {
      setPage((p) => p + 1);
    }
  }

  function prevPage() {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }

  // Efeito pra buscar quando a página muda
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [page]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Buscar Filmes</h1>
        <p className={styles.subtitle}>Encontre seus filmes favoritos</p>
      </div>

      {/* Formulário de busca */}
      <form onSubmit={handleSearch} className={styles.form}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Digite o nome do filme..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // Reseta página quando muda a busca
            }}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            🔍 Buscar
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Buscando filmes...</p>
        </div>
      )}

      {/* Resultados */}
      {!loading && hasSearched && (
        <>
          {results.length > 0 ? (
            <>
              <div className={styles.resultsInfo}>
                <span className={styles.resultsCount}>
                  {results.length} filmes encontrados
                </span>
              </div>

              <div className={styles.results}>
                {results.map((m) => (
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

              {/* Paginação */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={prevPage}
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
                    onClick={nextPage}
                    disabled={page === totalPages}
                    className={styles.pageButton}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          ) : (
            // Nenhum resultado
            <div className={styles.noResults}>
              <span className={styles.noResultsIcon}>🔍</span>
              <h3>Nenhum filme encontrado</h3>
              <p>Tente buscar com outro termo</p>
            </div>
          )}
        </>
      )}

      {/* Estado inicial (sem busca) */}
      {!hasSearched && !loading && (
        <div className={styles.initialState}>
          <span className={styles.initialIcon}>🎬</span>
          <h3>Busque por seus filmes favoritos</h3>
          <p>Digite o nome de um filme para começar</p>
        </div>
      )}
    </div>
  );
}

export default Search;