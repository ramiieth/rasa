export type ShippingCarrierCode =
  | "PISHTAZ"
  | "SEFARESHI"
  | "TIPAX"
  | "CHAPAR"
  | "COURIER"
  | "COD";

export interface ShippingMethodConfig {
  code: ShippingCarrierCode;
  title: string;
  subtitle: string;
  estDays: string;
  baseRials: number;
  perKgRials: number;
  extraItemStepQty: number;
  extraItemSurchargeRials: number;
  isPostPaid?: boolean;
}

export const SHIPPING_METHODS: ShippingMethodConfig[] = [
  {
    code: "PISHTAZ",
    title: "پست پیشتاز (پیشخوان ملی پست)",
    subtitle: "صدور آنی بارکد ۲۰ رقمی + بیمه مرسوله",
    estDays: "۲ تا ۳ روز کاری",
    baseRials: 490000, // ۴۹ هزار تومان پایه
    perKgRials: 180000, // ۱۸ هزار تومان به ازای هر کیلوگرم اضافه
    extraItemStepQty: 4, // اگر ۴ کالا یا بیشتر در بسته باشد، جهش حجمی اعمال می‌شود
    extraItemSurchargeRials: 290000,
  },
  {
    code: "SEFARESHI",
    title: "پست سفارشی (اقتصادی)",
    subtitle: "مناسب مرسولات غیرفوری با کمترین تعرفه پستی",
    estDays: "۴ تا ۶ روز کاری",
    baseRials: 340000,
    perKgRials: 120000,
    extraItemStepQty: 4,
    extraItemSurchargeRials: 190000,
  },
  {
    code: "TIPAX",
    title: "تیپاکس (اکسپرس درب به درب)",
    subtitle: "ارسال سریع بین‌شهری با بیمه کامل",
    estDays: "۱ تا ۲ روز کاری",
    baseRials: 850000,
    perKgRials: 250000,
    extraItemStepQty: 5,
    extraItemSurchargeRials: 350000,
  },
  {
    code: "CHAPAR",
    title: "چاپار (حمل سریع تجاری)",
    subtitle: "ویژه بسته‌های فروشگاهی و عمده",
    estDays: "۱ تا ۳ روز کاری",
    baseRials: 780000,
    perKgRials: 220000,
    extraItemStepQty: 5,
    extraItemSurchargeRials: 300000,
  },
  {
    code: "COURIER",
    title: "پیک موتوری درون‌شهری (اسنپ‌باکس / الوپیک)",
    subtitle: "تحویل فوری همان‌روز ویژه شهر مبدا",
    estDays: "۲ تا ۴ ساعت",
    baseRials: 650000,
    perKgRials: 100000,
    extraItemStepQty: 6,
    extraItemSurchargeRials: 200000,
  },
  {
    code: "COD",
    title: "پس‌کرایه / پرداخت هزینه ارسال در محل",
    subtitle: "تسویه کرایه حمل با مامور پست/تیپاکس هنگام تحویل",
    estDays: "۲ تا ۴ روز کاری",
    baseRials: 0,
    perKgRials: 0,
    extraItemStepQty: 99,
    extraItemSurchargeRials: 0,
    isPostPaid: true,
  },
];

export function calculateShippingRials(
  carrierCode: ShippingCarrierCode,
  totalWeightGrams: number,
  totalItemQty: number
): number {
  const method =
    SHIPPING_METHODS.find((m) => m.code === carrierCode) || SHIPPING_METHODS[0];
  if (method.isPostPaid || totalItemQty <= 0) return 0;

  const extraKg = Math.max(0, Math.ceil((totalWeightGrams - 1000) / 1000));
  const weightCharge = extraKg * method.perKgRials;
  const volumetricSurcharge =
    totalItemQty >= method.extraItemStepQty ? method.extraItemSurchargeRials : 0;

  return method.baseRials + weightCharge + volumetricSurcharge;
}

export function generatePostalBarcode(
  carrierCode: string,
  orderNumber: number | string
): string {
  const prefixMap: Record<string, string> = {
    PISHTAZ: "19845",
    SEFARESHI: "29845",
    TIPAX: "88100",
    CHAPAR: "77200",
    COURIER: "55300",
    COD: "39845",
  };
  const prefix = prefixMap[carrierCode] || "19845";
  const timestampPart = Date.now().toString().slice(-9);
  const orderPart = String(orderNumber).padStart(6, "0").slice(-6);
  return `${prefix}${timestampPart}${orderPart}`;
}
