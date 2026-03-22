import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./styles.module.css";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  payment_method: string;
  perfectpay_subscription_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
  plan?: {
    name: string;
    price: number;
    interval: string;
  };
}

type StatusFilter = 'all' | 'active' | 'canceled' | 'expired' | 'pending';

export default function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      setLoading(true);

      // Buscar todas as assinaturas
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Buscar dados complementares
      const enriched = await Promise.all(
        (subs || []).map(async (sub) => {
          const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', sub.user_id)
            .single();

          const { data: plan } = await supabase
            .from('plans')
            .select('name, price, interval')
            .eq('id', sub.plan_id)
            .single();

          return {
            ...sub,
            user: user || { email: '—', full_name: '—' },
            plan: plan || { name: '—', price: 0, interval: 'month' }
          };
        })
      );

      setSubscriptions(enriched);
    } catch (error: any) {
      console.error('Erro ao carregar assinaturas:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function cancelSubscription(subscription: Subscription) {
    if (!confirm(`Cancelar assinatura de ${subscription.user?.email}?`)) return;

    try {
      // Se tiver código da Perfect Pay, chamar API
      if (subscription.perfectpay_subscription_id) {
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

        if (!response.ok) throw new Error('Erro ao cancelar na Perfect Pay');
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Assinatura cancelada!' });
      loadSubscriptions(); // Recarregar
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function reactivateSubscription(subscription: Subscription) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Assinatura reativada!' });
      loadSubscriptions(); // Recarregar
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function extendSubscription(subscription: Subscription, days: number) {
    try {
      const currentEnd = new Date(subscription.current_period_end);
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + days);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          current_period_end: newEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setMessage({ type: 'success', text: `✅ Assinatura estendida em ${days} dias!` });
      loadSubscriptions(); // Recarregar
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  const getStatusBadge = (status: string, periodEnd: string, cancelAtPeriodEnd: boolean) => {
    const isExpired = new Date(periodEnd) < new Date();

    if (cancelAtPeriodEnd && status === 'active') {
      return <span className={styles.statusCanceling}>🔻 Cancelamento pendente</span>;
    }
    if (status === 'canceled' || isExpired) {
      return <span className={styles.statusExpired}>🔴 Expirada/Cancelada</span>;
    }
    if (status === 'active') {
      return <span className={styles.statusActive}>🟢 Ativa</span>;
    }
    if (status === 'pending') {
      return <span className={styles.statusPending}>⏳ Pendente</span>;
    }
    return <span className={styles.statusUnknown}>⚪ {status}</span>;
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    // Filtro por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && sub.status !== 'active') return false;
      if (statusFilter === 'canceled' && sub.status !== 'canceled') return false;
      if (statusFilter === 'expired' && new Date(sub.current_period_end) >= new Date()) return false;
    }

    // Filtro por busca
    if (searchTerm) {
      const userEmail = sub.user?.email?.toLowerCase() || '';
      const userName = sub.user?.full_name?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      return userEmail.includes(term) || userName.includes(term);
    }

    return true;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active' && new Date(s.current_period_end) >= new Date()).length,
    canceled: subscriptions.filter(s => s.status === 'canceled').length,
    expired: subscriptions.filter(s => new Date(s.current_period_end) < new Date() && s.status === 'active').length
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando assinaturas...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🔑 Gerenciar Assinaturas</h1>
          <p className={styles.subtitle}>Gerencie todas as assinaturas da plataforma</p>
        </div>
        <div className={styles.stats}>
          <span className={styles.statBadge}>Total: {stats.total}</span>
          <span className={styles.statActive}>Ativas: {stats.active}</span>
          <span className={styles.statExpired}>Expiradas: {stats.expired}</span>
          <span className={styles.statCanceled}>Canceladas: {stats.canceled}</span>
        </div>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.statusFilters}>
          <button
            className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Todas
          </button>
          <button
            className={`${styles.filterBtn} ${statusFilter === 'active' ? styles.activeFilter : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            🟢 Ativas
          </button>
          <button
            className={`${styles.filterBtn} ${statusFilter === 'expired' ? styles.activeFilter : ''}`}
            onClick={() => setStatusFilter('expired')}
          >
            🔴 Expiradas
          </button>
          <button
            className={`${styles.filterBtn} ${statusFilter === 'canceled' ? styles.activeFilter : ''}`}
            onClick={() => setStatusFilter('canceled')}
          >
            ❌ Canceladas
          </button>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 Buscar por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Plano</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Período</th>
              <th>Próxima cobrança</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map((sub) => (
              <tr key={sub.id} className={new Date(sub.current_period_end) < new Date() ? styles.expiredRow : ''}>
                <td className={styles.userCell}>
                  <div className={styles.userAvatar}>
                    {sub.user?.full_name?.[0] || sub.user?.email?.[0] || 'U'}
                  </div>
                  <div className={styles.userInfo}>
                    <strong>{sub.user?.full_name || '—'}</strong>
                    <small>{sub.user?.email}</small>
                  </div>
                </td>
                <td className={styles.planCell}>
                  <span className={styles.planName}>{sub.plan?.name || '—'}</span>
                </td>
                <td className={styles.priceCell}>
                  R$ {sub.plan?.price?.toFixed(2) || '—'}
                  <small>/{sub.plan?.interval === 'month' ? 'mês' : 'ano'}</small>
                </td>
                <td>
                  {getStatusBadge(sub.status, sub.current_period_end, sub.cancel_at_period_end)}
                </td>
                <td className={styles.dateCell}>
                  <div>Início: {new Date(sub.current_period_start).toLocaleDateString('pt-BR')}</div>
                  <div>Fim: {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}</div>
                </td>
                <td className={styles.dateCell}>
                  {sub.cancel_at_period_end ? (
                    <span className={styles.noRenewal}>❌ Sem renovação</span>
                  ) : (
                    new Date(sub.current_period_end).toLocaleDateString('pt-BR')
                  )}
                </td>
                <td className={styles.actions}>
                  {sub.status === 'active' && !sub.cancel_at_period_end && (
                    <button
                      onClick={() => cancelSubscription(sub)}
                      className={styles.cancelButton}
                      title="Cancelar assinatura"
                    >
                      ❌ Cancelar
                    </button>
                  )}
                  {sub.cancel_at_period_end && (
                    <button
                      onClick={() => reactivateSubscription(sub)}
                      className={styles.reactivateButton}
                      title="Reativar assinatura"
                    >
                      🔄 Reativar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const days = prompt('Quantos dias deseja estender?', '30');
                      if (days) extendSubscription(sub, parseInt(days));
                    }}
                    className={styles.extendButton}
                    title="Estender período"
                  >
                    📅 + Dias
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className={styles.emptyState}>
          <span>🔑</span>
          <h3>Nenhuma assinatura encontrada</h3>
          <p>Tente outro filtro ou busca</p>
        </div>
      )}
    </div>
  );
}