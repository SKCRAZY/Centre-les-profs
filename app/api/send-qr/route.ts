import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name, qrCode } = await request.json();
    const recipient = String(email || "").trim();
    const code = String(qrCode || "").trim();

    if (!recipient || !code) {
      return NextResponse.json(
        { error: "Email et QR Code requis.", details: { hasEmail: !!recipient, hasQrCode: !!code } },
        { status: 400 }
      );
    }

    const nylasApiKey = process.env.NYLAS_API_KEY;
    const nylasDomain = process.env.NYLAS_EMAIL_DOMAIN;

    if (!nylasApiKey || !nylasDomain) {
      return NextResponse.json(
        { error: "Configuration email manquante (NYLAS_API_KEY / NYLAS_EMAIL_DOMAIN)." },
        { status: 500 }
      );
    }

    const safeName = escapeHtml(String(name || ""));
    const safeQrCode = escapeHtml(code);
    const qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(code)}&size=300`;

    const response = await fetch(
      `https://api.us.nylas.com/v3/domains/${encodeURIComponent(nylasDomain)}/messages/send`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${nylasApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          from: {
            name: "Centre Les Profs",
            email: `no-reply@${nylasDomain}`,
          },
          to: [{ name: String(name || "Élève"), email: recipient }],
          subject: "Votre QR Code — Centre Les Profs",
          body: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Centre Les Profs</h2><p>Bonjour ${safeName},</p><p>Voici votre QR Code pour enregistrer votre présence :</p><div style="background:#fff;padding:20px;text-align:center;border:1px solid #eee;border-radius:12px"><img src="${qrImage}" alt="QR Code" width="300" height="300" /></div><p><strong>Code :</strong> ${safeQrCode}</p><p>Gardez ce QR Code et présentez-le à l'administration lors de votre présence.</p></div>`,
        }),
      }
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        {
          error: result?.message || result?.error?.message || "Nylas error",
          details: result,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true, id: result?.data?.message_id || result?.request_id });
  } catch {
    return NextResponse.json({ error: "Impossible d'envoyer l'email." }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char] || char));
}
