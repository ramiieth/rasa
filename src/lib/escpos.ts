// تبدیل فیش فارسی به دستور رستر ESC/POS (GS v 0) و چاپ مستقیم از طریق WebSerial
export async function printThermalReceiptWebSerial(input: {
  storeName: string;
  orderNumber: number | string;
  items: Array<{ title: string; qty: number; totalToman: string }>;
  totalToman: string;
}) {
  if (typeof window === "undefined" || !("serial" in navigator)) {
    throw new Error("مرورگر شما از WebSerial پشتیبانی نمی‌کند (از Chrome/Edge دسکتاپ استفاده کنید).");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 384; // عرض استاندارد پرینتر حرارتی 58mm
  const lineHeight = 28;
  canvas.height = 170 + input.items.length * lineHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("خطا در ایجاد بوم چاپ حرارتی");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.font = "bold 20px Vazirmatn, Tahoma, sans-serif";
  ctx.fillText(input.storeName, canvas.width / 2, 34);

  ctx.font = "14px Vazirmatn, Tahoma, sans-serif";
  ctx.fillText(`فیش فروش حضوری #${input.orderNumber}`, canvas.width / 2, 62);
  ctx.fillText("----------------------------------------", canvas.width / 2, 82);

  let y = 108;
  for (const item of input.items) {
    ctx.textAlign = "right";
    ctx.fillText(`${item.title} × ${item.qty}`, canvas.width - 10, y);
    ctx.textAlign = "left";
    ctx.fillText(item.totalToman, 10, y);
    y += lineHeight;
  }

  ctx.textAlign = "center";
  ctx.fillText("----------------------------------------", canvas.width / 2, y);
  ctx.font = "bold 16px Vazirmatn, Tahoma, sans-serif";
  ctx.fillText(`جمع کل: ${input.totalToman}`, canvas.width / 2, y + 28);

  const width = canvas.width;
  const height = canvas.height;
  const widthBytes = Math.ceil(width / 8);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const header = new Uint8Array([
    0x1d, 0x76, 0x30, 0x00,
    widthBytes & 0xff, (widthBytes >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff,
  ]);

  const raster = new Uint8Array(widthBytes * height);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4;
      const lum = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      if (lum < 160 && imageData[idx + 3] > 128) {
        raster[py * widthBytes + (px >> 3)] |= 0x80 >> (px & 7);
      }
    }
  }

  const cutPaper = new Uint8Array([0x1b, 0x64, 0x04, 0x1d, 0x56, 0x42, 0x00]);
  const output = new Uint8Array(header.length + raster.length + cutPaper.length);
  output.set(header, 0);
  output.set(raster, header.length);
  output.set(cutPaper, header.length + raster.length);

  const port = await (navigator as any).serial.requestPort();
  await port.open({ baudRate: 9600 });
  const writer = port.writable.getWriter();
  await writer.write(output);
  writer.releaseLock();
  await port.close();
}
