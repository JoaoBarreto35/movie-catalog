// src/components/Skeleton/index.tsx
import styles from "./styles.module.css";

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const style = {
    width: width || (variant === 'text' ? '100%' : '40px'),
    height: height || (variant === 'text' ? '20px' : variant === 'circular' ? '40px' : '100px')
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <Skeleton variant="rectangular" height={200} />
      <div className={styles.content}>
        <Skeleton width="80%" />
        <Skeleton width="60%" />
        <Skeleton width="40%" />
      </div>
    </div>
  );
}

export function CarouselSkeleton() {
  return (
    <div className={styles.carouselSkeleton}>
      {[1, 2, 3, 4, 5].map(i => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}