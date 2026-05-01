// src/Pages/UserProfile/index.tsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getHistory, getHistoryStats } from "../../services/historyService";
import { getUserList } from "../../services/listService";
import { getMovieDetails } from "../../services/movieService";
import { getTVShowDetails } from "../../services/tvService";
import { Card } from "../../components/Card";
import { Carousel } from "../../components/Carousel";
import styles from "./styles.module.css";

type TabType = 'resumo' | 'lista' | 'favoritos' | 'historico' | 'assinatura';

interface ProcessedItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  watched_at?: string;
  mediaType: 'movie' | 'tv';
  current_season?: number;
  current_episode?: number;
  current_episode_title?: string;
}

function UserProfile() {
  const [activeTab, setActiveTab] = useState<TabType>('resumo');
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  // Dados das abas
  const [stats, setStats] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<ProcessedItem[]>([]);
  const [favorites, setFavorites] = useState<ProcessedItem[]>([]);
  const [recentHistory, setRecentHistory] = useState<ProcessedItem[]>([]);
  const [historyCount, setHistoryCount] = useState(0);

  // Cache
  const itemCache = new Map<string, any>();

  // =====================================================
  // FUNÇÃO: Buscar detalhes de filmes OU séries
  // =====================================================
  const fetchItemDetails = useCallback(async (items: any[]): Promise<ProcessedItem[]> => {
    const promises = items.map(async (item) => {
      const id = parseInt(item.item_id);
      const mediaType = item.item_type as 'movie' | 'tv';
      const cacheKey = `${mediaType}-${id}`;

      if (itemCache.has(cacheKey)) return itemCache.get(cacheKey);

      try {
        if (mediaType === 'movie') {
          const details = await getMovieDetails(id);
          const processed: ProcessedItem = {
            id: details.id,
            title: details.title,
            poster_path: details.poster_path,
            vote_average: details.vote_average,
            release_date: details.release_date,
            mediaType: 'movie'
          };
          itemCache.set(cacheKey, processed);
          return processed;
        } else {
          const details = await getTVShowDetails(id);
          const processed: ProcessedItem = {
            id: details.id,
            title: details.name,
            poster_path: details.poster_path,
            vote_average: details.vote_average,
            release_date: details.first_air_date,
            mediaType: 'tv'
          };
          itemCache.set(cacheKey, processed);
          return processed;
        }
      } catch (err) {
        console.error(`Erro ao buscar detalhes do item ${id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((item): item is ProcessedItem => item !== null);
  }, []);

  // =====================================================
  // FUNÇÃO: Processar histórico
  // =====================================================
  const processHistoryItems = useCallback((items: any[]): ProcessedItem[] => {
    return items.map((item: any) => ({
      id: parseInt(item.item_id),
      title: item.item_data?.title || 'Título não disponível',
      poster_path: item.item_data?.poster_path || null,
      vote_average: item.item_data?.vote_average || 0,
      release_date: item.item_data?.release_date,
      watched_at: item.watched_at,
      mediaType: item.item_type === 'tv' ? 'tv' : 'movie',
      current_season: item.item_data?.current_season,
      current_episode: item.item_data?.current_episode,
      current_episode_title: item.item_data?.current_episode_title
    }));
  }, []);

  // =====================================================
  // LOAD: Carregar dados do usuário
  // =====================================================
  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      setUser(user);

      // Buscar planos disponíveis
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price');
      setPlans(plansData || []);

      // Buscar assinatura ativa
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      setSubscription(subData);

      // Buscar transações do usuário
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false })
        .limit(10);
      setTransactions(transactionsData || []);

      // Carrega tudo em paralelo
      const [
        statsResult,
        watchlistResult,
        favoritesResult,
        historyResult
      ] = await Promise.all([
        getHistoryStats(),
        getUserList('watchlist'),
        getUserList('favorites'),
        getHistory(20, 0)
      ]);

      if (statsResult.success && statsResult.data) setStats(statsResult.data);

      if (watchlistResult.data) {
        const detailedWatchlist = await fetchItemDetails(watchlistResult.data);
        setWatchlist(detailedWatchlist);
      }

      if (favoritesResult.data) {
        const detailedFavorites = await fetchItemDetails(favoritesResult.data);
        setFavorites(detailedFavorites);
      }

      if (historyResult.success && historyResult.data) {
        const processedHistory = processHistoryItems(historyResult.data);
        const sortedHistory = processedHistory.sort((a, b) =>
          new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime()
        );
        setRecentHistory(sortedHistory);
        setHistoryCount(historyResult.total || 0);
      }

    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      setError(error.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // FUNÇÕES DA ASSINATURA
  // =====================================================
  // src/Pages/UserPage/index.tsx

  async function cancelSubscription() {
    if (!subscription) return;
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você terá acesso até o final do período já pago.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        'https://auszyqasqmvxfdanvytz.supabase.co/functions/v1/cancel-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            subscriptionId: subscription.id,
            subscriptionCode: subscription.perfectpay_subscription_id
          })
        }
      );

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: 'success', text: '✅ Assinatura cancelada com sucesso!' });
      setSubscription((prev: any) => prev ? { ...prev, cancel_at_period_end: true } : prev);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function reactivateSubscription() {
    try {
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: false })
        .eq('id', subscription?.id);

      setMessage({ type: 'success', text: '✅ Assinatura reativada!' });
      setSubscription((prev: any) => prev ? { ...prev, cancel_at_period_end: false } : prev);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  function getInitials(email: string) {
    return email?.substring(0, 2).toUpperCase() || 'U';
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando seu perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <h2>Ops! Algo deu errado</h2>
        <p>{error}</p>
        <button onClick={loadUserData} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Mensagem de feedback */}
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Header do Perfil */}
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt={user.email} />
          ) : (
            <span>{getInitials(user?.email || 'U')}</span>
          )}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>
            {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
          </h1>
          <p className={styles.profileEmail}>{user?.email}</p>
          <p className={styles.profileMemberSince}>
            Membro desde {formatDate(user?.created_at)}
          </p>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total_items || 0}</span>
            <span className={styles.statLabel}>Itens assistidos</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{watchlist.length}</span>
            <span className={styles.statLabel}>Na lista</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{favorites.length}</span>
            <span className={styles.statLabel}>Favoritos</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.unique_days || 0}</span>
            <span className={styles.statLabel}>Dias ativos</span>
          </div>
        </div>
      )}

      {/* Abas de Navegação */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'resumo' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('resumo')}
        >
          Resumo
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'lista' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('lista')}
        >
          Minha Lista <span className={styles.tabCount}>({watchlist.length})</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'favoritos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('favoritos')}
        >
          Favoritos <span className={styles.tabCount}>({favorites.length})</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'historico' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico <span className={styles.tabCount}>({historyCount})</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'assinatura' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('assinatura')}
        >
          Assinatura
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className={styles.tabContent}>
        {/* ABA RESUMO */}
        {activeTab === 'resumo' && (
          <div className={styles.resumo}>
            {recentHistory.length > 0 && (
              <section className={styles.resumoSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Continue Assistindo</h2>
                  <button
                    onClick={() => setActiveTab('historico')}
                    className={styles.seeAllLink}
                  >
                    Ver tudo →
                  </button>
                </div>
                <Carousel items={recentHistory.slice(0, 10)} />
              </section>
            )}

            {watchlist.length > 0 && (
              <section className={styles.resumoSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Minha Lista</h2>
                  <button
                    onClick={() => setActiveTab('lista')}
                    className={styles.seeAllLink}
                  >
                    Ver tudo →
                  </button>
                </div>
                <div className={styles.miniGrid}>
                  {watchlist.slice(0, 6).map((item) => (
                    <Card
                      key={`watchlist-${item.mediaType}-${item.id}`}
                      id={item.id}
                      title={item.title}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      year={item.release_date}
                      mediaType={item.mediaType}
                    />
                  ))}
                </div>
              </section>
            )}

            {favorites.length > 0 && (
              <section className={styles.resumoSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Favoritos</h2>
                  <button
                    onClick={() => setActiveTab('favoritos')}
                    className={styles.seeAllLink}
                  >
                    Ver tudo →
                  </button>
                </div>
                <div className={styles.miniGrid}>
                  {favorites.slice(0, 6).map((item) => (
                    <Card
                      key={`favorite-${item.mediaType}-${item.id}`}
                      id={item.id}
                      title={item.title}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      year={item.release_date}
                      mediaType={item.mediaType}
                    />
                  ))}
                </div>
              </section>
            )}

            {recentHistory.length === 0 && watchlist.length === 0 && favorites.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🎬</span>
                <h3>Bem-vindo ao BarretoFlix!</h3>
                <p>Comece explorando filmes e séries</p>
                <Link to="/home" className={styles.exploreButton}>
                  Explorar catálogo
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ABA MINHA LISTA */}
        {activeTab === 'lista' && (
          <div className={styles.fullList}>
            {watchlist.length > 0 ? (
              <>
                <div className={styles.listHeader}>
                  <h2 className={styles.listTitle}>Minha Lista</h2>
                  <p className={styles.listCount}>{watchlist.length} itens</p>
                </div>
                <div className={styles.grid}>
                  {watchlist.map((item) => (
                    <Card
                      key={`watchlist-full-${item.mediaType}-${item.id}`}
                      id={item.id}
                      title={item.title}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      year={item.release_date}
                      mediaType={item.mediaType}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>Sua lista está vazia</h3>
                <p>Adicione filmes e séries para assistir depois</p>
                <Link to="/home" className={styles.exploreButton}>
                  Explorar catálogo
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ABA FAVORITOS */}
        {activeTab === 'favoritos' && (
          <div className={styles.fullList}>
            {favorites.length > 0 ? (
              <>
                <div className={styles.listHeader}>
                  <h2 className={styles.listTitle}>Meus Favoritos</h2>
                  <p className={styles.listCount}>{favorites.length} itens</p>
                </div>
                <div className={styles.grid}>
                  {favorites.map((item) => (
                    <Card
                      key={`favorite-full-${item.mediaType}-${item.id}`}
                      id={item.id}
                      title={item.title}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      year={item.release_date}
                      mediaType={item.mediaType}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>❤️</span>
                <h3>Nenhum favorito ainda</h3>
                <p>Marque filmes e séries como favoritos</p>
                <Link to="/home" className={styles.exploreButton}>
                  Explorar catálogo
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className={styles.fullList}>
            {recentHistory.length > 0 ? (
              <>
                <div className={styles.listHeader}>
                  <h2 className={styles.listTitle}>Histórico</h2>
                  <p className={styles.listCount}>{historyCount} itens assistidos</p>
                </div>
                <div className={styles.timeline}>
                  {recentHistory.map((item) => (
                    <div key={`history-${item.mediaType}-${item.id}-${item.watched_at}`} className={styles.timelineItem}>
                      <div className={styles.timelineDate}>
                        {item.watched_at && formatDate(item.watched_at)}
                      </div>
                      <div className={styles.timelineContent}>
                        <Card
                          id={item.id}
                          title={item.title}
                          posterPath={item.poster_path}
                          voteAverage={item.vote_average}
                          year={item.release_date}
                          mediaType={item.mediaType}
                          currentSeason={item.current_season}
                          currentEpisode={item.current_episode}
                          currentEpisodeTitle={item.current_episode_title}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>⏱️</span>
                <h3>Seu histórico está vazio</h3>
                <p>Os filmes e séries que você assistir aparecerão aqui</p>
                <Link to="/home" className={styles.exploreButton}>
                  Explorar catálogo
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ABA ASSINATURA */}
        {activeTab === 'assinatura' && (
          <div className={styles.billingSection}>
            {subscription ? (
              <>
                {/* CARD DA ASSINATURA ATUAL */}
                <div className={styles.subscriptionCard}>
                  <h2 className={styles.sectionTitle}>Meu plano atual</h2>

                  <div className={styles.planDetails}>
                    <div className={styles.planName}>
                      {subscription.plans?.name || 'Plano Mensal'}
                      {subscription.cancel_at_period_end && (
                        <span className={styles.cancelBadge}>Cancelamento solicitado</span>
                      )}
                    </div>

                    <div className={styles.planPrice}>
                      R$ {subscription.plans?.price || 19.90} / {subscription.plans?.interval === 'month' ? 'mês' : 'ano'}
                    </div>

                    <div className={styles.planStatus}>
                      <span className={subscription.cancel_at_period_end ? styles.statusWarning : styles.statusActive}>
                        {subscription.cancel_at_period_end ? '🟡 Cancelamento pendente' : '🟢 Ativo'}
                      </span>
                    </div>

                    <div className={styles.planDates}>
                      <p>
                        <strong>Próxima cobrança:</strong>{' '}
                        {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                      </p>
                      <p>
                        <strong>Forma de pagamento:</strong>{' '}
                        {subscription.payment_method === 'pix' ? 'PIX' : 'Cartão de crédito'}
                      </p>
                      {subscription.perfectpay_subscription_id && (
                        <p>
                          <strong>Código da assinatura:</strong>{' '}
                          <code className={styles.subscriptionCode}>{subscription.perfectpay_subscription_id}</code>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.subscriptionActions}>
                    {subscription.cancel_at_period_end ? (
                      <button onClick={reactivateSubscription} className={styles.reactivateButton}>
                        🔄 Reativar assinatura
                      </button>
                    ) : (
                      <button onClick={cancelSubscription} className={styles.cancelButton}>
                        ❌ Cancelar assinatura
                      </button>
                    )}
                  </div>

                  <p className={styles.cancelInfo}>
                    ⚡ Ao cancelar, você terá acesso até o final do período já pago.
                  </p>
                </div>

                {/* PLANOS DISPONÍVEIS */}
                {plans && plans.length > 1 && (
                  <div className={styles.availablePlans}>
                    <h3 className={styles.plansTitle}>Outros planos disponíveis</h3>
                    <div className={styles.plansGrid}>
                      {plans
                        .filter(p => p.id !== subscription?.plan_id)
                        .map(plan => (
                          <div key={plan.id} className={styles.planCard}>
                            <h4 className={styles.planCardName}>{plan.name}</h4>
                            <div className={styles.planCardPrice}>
                              R$ {plan.price.toFixed(2)}
                              <span className={styles.planCardPeriod}>/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                            </div>
                            <ul className={styles.planCardFeatures}>
                              {plan.features?.slice(0, 3).map((feature: string, i: number) => (
                                <li key={i}>✓ {feature}</li>
                              ))}
                              {plan.features?.length > 3 && (
                                <li className={styles.moreFeatures}>+{plan.features.length - 3} outras vantagens</li>
                              )}
                            </ul>
                            <Link
                              to={`/checkout/${plan.id}`}
                              className={styles.upgradeButton}
                            >
                              {plan.price < (subscription?.plans?.price || 0)
                                ? '🔽 Fazer downgrade'
                                : '🔼 Fazer upgrade'}
                            </Link>
                          </div>
                        ))}
                    </div>
                    <p className={styles.upgradeInfo}>
                      💡 O upgrade/downgrade será aplicado na próxima cobrança. Você não paga duas vezes!
                    </p>
                  </div>
                )}

                {/* 📜 HISTÓRICO DE PAGAMENTOS */}
                {transactions.length > 0 && (
                  <div className={styles.historyCard}>
                    <h3 className={styles.historyTitle}>📜 Histórico de pagamentos</h3>
                    <div className={styles.transactionsList}>
                      {transactions.map((t) => (
                        <div key={t.id} className={styles.transactionItem}>
                          <div className={styles.transactionInfo}>
                            <span className={styles.transactionAmount}>
                              R$ {t.amount.toFixed(2)}
                            </span>
                            <span className={styles.transactionDate}>
                              {new Date(t.paid_at || t.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span className={t.status === 'paid' ? styles.transactionPaid : styles.transactionPending}>
                            {t.status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {transactions.length >= 10 && (
                      <button className={styles.viewAllButton}>
                        Ver todos os pagamentos →
                      </button>
                    )}
                    <Link to="/change-password">
                      Alterar senha
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noSubscription}>
                <span className={styles.emptyIcon}>🎬</span>
                <h3>Você ainda não tem uma assinatura ativa</h3>
                <p>Assine agora e tenha acesso a todos os filmes e séries!</p>
                <Link to="/plans" className={styles.subscribeButton}>
                  Ver planos
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;