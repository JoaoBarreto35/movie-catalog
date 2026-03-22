import styles from "../styles.module.css";

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
    pendingTransactions: number;
    totalPlans: number;
    growth: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: "Usuários", value: stats.totalUsers, icon: "👥", color: "#4ecdc4", suffix: "" },
    { title: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: "🟢", color: "#00c851", suffix: "" },
    { title: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: "💰", color: "#ff5e00", suffix: "" },
    { title: "Pendentes", value: stats.pendingTransactions, icon: "⏳", color: "#ff8800", suffix: "" },
    { title: "Planos Ativos", value: stats.totalPlans, icon: "📋", color: "#aa66cc", suffix: "" },
    { title: "Crescimento", value: `+${stats.growth}%`, icon: "📈", color: "#00c851", suffix: "" }
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map((card, index) => (
        <div key={index} className={styles.statCard} style={{ borderTopColor: card.color }}>
          <div className={styles.statIcon}>{card.icon}</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{card.value}</span>
            <span className={styles.statTitle}>{card.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}