import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./styles.module.css";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  popular: boolean;
  active: boolean;
  perfectpay_product_id: string;
  checkout_link: string;
  created_at: string;
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function togglePlanStatus(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.map(p =>
        p.id === id ? { ...p, active: !currentActive } : p
      ));

      setMessage({ type: 'success', text: `Plano ${!currentActive ? 'ativado' : 'desativado'} com sucesso!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function togglePopular(id: string, currentPopular: boolean) {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ popular: !currentPopular })
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.map(p =>
        p.id === id ? { ...p, popular: !currentPopular } : p
      ));

      setMessage({ type: 'success', text: `Plano ${!currentPopular ? 'destacado' : 'não destacado'}!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.filter(p => p.id !== id));
      setMessage({ type: 'success', text: 'Plano excluído com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📋 Gerenciar Planos</h1>
          <p className={styles.subtitle}>Crie, edite e gerencie os planos de assinatura</p>
        </div>
        <Link to="/admin/plans/new" className={styles.createButton}>
          + Novo plano
        </Link>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
              <th>Intervalo</th>
              <th>Features</th>
              <th>Status</th>
              <th>Popular</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className={!plan.active ? styles.inactiveRow : ''}>
                <td className={styles.planName}>
                  <strong>{plan.name}</strong>
                  {plan.popular && <span className={styles.popularBadge}>🔥 Popular</span>}
                </td>
                <td className={styles.price}>R$ {plan.price.toFixed(2)}</td>
                <td className={styles.interval}>
                  {plan.interval === 'month' ? 'Mensal' : 'Anual'}
                </td>
                <td className={styles.features}>
                  <span className={styles.featureCount}>
                    {plan.features?.length || 0} vantagens
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => togglePlanStatus(plan.id, plan.active)}
                    className={`${styles.statusBadge} ${plan.active ? styles.active : styles.inactive}`}
                  >
                    {plan.active ? '🟢 Ativo' : '🔴 Inativo'}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => togglePopular(plan.id, plan.popular)}
                    className={`${styles.popularToggle} ${plan.popular ? styles.isPopular : ''}`}
                  >
                    {plan.popular ? '⭐ Destacado' : '☆ Destacar'}
                  </button>
                </td>
                <td className={styles.actions}>
                  <Link to={`/admin/plans/edit/${plan.id}`} className={styles.editButton}>
                    Editar
                  </Link>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className={styles.deleteButton}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plans.length === 0 && (
        <div className={styles.emptyState}>
          <span>📋</span>
          <h3>Nenhum plano cadastrado</h3>
          <p>Clique em "Novo plano" para começar</p>
        </div>
      )}
    </div>
  );
}