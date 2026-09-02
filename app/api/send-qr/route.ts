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

    const nylasApiKey = process.env.NYLAS_API_KEY?.trim();
    const nylasDomain = process.env.NYLAS_EMAIL_DOMAIN?.trim();

    if (!nylasApiKey || !nylasDomain) {
      return NextResponse.json(
        { error: "Configuration email manquante (NYLAS_API_KEY / NYLAS_EMAIL_DOMAIN)." },
        { status: 500 }
      );
    }

    const safeName = escapeHtml(String(name || ""));
    const safeQrCode = escapeHtml(code);
    const qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(code)}&size=300`;
    const requestId = crypto.randomUUID();

    const response = await fetch(
      `https://api.eu.nylas.com/v3/domains/${encodeURIComponent(nylasDomain)}/messages/send`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${nylasApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": requestId,
        },
        body: JSON.stringify({
          from: {
            name: "Centre Les Profs",
            email: `hello@${nylasDomain}`,
          },
          to: [{ name: String(name || "Élève"), email: recipient }],
          subject: "Votre QR Code — Centre Les Profs",
          body: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Centre Les Profs</h2><p>Bonjour ${safeName},</p><p>Voici votre QR Code pour enregistrer votre présence :</p><div style="background:#fff;padding:20px;text-align:center;border:1px solid #eee;border-radius:12px"><img src="${qrImage}" alt="QR Code" width="300" height="300" /></div><p><strong>Code :</strong> ${safeQrCode}</p><p>Gardez ce QR Code et présentez-le à l'administration lors de votre présence.</p></div>`,
        }),
      }
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const nylasError = result?.error || {};
      console.error("NYLAS_SEND_ERROR", {
        status: response.status,
        type: nylasError?.type || "unknown",
        message: nylasError?.message || result?.message || "Nylas error",
        request_id: result?.request_id || null,
        domain: nylasDomain,
        endpoint: "https://api.eu.nylas.com",
        hasApiKey: !!nylasApiKey,
      });
      return NextResponse.json(
        {
          error: nylasError?.message || result?.message || "Nylas error",
          type: nylasError?.type || "unknown",
          request_id: result?.request_id || null,
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result?.data?.message_id || result?.request_id,
      request_id: result?.request_id || null,
    });
  } catch (error) {
    console.error("NYLAS_SEND_EXCEPTION", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
        error: "Impossible d'envoyer l'email.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
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
