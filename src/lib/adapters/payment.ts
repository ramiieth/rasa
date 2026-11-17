export interface PaymentGatewayAdapter {
  createPaymentToken(input: {
    orderId: string;
    amountRials: number;
    callbackUrl: string;
    customerMobile?: string;
    items?: Array<{ sku: string; title: string; qty: number; unitPriceRials: number }>;
  }): Promise<{ paymentToken: string; redirectUrl: string }>;

  verifyAndSettle(input: {
    paymentToken: string;
    orderId: string;
  }): Promise<{ verified: boolean; refId: string; settledAmountRials: number }>;

  partialRefundOrUpdate?(input: {
    paymentToken: string;
    newTotalAmountRials: number;
    refundedAmountRials: number;
  }): Promise<{ success: boolean }>;
}
