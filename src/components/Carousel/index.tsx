import styles from "./styles.module.css";
import { MovieCard } from "../MovieCard";

interface CarouselProps {
  movies: {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
    release_date?: string;
  }[];
}

export function Carousel({ movies }: CarouselProps) {
  return (
    <div className={styles.carousel}>
      {movies.map((m) => (
        <div key={m.id} className={styles.slide}>
          <MovieCard
            id={m.id}
            title={m.title}
            posterPath={m.poster_path}
            voteAverage={m.vote_average}
            releaseDate={m.release_date || ''}
          />
        </div>
      ))}
    </div>
  );
}