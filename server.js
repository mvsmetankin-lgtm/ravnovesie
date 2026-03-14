import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const {
  PORT = "3001",
  APP_SESSION_SECRET = "",
  TELEGRAM_BOT_TOKEN = "",
  SUPABASE_URL = "",
  SUPABASE_SERVICE_ROLE_KEY = "",
} = process.env;

const SUPER_ADMIN_EMAIL = "mvsmetankin@gmail.com";

if (!APP_SESSION_SECRET || !TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Telegram auth backend is not fully configured. Check APP_SESSION_SECRET, TELEGRAM_BOT_TOKEN, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const app = express();
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const HOME_DEFAULT_GOAL = 110;
const ADMIN_SECTIONS = {
  categories: "categories",
  practices: "practices",
  banners: "audio_banners",
};

app.use(express.json({ limit: "1mb" }));

function getRoleFlags(email, currentProfile = null) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  return {
    is_admin: isSuperAdmin || Boolean(currentProfile?.is_admin),
    is_super_admin: isSuperAdmin || Boolean(currentProfile?.is_super_admin),
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signValue(value) {
  return crypto.createHmac("sha256", APP_SESSION_SECRET).update(value).digest("base64url");
}

function isSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionToken(payload) {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(body));
  return `${encodedPayload}.${signValue(encodedPayload)}`;
}

function buildSessionPayload(profile) {
  return {
    sub: profile.id,
    email: profile.email,
    auth_provider: profile.auth_provider || "email",
    is_admin: Boolean(profile.is_admin),
    is_super_admin: Boolean(profile.is_super_admin),
  };
}

function parseSessionToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Токен сессии отсутствует.");
  }

  const expectedSignature = signValue(encodedPayload);
  const validSignature = isSafeEqual(signature, expectedSignature);

  if (!validSignature) {
    throw new Error("Подпись токена недействительна.");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Сессия истекла. Открой приложение заново из Telegram.");
  }

  return payload;
}

function buildTelegramDataCheckString(searchParams) {
  return Array.from(searchParams.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function validateTelegramInitData(initData) {
  const searchParams = new URLSearchParams(initData);
  const hash = searchParams.get("hash");

  if (!hash) {
    throw new Error("Telegram hash не найден.");
  }

  const authDate = Number(searchParams.get("auth_date") || 0);
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 86400) {
    throw new Error("Telegram initData устарели. Открой приложение снова из бота.");
  }

  const dataCheckString = buildTelegramDataCheckString(searchParams);
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(TELEGRAM_BOT_TOKEN)
    .digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const validHash = isSafeEqual(hash, expectedHash);
  if (!validHash) {
    throw new Error("Подпись Telegram initData недействительна.");
  }

  const rawUser = searchParams.get("user");
  if (!rawUser) {
    throw new Error("Telegram user не найден.");
  }

  return {
    authDate,
    user: JSON.parse(rawUser),
    queryId: searchParams.get("query_id") || null,
  };
}

async function ensureTelegramUser(telegramUser) {
  const email = `telegram-${telegramUser.id}@telegram.local`;
  const password = crypto
    .createHash("sha256")
    .update(`${telegramUser.id}:${APP_SESSION_SECRET}`)
    .digest("hex");

  const { data: existingAuth, error: existingError } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (existingError) {
    throw existingError;
  }

  let authUser =
    existingAuth.users.find(
      (user) =>
        user.email === email ||
        String(user.user_metadata?.telegram_id || "") === String(telegramUser.id),
    ) || null;

  if (!authUser) {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username || null,
        first_name: telegramUser.first_name || "",
        second_name: telegramUser.last_name || null,
        avatar_url: telegramUser.photo_url || null,
        auth_provider: "telegram",
      },
    });

    if (createError) {
      throw createError;
    }

    authUser = created.user;
  } else {
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...(authUser.user_metadata || {}),
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username || null,
        first_name: telegramUser.first_name || "",
        second_name: telegramUser.last_name || null,
        avatar_url: telegramUser.photo_url || null,
        auth_provider: "telegram",
      },
    });

    if (updateAuthError) {
      throw updateAuthError;
    }
  }

  const currentProfile = authUser ? await getProfile(authUser.id) : null;
  const roleFlags = getRoleFlags(email, currentProfile);

  const profilePayload = {
    id: authUser.id,
    email,
    first_name: telegramUser.first_name || "Пользователь",
    second_name: telegramUser.last_name || null,
    telegram_id: String(telegramUser.id),
    telegram_username: telegramUser.username || null,
    avatar_url: telegramUser.photo_url || null,
    auth_provider: "telegram",
    ...roleFlags,
  };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user")
    .upsert(profilePayload, { onConflict: "id" })
    .select(
      "id, email, first_name, second_name, created_at, telegram_id, telegram_username, avatar_url, auth_provider, is_admin, is_super_admin",
    )
    .single();

  if (profileError) {
    throw profileError;
  }

  return profile;
}

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("user")
    .select(
      "id, email, first_name, second_name, created_at, telegram_id, telegram_username, avatar_url, auth_provider, is_admin, is_super_admin",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertProfileFromAuthUser(authUser, overrides = {}) {
  const existingProfile = await getProfile(authUser.id);
  const roleFlags = getRoleFlags(authUser.email, existingProfile);
  const profilePayload = {
    id: authUser.id,
    email: authUser.email,
    first_name:
      overrides.first_name ??
      existingProfile?.first_name ??
      authUser.user_metadata?.first_name ??
      "",
    second_name:
      overrides.second_name ??
      existingProfile?.second_name ??
      authUser.user_metadata?.second_name ??
      null,
    telegram_id:
      overrides.telegram_id ??
      existingProfile?.telegram_id ??
      (authUser.user_metadata?.telegram_id
        ? String(authUser.user_metadata.telegram_id)
        : null),
    telegram_username:
      overrides.telegram_username ??
      existingProfile?.telegram_username ??
      authUser.user_metadata?.telegram_username ??
      null,
    avatar_url:
      overrides.avatar_url ??
      existingProfile?.avatar_url ??
      authUser.user_metadata?.avatar_url ??
      null,
    auth_provider:
      overrides.auth_provider ??
      existingProfile?.auth_provider ??
      authUser.user_metadata?.auth_provider ??
      "email",
    ...roleFlags,
    ...overrides,
  };

  const { data, error } = await supabaseAdmin
    .from("user")
    .upsert(profilePayload, { onConflict: "id" })
    .select(
      "id, email, first_name, second_name, created_at, telegram_id, telegram_username, avatar_url, auth_provider, is_admin, is_super_admin",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getDiaryData(userId) {
  const [{ data: goalRow, error: goalError }, { data: entries, error: entriesError }] =
    await Promise.all([
      supabaseAdmin
        .from("journal_goals")
        .select("id, user_id, daily_word_goal, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("journal_entries")
        .select("id, user_id, content, word_count, emotion_tags, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  if (goalError) {
    throw goalError;
  }

  if (entriesError) {
    throw entriesError;
  }

  return {
    goal: goalRow?.daily_word_goal || HOME_DEFAULT_GOAL,
    entries: entries || [],
  };
}

function normalizeProgress(entries, goal) {
  const today = new Date();
  const mondayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayIndex);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const iso = day.toISOString().slice(0, 10);
    const total = entries
      .filter((entry) => entry.created_at.slice(0, 10) === iso)
      .reduce((sum, entry) => sum + (entry.word_count || 0), 0);

    return {
      date: iso,
      completed: total > 0,
      words: total,
      goal,
      isToday: iso === today.toISOString().slice(0, 10),
    };
  });
}

async function getHomeFeed(userId) {
  const [{ data: categories }, { data: practices }, { data: banners }, diaryData] =
    await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("id, title, image_url, video_url, reel_text, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("practices")
        .select("id, title, subtitle, duration_minutes, level, image_url, is_featured, sort_order")
        .eq("is_featured", true)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("audio_banners")
        .select("id, title, image_url, theme, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      getDiaryData(userId),
    ]);

  const progressWeek = normalizeProgress(diaryData.entries, diaryData.goal);
  const todayRow = progressWeek.find((item) => item.isToday);

  return {
    categories: categories || [],
    practices: practices || [],
    banners: banners || [],
    progress: {
      todayWords: todayRow?.words || 0,
      goalWords: todayRow?.goal || HOME_DEFAULT_GOAL,
      week: progressWeek,
    },
  };
}

function countWords(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

async function requireAuth(req, res, next) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    req.auth = parseSessionToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message || "Требуется авторизация." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth?.is_admin && !req.auth?.is_super_admin) {
    res.status(403).json({ error: "Доступ разрешен только администратору." });
    return;
  }

  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.auth?.is_super_admin) {
    res.status(403).json({ error: "Только главный администратор может создавать других администраторов." });
    return;
  }

  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  res.json({
    superAdminEmail: SUPER_ADMIN_EMAIL,
  });
});

app.post("/api/auth/telegram", async (req, res) => {
  try {
    const { initData } = req.body || {};
    const telegramPayload = validateTelegramInitData(initData);
    const profile = await ensureTelegramUser(telegramPayload.user);
    const token = createSessionToken(buildSessionPayload(profile));

    res.json({
      token,
      profile,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Не удалось выполнить Telegram-вход." });
  }
});

app.post("/api/auth/session", async (req, res) => {
  try {
    const accessToken = String(req.body?.accessToken || "");
    if (!accessToken) {
      throw new Error("Supabase access token не передан.");
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      throw error || new Error("Не удалось определить пользователя по Supabase-сессии.");
    }

    const profile = await upsertProfileFromAuthUser(user);
    const token = createSessionToken(buildSessionPayload(profile));

    res.json({ token, profile });
  } catch (error) {
    res.status(400).json({ error: error.message || "Не удалось создать backend-сессию." });
  }
});

app.get("/api/profile", requireAuth, async (req, res) => {
  try {
    const profile = await getProfile(req.auth.sub);
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось загрузить профиль." });
  }
});

app.get("/api/home", requireAuth, async (req, res) => {
  try {
    const [profile, home] = await Promise.all([
      getProfile(req.auth.sub),
      getHomeFeed(req.auth.sub),
    ]);
    res.json({ profile, ...home });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось загрузить главную страницу." });
  }
});

app.get("/api/diary", requireAuth, async (req, res) => {
  try {
    const diary = await getDiaryData(req.auth.sub);
    res.json(diary);
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось загрузить дневник." });
  }
});

app.put("/api/diary/goal", requireAuth, async (req, res) => {
  try {
    const goal = Number(req.body?.goal_words || HOME_DEFAULT_GOAL);
    const { error } = await supabaseAdmin.from("journal_goals").upsert(
      {
        user_id: req.auth.sub,
        daily_word_goal: goal,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось сохранить цель." });
  }
});

app.post("/api/diary/entries", requireAuth, async (req, res) => {
  try {
    const content = String(req.body?.content || "").trim();
    const emotionTags = Array.isArray(req.body?.emotion_tags) ? req.body.emotion_tags : [];
    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .insert({
        user_id: req.auth.sub,
        content,
        word_count: countWords(content),
        emotion_tags: emotionTags,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    res.json({ entry: data });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось создать запись." });
  }
});

app.patch("/api/diary/entries/:id", requireAuth, async (req, res) => {
  try {
    const content = String(req.body?.content || "").trim();
    const emotionTags = Array.isArray(req.body?.emotion_tags) ? req.body.emotion_tags : [];
    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .update({
        content,
        word_count: countWords(content),
        emotion_tags: emotionTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("user_id", req.auth.sub)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    res.json({ entry: data });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось обновить запись." });
  }
});

app.delete("/api/diary/entries/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("journal_entries")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.auth.sub);

    if (error) {
      throw error;
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось удалить запись." });
  }
});

app.get("/api/admin/content", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [{ data: categories }, { data: practices }, { data: banners }] = await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("id, title, image_url, video_url, reel_text, sort_order, is_active")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("practices")
        .select("id, title, subtitle, duration_minutes, level, image_url, is_featured, sort_order")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("audio_banners")
        .select("id, title, image_url, theme, sort_order, is_active")
        .order("sort_order", { ascending: true }),
    ]);

    res.json({
      categories: categories || [],
      practices: practices || [],
      banners: banners || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось загрузить админ-данные." });
  }
});

app.get("/api/admin/users", requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user")
      .select(
        "id, email, first_name, second_name, created_at, is_admin, is_super_admin, auth_provider",
      )
      .or("is_admin.eq.true,is_super_admin.eq.true")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ users: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось загрузить список администраторов." });
  }
});

app.post("/api/admin/users", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const firstName = String(req.body?.first_name || "").trim();
    const secondNameRaw = String(req.body?.second_name || "").trim();
    const secondName = secondNameRaw || null;

    if (!email || !password || !firstName) {
      throw new Error("Укажи email, пароль и имя нового администратора.");
    }

    if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("Главный администратор уже существует и не создается через эту форму.");
    }

    const { data: listedUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      throw listError;
    }

    let authUser = listedUsers.users.find((item) => item.email?.toLowerCase() === email) || null;

    if (!authUser) {
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          second_name: secondName,
          auth_provider: "email",
          is_admin: true,
          is_super_admin: false,
        },
      });

      if (createError) {
        throw createError;
      }

      authUser = createdUser.user;
    } else {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          first_name: firstName || authUser.user_metadata?.first_name || "",
          second_name: secondName,
          auth_provider: authUser.user_metadata?.auth_provider || "email",
          is_admin: true,
          is_super_admin: false,
        },
      });

      if (updateError) {
        throw updateError;
      }
    }

    const profile = await upsertProfileFromAuthUser(authUser, {
      first_name: firstName,
      second_name: secondName,
      auth_provider: "email",
      is_admin: true,
      is_super_admin: false,
    });

    res.json({ user: profile });
  } catch (error) {
    res.status(400).json({ error: error.message || "Не удалось создать администратора." });
  }
});

app.patch("/api/admin/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const userId = String(req.params.id || "");
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const firstName = String(req.body?.first_name || "").trim();
    const secondNameRaw = String(req.body?.second_name || "").trim();
    const secondName = secondNameRaw || null;

    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error("Администратор не найден.");
    }

    if (profile.is_super_admin || email === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("Главного администратора нельзя изменять через эту форму.");
    }

    const { data: listedUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      throw listError;
    }

    const authUser = listedUsers.users.find((item) => item.id === userId);
    if (!authUser) {
      throw new Error("Auth-пользователь администратора не найден.");
    }

    const updatePayload = {
      email: email || authUser.email,
      user_metadata: {
        ...(authUser.user_metadata || {}),
        first_name: firstName || authUser.user_metadata?.first_name || "",
        second_name: secondName,
        auth_provider: authUser.user_metadata?.auth_provider || "email",
        is_admin: true,
        is_super_admin: false,
      },
    };

    if (password) {
      updatePayload.password = password;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      updatePayload,
    );

    if (updateError) {
      throw updateError;
    }

    const updatedProfile = await upsertProfileFromAuthUser(
      {
        ...authUser,
        email: updatePayload.email,
        user_metadata: updatePayload.user_metadata,
      },
      {
        email: updatePayload.email,
        first_name: updatePayload.user_metadata.first_name,
        second_name: updatePayload.user_metadata.second_name,
        auth_provider: "email",
        is_admin: true,
        is_super_admin: false,
      },
    );

    res.json({ user: updatedProfile });
  } catch (error) {
    res.status(400).json({ error: error.message || "Не удалось обновить администратора." });
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const userId = String(req.params.id || "");
    const profile = await getProfile(userId);

    if (!profile) {
      throw new Error("Администратор не найден.");
    }

    if (profile.is_super_admin || String(profile.email || "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("Главного администратора нельзя удалить.");
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      throw deleteAuthError;
    }

    const { error: deleteProfileError } = await supabaseAdmin.from("user").delete().eq("id", userId);
    if (deleteProfileError) {
      throw deleteProfileError;
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Не удалось удалить администратора." });
  }
});

app.post("/api/admin/:section", requireAuth, requireAdmin, async (req, res) => {
  const table = ADMIN_SECTIONS[req.params.section];
  if (!table) {
    res.status(404).json({ error: "Секция не найдена." });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.from(table).insert(req.body).select("*").single();

    if (error) {
      throw error;
    }

    res.json({ record: data });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось создать запись." });
  }
});

app.patch("/api/admin/:section/:id", requireAuth, requireAdmin, async (req, res) => {
  const table = ADMIN_SECTIONS[req.params.section];
  if (!table) {
    res.status(404).json({ error: "Секция не найдена." });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update(req.body)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    res.json({ record: data });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось обновить запись." });
  }
});

app.delete("/api/admin/:section/:id", requireAuth, requireAdmin, async (req, res) => {
  const table = ADMIN_SECTIONS[req.params.section];
  if (!table) {
    res.status(404).json({ error: "Секция не найдена." });
    return;
  }

  try {
    const { error } = await supabaseAdmin.from(table).delete().eq("id", req.params.id);

    if (error) {
      throw error;
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Не удалось удалить запись." });
  }
});

app.listen(Number(PORT), () => {
  console.log(`MindFlow Telegram auth server listening on ${PORT}`);
});
