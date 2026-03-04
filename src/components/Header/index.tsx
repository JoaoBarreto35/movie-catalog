import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getGenres } from "../../services/movieService";
import styles from "./styles.module.css";

export function Header() {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsCategoriesOpen(false); // fecha categorias ao abrir menu
    }
  }

  function toggleCategories(e: React.MouseEvent) {
    e.stopPropagation();
    setIsCategoriesOpen(!isCategoriesOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
    setIsCategoriesOpen(false);
  }

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}>
      <Link to="/home" className={styles.logoLink}>
        <img src="/logocomnome.png" alt="BarretoFlix" className={styles.logoImage} />
      </Link>

      {/* Menu Desktop */}
      <nav className={styles.desktopNav}>
        <Link to="/home">Home</Link>
        <div className={styles.desktopDropdown}>
          <button className={styles.desktopDropbtn}>
            Categorias <span>▼</span>
          </button>
          <div className={styles.desktopDropdownContent}>
            {genres.map((g) => (
              <Link key={g.id} to={`/category/${g.id}`}>
                {g.name}
              </Link>
            ))}
          </div>
        </div>
        <Link to="/search">Buscar</Link>
      </nav>

      {/* Botão Sair Desktop */}
      <div className={styles.desktopProfile}>
        <button onClick={handleLogout}>Sair</button>
      </div>

      {/* Botão Menu Mobile */}
      <button
        className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menu Mobile */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileMenuHeader}>
          <img src="/logocomnome.png" alt="BarretoFlix" className={styles.mobileLogo} />

        </div>

        <div className={styles.mobileMenuContent}>
          <Link to="/home" onClick={closeMenu}>Home</Link>

          <div className={styles.mobileCategories}>
            <button
              className={styles.mobileCategoriesBtn}
              onClick={toggleCategories}
            >
              Categorias <span>{isCategoriesOpen ? "▲" : "▼"}</span>
            </button>

            {isCategoriesOpen && (
              <div className={styles.mobileCategoriesList}>
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/category/${g.id}`}
                    onClick={closeMenu}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/search" onClick={closeMenu}>Buscar</Link>

          <button className={styles.mobileLogout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}