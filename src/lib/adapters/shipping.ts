export interface ShippingCarrierAdapter {
  quoteRate(input: {
    originCityCode: string;
    destCityCode: string;
    totalWeightGrams: number;
    parcelValueRials: number;
    serviceType: "PISHTAZ" | "SEFARESHI" | "TIPAX" | "COURIER";
  }): Promise<{ shippingCostRials: number; insuranceCostRials: number; estDays: number }>;

  issueWaybill(input: {
    orderId: string;
    receiverName: string;
    receiverMobile: string;
    receiverPostalCode: string;
    receiverAddress: string;
    weightGrams: number;
    codAmountRials?: number;
  }): Promise<{ trackingBarcode: string; labelPdfUrl?: string }>;
}
