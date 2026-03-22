import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import styles from "../styles.module.css";

export function SubscriptionChart() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    // Buscar assinaturas dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data } = await supabase
      .from('subscriptions')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());

    // Agrupar por mês
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const counts: any = {};

    data?.forEach(sub => {
      const month = new Date(sub.created_at).getMonth();
      counts[month] = (counts[month] || 0) + 1;
    });

    const chartData = [];
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      chartData.push({
        month: months[monthIndex],
        count: counts[monthIndex] || 0
      });
    }

    setMonthlyData(chartData);
  }

  const maxCount = Math.max(...monthlyData.map(d => d.count), 1);

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>📈 Assinaturas por mês</h3>
      <div className={styles.chartContainer}>
        {monthlyData.map((data, i) => (
          <div key={i} className={styles.chartBar}>
            <div
              className={styles.bar}
              style={{
                height: `${(data.count / maxCount) * 100}%`,
                backgroundColor: `rgba(255, 94, 0, ${0.5 + (data.count / maxCount) * 0.5})`
              }}
            >
              <span className={styles.barValue}>{data.count}</span>
            </div>
            <span className={styles.barLabel}>{data.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}