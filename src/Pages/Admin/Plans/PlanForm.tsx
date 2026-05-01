import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./styles.module.css";

type PlanInterval = "month" | "year";

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  interval: PlanInterval;
  duration_months: number;
  features: string[];
  popular: boolean;
  active: boolean;
  perfectpay_product_id: string;
  perfectpay_plan_id: string;
  checkout_link: string;
}

function inferIntervalByDuration(durationMonths: number): PlanInterval {
  return durationMonths >= 12 ? "year" : "month";
}

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(Boolean(id));
  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: "",
    text: "",
  });

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    price: 19.9,
    interval: "month",
    duration_months: 1,
    features: [],
    popular: false,
    active: true,
    perfectpay_product_id: "",
    perfectpay_plan_id: "",
    checkout_link: "",
  });

  const [featuresInput, setFeaturesInput] = useState("");

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  async function loadPlan() {
    try {
      setLoadingPlan(true);

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const durationMonths = Number(data.duration_months || 1);

      setFormData({
        name: data.name || "",
        description: data.description || "",
        price: Number(data.price || 0),
        interval: data.interval || inferIntervalByDuration(durationMonths),
        duration_months: durationMonths,
        features: data.features || [],
        popular: Boolean(data.popular),
        active: Boolean(data.active),
        perfectpay_product_id: data.perfectpay_product_id || "",
        perfectpay_plan_id: data.perfectpay_plan_id || "",
        checkout_link: data.checkout_link || "",
      });

      setFeaturesInput((data.features || []).join("\n"));
    } catch (error: any) {
      console.error("Erro ao carregar plano:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoadingPlan(false);
    }
  }

  function handleDurationChange(value: string) {
    const duration = Number(value);

    setFormData((current) => ({
      ...current,
      duration_months: duration,
      interval: inferIntervalByDuration(duration),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage({ type: "", text: "" });

    const features = featuresInput
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Informe o nome do plano." });
      setLoading(false);
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setMessage({ type: "error", text: "Informe um preço válido." });
      setLoading(false);
      return;
    }

    if (!formData.duration_months || formData.duration_months <= 0) {
      setMessage({ type: "error", text: "Informe uma duração válida." });
      setLoading(false);
      return;
    }

    if (!formData.perfectpay_product_id.trim()) {
      setMessage({
        type: "error",
        text: "Informe o código do produto da Perfect Pay.",
      });
      setLoading(false);
      return;
    }

    if (!formData.perfectpay_plan_id.trim()) {
      setMessage({
        type: "error",
        text: "Informe o código do plano da Perfect Pay.",
      });
      setLoading(false);
      return;
    }

    const planData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      interval: formData.interval,
      duration_months: Number(formData.duration_months),
      features,
      popular: formData.popular,
      active: formData.active,
      perfectpay_product_id: formData.perfectpay_product_id.trim(),
      perfectpay_plan_id: formData.perfectpay_plan_id.trim(),
      checkout_link: formData.checkout_link.trim(),
    };

    try {
      if (id) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("plans").insert([planData]);

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: id ? "Plano atualizado!" : "Plano criado!",
      });

      setTimeout(() => navigate("/admin/plans"), 1200);
    } catch (error: any) {
      console.error("Erro ao salvar plano:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  if (loadingPlan) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando plano...</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <div>
          <h1 className={styles.title}>
            {id ? "✏️ Editar Plano" : "➕ Criar Novo Plano"}
          </h1>
          <p className={styles.subtitle}>
            Configure o plano, duração e vínculo com a Perfect Pay
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/plans")}
          className={styles.backButton}
        >
          ← Voltar
        </button>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.sectionTitle}>Dados principais</div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Nome do plano *
            </label>

            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles.input}
              required
              placeholder="Ex: Plano Mensal"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Preço (R$) *
            </label>

            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: Number(e.target.value),
                })
              }
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration_months" className={styles.label}>
              Duração do acesso *
            </label>

            <select
              id="duration_months"
              value={formData.duration_months}
              onChange={(e) => handleDurationChange(e.target.value)}
              className={styles.select}
            >
              <option value={1}>1 mês — Mensal</option>
              <option value={3}>3 meses — Trimestral</option>
              <option value={6}>6 meses — Semestral</option>
              <option value={12}>12 meses — Anual</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="interval" className={styles.label}>
              Intervalo interno
            </label>

            <input
              id="interval"
              type="text"
              value={formData.interval === "month" ? "month" : "year"}
              className={styles.input}
              disabled
            />

            <small className={styles.helpText}>
              Preenchido automaticamente pela duração.
            </small>
          </div>

          <div className={styles.formGroupFull}>
            <label htmlFor="description" className={styles.label}>
              Descrição
            </label>

            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.textarea}
              rows={2}
              placeholder="Breve descrição do plano"
            />
          </div>

          <div className={styles.formGroupFull}>
            <label htmlFor="features" className={styles.label}>
              Vantagens — uma por linha
            </label>

            <textarea
              id="features"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              className={styles.textarea}
              rows={5}
              placeholder={"HD disponível\nAssista em 2 dispositivos\nSem anúncios"}
            />
          </div>
        </div>

        <div className={styles.sectionTitle}>Perfect Pay</div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="perfectpay_product_id" className={styles.label}>
              Código do produto *
            </label>

            <input
              id="perfectpay_product_id"
              type="text"
              value={formData.perfectpay_product_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  perfectpay_product_id: e.target.value,
                })
              }
              className={styles.input}
              placeholder="Ex: PPPBEJLD"
              required
            />

            <small className={styles.helpText}>
              Vem do <strong>product.code</strong> no webhook.
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="perfectpay_plan_id" className={styles.label}>
              Código do plano *
            </label>

            <input
              id="perfectpay_plan_id"
              type="text"
              value={formData.perfectpay_plan_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  perfectpay_plan_id: e.target.value,
                })
              }
              className={styles.input}
              placeholder="Ex: PPLQQP7H8"
              required
            />

            <small className={styles.helpText}>
              Vem do <strong>plan.code</strong> no webhook. É esse campo que
              diferencia mensal/trimestral.
            </small>
          </div>

          <div className={styles.formGroupFull}>
            <label htmlFor="checkout_link" className={styles.label}>
              Link de checkout
            </label>

            <input
              id="checkout_link"
              type="url"
              value={formData.checkout_link}
              onChange={(e) =>
                setFormData({ ...formData, checkout_link: e.target.value })
              }
              className={styles.input}
              placeholder="https://go.perfectpay.com.br/..."
            />
          </div>
        </div>

        <div className={styles.sectionTitle}>Visibilidade</div>

        <div className={styles.formGrid}>
          <div className={styles.formGroupCheckbox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) =>
                  setFormData({ ...formData, popular: e.target.checked })
                }
              />

              <span>Destacar como plano popular</span>
            </label>
          </div>

          <div className={styles.formGroupCheckbox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />

              <span>Plano ativo e visível para usuários</span>
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Salvando..." : id ? "Atualizar plano" : "Criar plano"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/plans")}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}