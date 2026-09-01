import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name, qrCode } = await request.json();
    if (!email || !qrCode) {
      return NextResponse.json({ error: "Email et QR Code requis." }, { status: 400 });
    }

    const nylasApiKey = process.env.NYLAS_API_KEY;
    const nylasDomain = process.env.NYLAS_EMAIL_DOMAIN;

    if (!nylasApiKey || !nylasDomain) {
      return NextResponse.json(
        { error: "Configuration email manquante (NYLAS_API_KEY / NYLAS_EMAIL_DOMAIN)." },
        { status: 500 }
      );
    }

    const safeName = escapeHtml(name || "");
    const safeEmail = escapeHtml(email);
    const safeQrCode = escapeHtml(qrCode);
    const qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(qrCode)}&size=300`;

    const response = await fetch(
      `https://api.us.nylas.com/v3/domains/${encodeURIComponent(nylasDomain)}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${nylasApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          from: {
            name: "Centre Les Profs",
            email: `no-reply@${nylasDomain}`,
          },
          to: [{ name: name || undefined, email }],
          subject: "Votre QR Code — Centre Les Profs",
          body: `Bonjour ${name || ""},\n\nVoici votre QR Code pour enregistrer votre présence.\n\nCode : ${qrCode}\n\nGardez ce QR Code et présentez-le à l'administration lors de votre présence.`,
          tracking_options: { opens: false, links: false },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: result?.message || result?.error?.message || "Nylas error" },
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
