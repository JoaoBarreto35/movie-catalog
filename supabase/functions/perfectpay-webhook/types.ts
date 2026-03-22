export interface PerfectPayWebhook {
  token: string;
  code: string;
  sale_amount: number;
  sale_status_enum: number;
  sale_status_enum_key: 'pending' | 'approved' | 'canceled' | 'refunded';
  sale_status_detail: string;
  date_created: string;
  date_approved: string | null;
  
  product: {
    code: string;
    name: string;
    external_reference: string | null;
  };
  
  plan: {
    code: string;
    name: string;
    quantity: number;
  };
  
  customer: {
    email: string;
    full_name: string;
    identification_number: string;
    phone_number: string;
  };
  
  subscription?: {
    code: string;
    charges_made: number;
    next_charge_date: string;
    status: 'active' | 'canceled' | 'suspended';
    status_event?: 'subscription_started' | 'subscription_renewed' | 'subscription_canceled';
  };
  
  payment_type_enum_key: 'pix' | 'credit_card' | 'boleto';
}

export interface ProcessedPayment {
  transactionId: string;
  status: string;
  email: string;
  productId: string;
  amount: number;
  paymentMethod: string;
  customerName: string;
  subscriptionCode?: string;
  nextChargeDate?: string;
}

export interface UserData {
  id: string;
  email: string;
  full_name?: string;
}

export interface SubscriptionData {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
}