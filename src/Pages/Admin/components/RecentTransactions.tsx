// src/Pages/Admin/components/RecentTransactions.tsx
import { Link } from "react-router-dom";
import styles from "../styles.module.css";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  paid_at: string;
  created_at: string;
  users?: {
    email: string;
    full_name: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className={styles.statusPaid}>✅ Pago</span>;
    if (status === 'pending') return <span className={styles.statusPending}>⏳ Pendente</span>;
    return <span className={styles.statusFailed}>❌ Falhou</span>;
  };

  if (transactions.length === 0) {
    return (
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>📋 Últimas transações</h2>
          <Link to="/admin/transactions" className={styles.seeAllLink}>
            Ver todas →
          </Link>
        </div>
        <div className={styles.emptyState}>
          <span>💰</span>
          <p>Nenhuma transação ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.recentSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>📋 Últimas transações</h2>
        <Link to="/admin/transactions" className={styles.seeAllLink}>
          Ver todas →
        </Link>
      </div>

      <div className={styles.transactionsTable}>
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className={styles.userInfo}>
                    <strong>{t.users?.full_name || '—'}</strong>
                    <small>{t.users?.email}</small>
                  </div>
                </td>
                <td className={styles.amount}>R$ {t.amount.toFixed(2)}</td>
                <td>{getStatusBadge(t.status)}</td>
                <td className={styles.date}>
                  {new Date(t.paid_at || t.created_at || Date.now()).toLocaleDateString('pt-BR')}
                </td>
                <td>
                  <Link to={`/admin/transactions/${t.id}`} className={styles.viewButton}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}