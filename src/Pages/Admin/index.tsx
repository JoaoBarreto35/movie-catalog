import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { StatsCards } from "./components/StatsCards";
import { RecentTransactions } from "./components/RecentTransactions";
import { SubscriptionChart } from "./components/SubscriptionChart";
import styles from "./styles.module.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    totalPlans: 0,
    growth: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // 1. Total de usuários
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 2. Assinaturas ativas
      const { count: activeCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString());

      // 3. Receita total (transações pagas)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'paid');

      const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // 4. Transações pendentes
      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      // 5. Total de planos
      const { count: totalPlans } = await supabase
        .from('plans')
        .select('*', { count: 'exact' })
        .eq('active', true);

      // 6. Últimas 5 transações
      const { data: recent } = await supabase
        .from('transactions')
        .select('*, users(email, full_name)')
        .order('paid_at', { ascending: false })
        .limit(5);

      setRecentTransactions(recent || []);

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeCount || 0,
        totalRevenue: totalRevenue,
        pendingTransactions: pendingCount || 0,
        totalPlans: totalPlans || 0,
        growth: 12 // calculo de crescimento (simplificado)
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    { name: "Planos", path: "/admin/plans", icon: "📋", color: "#ff5e00" },
    { name: "Usuários", path: "/admin/users", icon: "👥", color: "#4ecdc4" },
    { name: "Assinaturas", path: "/admin/subscriptions", icon: "🔑", color: "#00c851" },
    { name: "Transações", path: "/admin/transactions", icon: "💳", color: "#ff8800" },
    { name: "Logs", path: "/admin/logs", icon: "📜", color: "#aa66cc" }
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎬 BarretoFlix Admin</h1>
        <p className={styles.subtitle}>Gerencie todo o seu sistema de assinaturas</p>
      </div>

      <StatsCards stats={stats} />

      <div className={styles.chartSection}>
        <SubscriptionChart />
        <div className={styles.quickActions}>
          <h3>⚡ Ações rápidas</h3>
          <div className={styles.quickActionsGrid}>
            {menuItems.map(item => (
              <Link to={item.path} key={item.name} className={styles.quickActionCard}>
                <span className={styles.quickIcon}>{item.icon}</span>
                <span className={styles.quickName}>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <RecentTransactions transactions={recentTransactions} />

      <div className={styles.footer}>
        <p>Última atualização: {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}