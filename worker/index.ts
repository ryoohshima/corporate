// OAuth で許可したこのアカウントから、自分宛てに送る
const MAILBOX = "info@panisia.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 改行を除き、メールヘッダーへの差し込みを防ぐ
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64Url = (bytes: Uint8Array) =>
  base64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const utf8 = (text: string) => new TextEncoder().encode(text);

// info@panisia.com として一度だけ許可して得たリフレッシュトークンから、アクセストークンを取得する
async function getAccessToken(env: Env): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    }),
  });
  if (!response.ok) {
    throw new Error(`token ${response.status}: ${await response.text()}`);
  }
  const { access_token } = await response.json<{ access_token: string }>();
  return access_token;
}

async function sendMail(
  env: Env,
  mail: { replyTo: string; subject: string; text: string },
) {
  const mime = [
    `From: Panisia Web <${MAILBOX}>`,
    `To: ${MAILBOX}`,
    `Reply-To: ${mail.replyTo}`,
    `Subject: =?UTF-8?B?${base64(utf8(mail.subject))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(utf8(mail.text)),
  ].join("\r\n");
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAccessToken(env)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64Url(utf8(mime)) }),
    },
  );
  if (!response.ok) {
    throw new Error(`gmail ${response.status}: ${await response.text()}`);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/contact") {
      return new Response("Not Found", { status: 404 });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (request.headers.get("Origin") !== url.origin) {
      return new Response("Forbidden", { status: 403 });
    }

    const form = await request.formData();
    const field = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    // 非表示の欄に入力がある場合は bot とみなし、成功を装って破棄する
    if (field("website")) return new Response(null, { status: 204 });

    const name = singleLine(field("name"));
    const company = singleLine(field("company"));
    const email = singleLine(field("email"));
    const message = field("message");
    if (
      !name ||
      name.length > 100 ||
      company.length > 100 ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email) ||
      !message ||
      message.length > 5000 ||
      !field("consent")
    ) {
      return new Response("Bad Request", { status: 400 });
    }

    try {
      await sendMail(env, {
        replyTo: email,
        subject: `【お問い合わせ】${name} 様`,
        text: `お名前: ${name}\n会社名: ${company || "-"}\nメール: ${email}\n\n${message}\n`,
      });
    } catch (error) {
      console.error("お問い合わせメールの送信に失敗", error);
      return new Response("Internal Server Error", { status: 500 });
    }
    return new Response(null, { status: 204 });
  },
} satisfies ExportedHandler<Env>;
