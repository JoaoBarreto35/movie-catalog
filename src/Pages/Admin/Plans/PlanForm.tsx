import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./styles.module.css";

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular: boolean;
  active: boolean;
  perfectpay_product_id: string;
  checkout_link: string;
}

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 19.90,
    interval: 'month',
    features: [],
    popular: false,
    active: true,
    perfectpay_product_id: '',
    checkout_link: ''
  });

  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  async function loadPlan() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        description: data.description,
        price: data.price,
        interval: data.interval,
        features: data.features || [],
        popular: data.popular,
        active: data.active,
        perfectpay_product_id: data.perfectpay_product_id || '',
        checkout_link: data.checkout_link || ''
      });

      setFeaturesInput((data.features || []).join('\n'));
    } catch (error: any) {
      console.error('Erro ao carregar plano:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const features = featuresInput.split('\n').filter(f => f.trim() !== '');

    const planData = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      interval: formData.interval,
      features,
      popular: formData.popular,
      active: formData.active,
      perfectpay_product_id: formData.perfectpay_product_id,
      checkout_link: formData.checkout_link
    };

    console.log('📝 Tentando salvar:', planData); // 👈 ADICIONE ISSO

    try {
      let error;
      if (id) {
        console.log('✏️ Atualizando plano:', id);
        const { error: updateError } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', id);
        error = updateError;
      } else {
        console.log('➕ Criando novo plano');
        const { error: insertError } = await supabase
          .from('plans')
          .insert([planData]);
        error = insertError;
      }

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Salvo com sucesso!');
      setMessage({ type: 'success', text: id ? 'Plano atualizado!' : 'Plano criado!' });
      setTimeout(() => navigate('/admin/plans'), 1500);
    } catch (error: any) {
      console.error('❌ Erro:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h1 className={styles.title}>{id ? '✏️ Editar Plano' : '➕ Criar Novo Plano'}</h1>
        <button onClick={() => navigate('/admin/plans')} className={styles.backButton}>
          ← Voltar
        </button>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Nome do plano *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={styles.input}
              required
              placeholder="Ex: Plano Mensal"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>Preço (R$) *</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="interval" className={styles.label}>Intervalo *</label>
            <select
              id="interval"
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: e.target.value as 'month' | 'year' })}
              className={styles.select}
            >
              <option value="month">Mensal</option>
              <option value="year">Anual</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Descrição</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={styles.textarea}
              rows={2}
              placeholder="Breve descrição do plano"
            />
          </div>

          <div className={styles.formGroupFull}>
            <label htmlFor="features" className={styles.label}>
              Vantagens (uma por linha) *
            </label>
            <textarea
              id="features"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              className={styles.textarea}
              rows={5}
              placeholder="HD disponível&#10;Assista em 2 dispositivos&#10;Sem anúncios"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="perfectpay_product_id" className={styles.label}>
              ID do produto (Perfect Pay)
            </label>
            <input
              id="perfectpay_product_id"
              type="text"
              value={formData.perfectpay_product_id}
              onChange={(e) => setFormData({ ...formData, perfectpay_product_id: e.target.value })}
              className={styles.input}
              placeholder="PPPBEDKG"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="checkout_link" className={styles.label}>
              Link de checkout
            </label>
            <input
              id="checkout_link"
              type="url"
              value={formData.checkout_link}
              onChange={(e) => setFormData({ ...formData, checkout_link: e.target.value })}
              className={styles.input}
              placeholder="https://go.perfectpay.com.br/..."
            />
          </div>

          <div className={styles.formGroupCheckbox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
              />
              <span>Destacar como plano popular</span>
            </label>
          </div>

          <div className={styles.formGroupCheckbox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Plano ativo (visível para usuários)</span>
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Salvando...' : id ? 'Atualizar plano' : 'Criar plano'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/plans')}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}