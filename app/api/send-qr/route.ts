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

    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Centre Les Profs";

    if (!brevoApiKey || !senderEmail) {
      return NextResponse.json(
        { error: "Configuration Brevo manquante (BREVO_API_KEY / BREVO_SENDER_EMAIL)." },
        { status: 500 }
      );
    }

    const safeName = escapeHtml(String(name || ""));
    const safeQrCode = escapeHtml(code);
    const qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(code)}&size=300`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ name: String(name || "Élève"), email: recipient }],
        subject: "Votre QR Code — Centre Les Profs",
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Centre Les Profs</h2><p>Bonjour ${safeName},</p><p>Voici votre QR Code pour enregistrer votre présence :</p><div style="background:#fff;padding:20px;text-align:center;border:1px solid #eee;border-radius:12px"><img src="${qrImage}" alt="QR Code" width="300" height="300" /></div><p><strong>Code :</strong> ${safeQrCode}</p><p>Gardez ce QR Code et présentez-le à l'administration lors de votre présence.</p></div>`,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("BREVO_SEND_ERROR", {
        status: response.status,
        message: result?.message || "Brevo error",
        code: result?.code || null,
        senderEmail,
        hasApiKey: !!brevoApiKey,
      });
      return NextResponse.json(
        {
          error: result?.message || "Brevo error",
          code: result?.code || "unknown",
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result?.messageId || null,
    });
  } catch (error) {
    console.error("BREVO_SEND_EXCEPTION", error instanceof Error ? error.message : "Unknown error");
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
