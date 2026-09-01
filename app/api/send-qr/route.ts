import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { email, name, qrCode } = await request.json();

    if (!email || !qrCode) {
      return NextResponse.json({ error: "Email et QR Code requis." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY manquante." }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: "Centre Les Profs <onboarding@resend.dev>",
      to: [email],
      subject: "Votre QR Code — Centre Les Profs",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Centre Les Profs</h2><p>Bonjour ${escapeHtml(name || "")},</p><p>Voici votre QR Code pour enregistrer votre présence :</p><div style="background:#fff;padding:20px;text-align:center;border:1px solid #eee;border-radius:12px"><img src="https://quickchart.io/qr?text=${encodeURIComponent(qrCode)}&size=300" alt="QR Code" width="300" height="300" /></div><p><strong>Code :</strong> ${escapeHtml(qrCode)}</p><p>Gardez ce QR Code et présentez-le à l'administration lors de votre présence.</p></div>`,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch {
    return NextResponse.json({ error: "Impossible d'envoyer l'email." }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char] || char);
}
