"use client";
export async function checkout(invoiceId: string, onComplete: () => void) {
  const r = await fetch("/api/payments/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  });
  const p = await r.json();
  if (!r.ok) throw new Error(p.error);
  if (!(window as any).Razorpay)
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Unable to load the payment provider"));
      document.head.appendChild(script);
    });
  const payment = new (window as any).Razorpay({
    key: p.keyId,
    amount: p.amount,
    currency: p.currency,
    order_id: p.orderId,
    name: "LexFirm Pro",
    prefill: { name: p.name, email: p.email },
    handler: async (result: any) => {
      const verify = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const response = await verify.json();
      if (verify.ok) onComplete();
      else alert(response.error);
    },
  });
  payment.open();
}
