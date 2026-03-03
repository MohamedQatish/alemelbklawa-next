// lib/payment.ts

export interface PaymentGatewayConfig {
  gateway: 'tap' | 'myfatoorah' | 'paytabs';
  enabled: boolean;
  tapPublicKey?: string;
  tapSecretKey?: string;
  myfatoorahApiKey?: string;
  paytabsMerchantEmail?: string;
  paytabsSecretKey?: string;
}

export interface CreatePaymentParams {
  orderId: number;
  amount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
  gatewayResponse?: any;
}

// دالة لجلب إعدادات الدفع من قاعدة البيانات
export async function getPaymentConfig(): Promise<PaymentGatewayConfig> {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    const settings = await res.json();
    
    return {
      gateway: settings.payment_gateway || 'tap',
      enabled: settings.payment_enabled === 'true',
      tapPublicKey: settings.tap_public_key,
      tapSecretKey: settings.tap_secret_key,
      myfatoorahApiKey: settings.myfatoorah_api_key,
      paytabsMerchantEmail: settings.paytabs_merchant_email,
      paytabsSecretKey: settings.paytabs_secret_key,
    };
  } catch (error) {
    console.error('Failed to get payment config:', error);
    return {
      gateway: 'tap',
      enabled: false,
    };
  }
}

// دالة إنشاء الدفع حسب البوابة المختارة
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const config = await getPaymentConfig();
  
  if (!config.enabled) {
    return {
      success: false,
      error: 'الدفع الإلكتروني معطل حالياً',
    };
  }

  // حسب البوابة المختارة
  switch (config.gateway) {
    case 'tap':
      return createTapPayment(params, config);
    case 'myfatoorah':
      return createMyFatoorahPayment(params, config);
    case 'paytabs':
      return createPayTabsPayment(params, config);
    default:
      return {
        success: false,
        error: 'بوابة دفع غير مدعومة',
      };
  }
}

// دالة الدفع عبر Tap
async function createTapPayment(params: CreatePaymentParams, config: PaymentGatewayConfig): Promise<PaymentResult> {
  // هذا الكود مؤقت لحين توفير صاحب الموقع للمفاتيح
  console.log('Creating Tap payment for order:', params.orderId);
  
  return {
    success: true,
    transactionId: `TAP-${Date.now()}`,
    paymentUrl: `/payment/mock?order=${params.orderId}`,
  };
}

// دالة الدفع عبر MyFatoorah
async function createMyFatoorahPayment(params: CreatePaymentParams, config: PaymentGatewayConfig): Promise<PaymentResult> {
  console.log('Creating MyFatoorah payment for order:', params.orderId);
  
  return {
    success: true,
    transactionId: `MF-${Date.now()}`,
    paymentUrl: `/payment/mock?order=${params.orderId}`,
  };
}

// دالة الدفع عبر PayTabs
async function createPayTabsPayment(params: CreatePaymentParams, config: PaymentGatewayConfig): Promise<PaymentResult> {
  console.log('Creating PayTabs payment for order:', params.orderId);
  
  return {
    success: true,
    transactionId: `PT-${Date.now()}`,
    paymentUrl: `/payment/mock?order=${params.orderId}`,
  };
}