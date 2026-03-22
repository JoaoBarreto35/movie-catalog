import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./styles.module.css";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  perfectpay_transaction_id: string;
  paid_at: string;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed' | 'refunded';
type PaymentMethodFilter = 'all' | 'pix' | 'credit_card' | 'boleto';

export default function TransactionsManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethodFilter>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);

      // Buscar todas as transações
      const { data: txns, error } = await supabase
        .from('transactions')
        .select('*')
        .order('paid_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários
      const enriched = await Promise.all(
        (txns || []).map(async (t) => {
          const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', t.user_id)
            .single();

          return {
            ...t,
            user: user || { email: '—', full_name: '—' }
          };
        })
      );

      setTransactions(enriched);

      // Calcular total
      const total = enriched
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
      setTotalAmount(total);

    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className={styles.statusPaid}>✅ Pago</span>;
      case 'pending':
        return <span className={styles.statusPending}>⏳ Pendente</span>;
      case 'failed':
        return <span className={styles.statusFailed}>❌ Falhou</span>;
      case 'refunded':
        return <span className={styles.statusRefunded}>↩️ Reembolsado</span>;
      default:
        return <span className={styles.statusUnknown}>⚪ {status}</span>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'credit_card':
        return 'Cartão';
      case 'boleto':
        return 'Boleto';
      default:
        return method;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    // Filtro por status
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // Filtro por método de pagamento
    if (paymentFilter !== 'all' && t.payment_method !== paymentFilter) return false;

    // Filtro por busca
    if (searchTerm) {
      const userEmail = t.user?.email?.toLowerCase() || '';
      const userName = t.user?.full_name?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      const transactionId = t.perfectpay_transaction_id?.toLowerCase() || '';
      return userEmail.includes(term) || userName.includes(term) || transactionId.includes(term);
    }

    // Filtro por data
    if (dateRange.start) {
      const tDate = new Date(t.paid_at || t.created_at);
      const startDate = new Date(dateRange.start);
      if (tDate < startDate) return false;
    }
    if (dateRange.end) {
      const tDate = new Date(t.paid_at || t.created_at);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      if (tDate > endDate) return false;
    }

    return true;
  });

  const filteredTotal = filteredTransactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = {
    total: transactions.length,
    paid: transactions.filter(t => t.status === 'paid').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalAmount: totalAmount
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Usuário', 'Email', 'Valor', 'Status', 'Método', 'Data', 'Transação ID'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.user?.full_name || '—',
      t.user?.email || '—',
      t.amount.toFixed(2),
      t.status,
      getPaymentMethodLabel(t.payment_method),
      new Date(t.paid_at || t.created_at).toLocaleString('pt-BR'),
      t.perfectpay_transaction_id
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando transações...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>💳 Gerenciar Transações</h1>
          <p className={styles.subtitle}>Histórico completo de pagamentos</p>
        </div>
        <div className={styles.stats}>
          <span className={styles.statBadge}>Total: {stats.total}</span>
          <span className={styles.statPaid}>Pagos: {stats.paid}</span>
          <span className={styles.statPending}>Pendentes: {stats.pending}</span>
          <span className={styles.statAmount}>💰 R$ {stats.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={styles.select}
          >
            <option value="all">Todas</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="failed">Falhas</option>
            <option value="refunded">Reembolsados</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Método:</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentMethodFilter)}
            className={styles.select}
          >
            <option value="all">Todos</option>
            <option value="pix">PIX</option>
            <option value="credit_card">Cartão</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Data início:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Data fim:</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Buscar:</label>
          <input
            type="text"
            placeholder="Usuário ou transação ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <button onClick={exportToCSV} className={styles.exportButton}>
          📥 Exportar CSV
        </button>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total filtrado:</span>
          <span className={styles.summaryValue}>{filteredTransactions.length} transações</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Valor total:</span>
          <span className={styles.summaryAmount}>R$ {filteredTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Valor</th>
              <th>Método</th>
              <th>Status</th>
              <th>Transação ID</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id}>
                <td className={styles.dateCell}>
                  {new Date(t.paid_at || t.created_at).toLocaleString('pt-BR')}
                </td>
                <td className={styles.userCell}>
                  <div className={styles.userInfo}>
                    <strong>{t.user?.full_name || '—'}</strong>
                    <small>{t.user?.email}</small>
                  </div>
                </td>
                <td className={styles.amountCell}>
                  R$ {t.amount.toFixed(2)}
                </td>
                <td className={styles.methodCell}>
                  {getPaymentMethodLabel(t.payment_method)}
                </td>
                <td>{getStatusBadge(t.status)}</td>
                <td className={styles.transactionIdCell}>
                  <code>{t.perfectpay_transaction_id || '—'}</code>
                </td>
                <td className={styles.actions}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(t.perfectpay_transaction_id || '');
                      setMessage({ type: 'success', text: 'ID copiado!' });
                      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                    }}
                    className={styles.copyButton}
                    title="Copiar ID"
                  >
                    📋
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className={styles.emptyState}>
          <span>💳</span>
          <h3>Nenhuma transação encontrada</h3>
          <p>Tente outros filtros ou busca</p>
        </div>
      )}
    </div>
  );
}