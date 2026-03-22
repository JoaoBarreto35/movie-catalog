// src/Pages/Admin/Users/index.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./styles.module.css";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
  subscription?: {
    id: string;
    status: string;
    plan_name: string;
    current_period_end: string;
  };
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const usersWithSubs = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select(`
              id,
              status,
              current_period_end,
              plans (name)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          return {
            ...user,
            subscription: subData ? {
              id: subData.id,
              status: subData.status,
              plan_name: subData.plans?.[0]?.name || 'Plano',
              current_period_end: subData.current_period_end
            } : undefined
          };
        })
      );

      setUsers(usersWithSubs);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(userId: string, currentIsAdmin: boolean) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentIsAdmin })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u
      ));

      setMessage({
        type: 'success',
        text: `Usuário ${!currentIsAdmin ? 'agora é admin' : 'não é mais admin'}!`
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function giveLifetimeAccess(userId: string) {
    if (!confirm('🎁 Dar acesso vitalício a este usuário? Ele terá acesso até 2099 sem cobrança.')) return;

    try {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, name')
        .eq('active', true)
        .limit(1)
        .single();

      if (planError || !plan) {
        console.error('Erro ao buscar plano:', planError);
        throw new Error('Nenhum plano ativo encontrado. Crie um plano primeiro.');
      }

      console.log(`📝 Concedendo acesso vitalício com plano: ${plan.name} (${plan.id})`);

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          payment_method: 'admin_grant',
          perfectpay_transaction_id: 'LIFETIME_' + Date.now(),
          perfectpay_subscription_id: null,
          current_period_start: new Date().toISOString(),
          current_period_end: '2099-12-31 23:59:59'
        });

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Acesso vitalício concedido com sucesso!' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      console.error('Erro ao conceder acesso vitalício:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao conceder acesso' });
    }
  }

  async function cancelSubscription(_userId: string, subscriptionId: string) {
    if (!confirm('Cancelar a assinatura deste usuário?')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Assinatura cancelada!' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>👥 Gerenciar Usuários</h1>
          <p className={styles.subtitle}>Gerencie todos os usuários da plataforma</p>
        </div>
        <div className={styles.stats}>
          <span className={styles.statBadge}>Total: {users.length}</span>
          <span className={styles.statBadge}>Admins: {users.filter(u => u.is_admin).length}</span>
          <span className={styles.statBadge}>Com assinatura: {users.filter(u => u.subscription).length}</span>
        </div>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 Buscar por email ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Assinatura</th>
              <th>Status</th>
              <th>Admin</th>
              <th>Data de cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className={styles.userCell}>
                  <div className={styles.userAvatar}>
                    {user.full_name?.[0] || user.email[0]}
                  </div>
                  <div className={styles.userInfo}>
                    <strong>{user.full_name || '—'}</strong>
                    <small>{user.email}</small>
                  </div>
                </td>
                <td>
                  {user.subscription ? (
                    <div className={styles.subscriptionInfo}>
                      <span className={styles.planBadge}>{user.subscription.plan_name || 'Ativo'}</span>
                      <small>
                        Até {new Date(user.subscription.current_period_end).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                  ) : (
                    <span className={styles.noSubscription}>Sem assinatura</span>
                  )}
                </td>
                <td>
                  {user.subscription ? (
                    <span className={styles.statusActive}>🟢 Ativo</span>
                  ) : (
                    <span className={styles.statusInactive}>⚪ Inativo</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    className={`${styles.adminToggle} ${user.is_admin ? styles.isAdmin : ''}`}
                  >
                    {user.is_admin ? '👑 Admin' : '👤 Usuário'}
                  </button>
                </td>
                <td className={styles.dateCell}>
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className={styles.actions}>
                  {!user.subscription && (
                    <button
                      onClick={() => giveLifetimeAccess(user.id)}
                      className={styles.lifetimeButton}
                      title="Dar acesso vitalício"
                    >
                      🎁 Vitalício
                    </button>
                  )}
                  {user.subscription && (
                    <button
                      onClick={() => cancelSubscription(user.id, user.subscription!.id)}
                      className={styles.cancelButton}
                      title="Cancelar assinatura"
                    >
                      ❌ Cancelar
                    </button>
                  )}
                  <Link to={`/admin/users/${user.id}`} className={styles.viewButton}>
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className={styles.emptyState}>
          <span>👥</span>
          <h3>Nenhum usuário encontrado</h3>
          <p>Tente outro termo de busca</p>
        </div>
      )}
    </div>
  );
}