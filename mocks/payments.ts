export interface MockPayment {
  id: string;
  bookingId: string;
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  currency: 'THB';
  method: 'promptpay';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'restitution_pending' | 'restituted' | 'restitution_failed' | 'cancelled';
  description: string;
  transactionId?: string;
  promptPayQR?: string;
  promptPayRef?: string;
  commission: number;
  commissionRate: number;
  netAmount: number;
  fees: {
    platform: number;
    payment: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  restitutedAt?: string;
  restitutionReason?: string;
  receipt?: {
    url: string;
    number: string;
  };
}

export const mockPayments: MockPayment[] = [
  {
    id: 'pay_001',
    bookingId: 'booking_001',
    payerId: 'customer_001',
    payerName: 'John Smith',
    payeeId: '1',
    payeeName: 'Nisa Thanakit',
    amount: 2500,
    currency: 'THB',
    method: 'promptpay',
    status: 'completed',
    description: 'Bangkok City Tour - Jan 15, 2024',
    transactionId: 'txn_promptpay_001',
    promptPayQR: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    promptPayRef: 'PP240110001',
    commission: 375,
    commissionRate: 0.15,
    netAmount: 2125,
    fees: {
      platform: 375,
      payment: 25,
      total: 400,
    },
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-10T10:45:00Z',
    completedAt: '2024-01-10T10:45:00Z',
    receipt: {
      url: '/receipts/pay_001.pdf',
      number: 'RCP-2024-001',
    },
  },
  {
    id: 'pay_002',
    bookingId: 'booking_002',
    payerId: 'customer_001',
    payerName: 'John Smith',
    payeeId: '2',
    payeeName: 'Somchai Kittisak',
    amount: 3000,
    currency: 'THB',
    method: 'promptpay',
    status: 'pending',
    description: 'Phuket Beach & Diving - Jan 20, 2024',
    commission: 450,
    commissionRate: 0.15,
    netAmount: 2550,
    fees: {
      platform: 450,
      payment: 0,
      total: 450,
    },
    createdAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-12T14:20:00Z',
  },
  {
    id: 'pay_003',
    bookingId: 'booking_003',
    payerId: 'customer_001',
    payerName: 'John Smith',
    payeeId: '4',
    payeeName: 'Apinya Charoensuk',
    amount: 2800,
    currency: 'THB',
    method: 'promptpay',
    status: 'completed',
    description: 'Shopping & Food Tour - Jan 5, 2024',
    transactionId: 'txn_promptpay_002',
    promptPayQR: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    promptPayRef: 'PP240101001',
    commission: 420,
    commissionRate: 0.15,
    netAmount: 2380,
    fees: {
      platform: 420,
      payment: 28,
      total: 448,
    },
    createdAt: '2024-01-01T09:15:00Z',
    updatedAt: '2024-01-01T09:30:00Z',
    completedAt: '2024-01-01T09:30:00Z',
    receipt: {
      url: '/receipts/pay_003.pdf',
      number: 'RCP-2024-003',
    },
  },
  {
    id: 'pay_004',
    bookingId: 'booking_006',
    payerId: 'customer_003',
    payerName: 'Mike Chen',
    payeeId: '1',
    payeeName: 'Nisa Thanakit',
    amount: 2500,
    currency: 'THB',
    method: 'promptpay',
    status: 'restituted',
    description: 'Chao Phraya Evening Food Route - Jan 22, 2024 (Cancelled)',
    transactionId: 'txn_promptpay_003',
    promptPayQR: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    promptPayRef: 'PP240114001',
    commission: 0,
    commissionRate: 0.15,
    netAmount: 0,
    fees: {
      platform: 0,
      payment: 0,
      total: 0,
    },
    createdAt: '2024-01-14T20:30:00Z',
    updatedAt: '2024-01-16T10:15:00Z',
    restitutedAt: '2024-01-16T10:15:00Z',
    restitutionReason: 'External resolution transfer recorded with operator evidence',
    receipt: {
      url: '/receipts/pay_004_restitution.pdf',
      number: 'RST-2024-001',
    },
  },
];

export const generatePromptPayQR = (amount: number, ref: string) => {
  // Mock QR code generation - in real app, this would generate actual PromptPay QR
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
};

export const generatePaymentReference = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PP${dateStr}${random}`;
};

export const calculateCommission = (amount: number, rate: number = 0.15) => {
  return Math.round(amount * rate);
};

export const calculatePaymentFees = (amount: number, _method: MockPayment['method']) => {
  const platformFee = calculateCommission(amount);
  const paymentFee = Math.round(amount * 0.01); // Mock PromptPay fee.

  return {
    platform: platformFee,
    payment: paymentFee,
    total: platformFee + paymentFee,
  };
};

export const getPaymentsByUser = (userId: string, role: 'payer' | 'payee' = 'payer') => {
  const field = role === 'payer' ? 'payerId' : 'payeeId';
  return mockPayments
    .filter(payment => payment[field] === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPaymentsByStatus = (status: MockPayment['status']) => {
  return mockPayments.filter(payment => payment.status === status);
};

export const getPaymentStats = (userId: string, role: 'payer' | 'payee' = 'payee') => {
  const userPayments = getPaymentsByUser(userId, role);
  const completedPayments = userPayments.filter(p => p.status === 'completed');

  return {
    totalTransactions: userPayments.length,
    completedTransactions: completedPayments.length,
    totalAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0),
    totalCommission: completedPayments.reduce((sum, p) => sum + p.commission, 0),
    netEarnings: completedPayments.reduce((sum, p) => sum + p.netAmount, 0),
    pendingAmount: userPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    restitutedAmount: userPayments
      .filter(p => p.status === 'restituted')
      .reduce((sum, p) => sum + p.amount, 0),
  };
};

export const processPayment = (payment: Omit<MockPayment, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newPayment: MockPayment = {
    ...payment,
    id: `pay_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Generate PromptPay QR if needed
  if (payment.method === 'promptpay') {
    newPayment.promptPayRef = generatePaymentReference();
    newPayment.promptPayQR = generatePromptPayQR(payment.amount, newPayment.promptPayRef);
  }

  mockPayments.unshift(newPayment);
  return newPayment;
};

export const updatePaymentStatus = (paymentId: string, status: MockPayment['status'], data?: Partial<MockPayment>) => {
  const payment = mockPayments.find(p => p.id === paymentId);
  if (payment) {
    payment.status = status;
    payment.updatedAt = new Date().toISOString();

    if (status === 'completed') {
      payment.completedAt = new Date().toISOString();
    } else if (status === 'restituted') {
      payment.restitutedAt = new Date().toISOString();
    }

    if (data) {
      Object.assign(payment, data);
    }

    return payment;
  }
  return null;
};
