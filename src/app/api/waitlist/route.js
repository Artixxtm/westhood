const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const acceptedTtl = 7 * 24 * 60 * 60 * 1000;
const rateWindow = 60 * 1000;
const maxAttemptsPerWindow = 6;

const runtimeState = globalThis.__westhoodWaitlistRuntime ?? {
  accepted: new Map(),
  pending: new Map(),
  attempts: new Map(),
};

globalThis.__westhoodWaitlistRuntime = runtimeState;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function prune(now) {
  for (const [email, acceptedAt] of runtimeState.accepted) {
    if (now - acceptedAt > acceptedTtl) runtimeState.accepted.delete(email);
  }

  for (const [address, attempts] of runtimeState.attempts) {
    const recent = attempts.filter((attemptedAt) => now - attemptedAt < rateWindow);
    if (recent.length > 0) runtimeState.attempts.set(address, recent);
    else runtimeState.attempts.delete(address);
  }
}

function getClientAddress(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

async function deliverSignup(email) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    if (process.env.NODE_ENV === "development") return;
    throw new Error("configuration");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `New Westhood® waitlist signup\n\n${email}`,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("telegram");
}

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2048) return json({ error: "INVALID REQUEST." }, 413);
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "INVALID REQUEST." }, 415);
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!emailPattern.test(email) || email.length > 254) {
      return json({ error: "ENTER A VALID EMAIL ADDRESS." }, 400);
    }

    const now = Date.now();
    prune(now);

    if (runtimeState.accepted.has(email)) {
      return json({ ok: true, duplicate: true });
    }

    const pendingDelivery = runtimeState.pending.get(email);
    if (pendingDelivery) {
      try {
        await pendingDelivery;
        return json({ ok: true, duplicate: true });
      } catch (error) {
        if (error.message === "configuration") {
          return json({ error: "WAITLIST IS TEMPORARILY UNAVAILABLE." }, 503);
        }
        return json({ error: "COULDN’T SAVE YOUR EMAIL. TRY AGAIN." }, 502);
      }
    }

    const address = getClientAddress(request);
    if (address !== "unknown") {
      const attempts = runtimeState.attempts.get(address) ?? [];
      if (attempts.length >= maxAttemptsPerWindow) {
        return json({ error: "TOO MANY REQUESTS. TRY AGAIN SHORTLY." }, 429);
      }
      attempts.push(now);
      runtimeState.attempts.set(address, attempts);
    }

    const delivery = deliverSignup(email);
    runtimeState.pending.set(email, delivery);

    try {
      await delivery;
      runtimeState.accepted.set(email, Date.now());
      return json({ ok: true });
    } catch (error) {
      if (error.message === "configuration") {
        return json({ error: "WAITLIST IS TEMPORARILY UNAVAILABLE." }, 503);
      }
      return json({ error: "COULDN’T SAVE YOUR EMAIL. TRY AGAIN." }, 502);
    } finally {
      runtimeState.pending.delete(email);
    }
  } catch {
    return json({ error: "INVALID REQUEST." }, 400);
  }
}
