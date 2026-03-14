const SUPABASE_URL = "https://tdllgdbopoeskuftnira.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbGxnZGJvcG9lc2t1ZnRuaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzk2MzIsImV4cCI6MjA4ODY1NTYzMn0.sASjy9dun4d69k4OVwBryaQNBAiSh-_3sFuKj_8-jRk";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

const pageShell = document.getElementById("pageShell");
const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const authStatus = document.getElementById("authStatus");
const telegramAuth = document.getElementById("telegramAuth");
const telegramLoginButton = document.getElementById("telegramLoginButton");
const appStatus = document.getElementById("appStatus");
const appContent = document.getElementById("appContent");
const bottomNav = document.getElementById("bottomNav");
const globalAdminToggle = document.getElementById("globalAdminToggle");
const sidebarAdminToggle = document.getElementById("sidebarAdminToggle");
const reelOverlay = document.getElementById("reelOverlay");
const reelMedia = document.getElementById("reelMedia");
const reelVideo = document.getElementById("reelVideo");
const reelProgressBar = document.getElementById("reelProgressBar");
const reelCloseButton = document.getElementById("reelCloseButton");
const reelTitle = document.getElementById("reelTitle");
const reelEyebrow = document.getElementById("reelEyebrow");
const reelDescription = document.getElementById("reelDescription");
const screenButtons = document.querySelectorAll("[data-screen-target]");
const screens = document.querySelectorAll("[data-screen]");
const forms = document.querySelectorAll(".auth-form");
const bottomNavButtons = document.querySelectorAll("[data-tab]");
const adminNavButtons = document.querySelectorAll("[data-admin-nav]");
const navContainers = document.querySelectorAll(".bottom-nav");

const state = {
  authScreen: "login",
  currentTab: "home",
  authMode: "supabase",
  apiToken: "",
  session: null,
  profile: null,
  homeFeed: null,
  homeState: "loading",
  diaryData: null,
  diaryFilter: "all",
  diaryEditingId: null,
  isEnteringApp: false,
  isAdminMode: false,
  adminSection: "dashboard",
  adminData: {
    categories: [],
    practices: [],
    banners: [],
    users: [],
  },
  adminSelections: {
    categories: null,
    practices: null,
    banners: null,
  },
  reelTimer: null,
  activeReel: null,
};

const authScreenMessages = {
  login: "Войдите в аккаунт, чтобы открыть главную страницу.",
  register: "Создайте аккаунт и сразу попадите на домашний экран.",
  reset: "Введите email, чтобы отправить письмо для сброса пароля.",
};

const tabLabels = {
  home: "Главная",
  practices: "Практики",
  diary: "Дневник",
  places: "Места",
  profile: "Профиль",
};

const REQUEST_TIMEOUT_MS = 3500;
const REEL_DURATION_MS = 10000;

const DEFAULT_HOME_CONTENT = {
  categories: [
    {
      title: "Мотивация дня",
      image_url:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
      video_url:
        "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
      reel_text:
        "Сделай глубокий вдох. Сегодня ты уже достаточно хороша, чтобы начать маленький шаг к себе.",
    },
    {
      title: "Мини практики",
      image_url:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
      video_url:
        "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-yoga-on-a-mat-4481-large.mp4",
      reel_text:
        "10 секунд, чтобы выбрать короткую практику и мягко вернуть себе внимание и устойчивость.",
    },
    {
      title: "Природа и звуки",
      image_url:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      video_url:
        "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-middle-of-the-jungle-4075-large.mp4",
      reel_text:
        "Представь шум листьев, прохладный воздух и спокойный ритм. Пауза тоже часть продуктивности.",
    },
    {
      title: "График дыхания",
      image_url:
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
      video_url:
        "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-woman-breathing-deeply-47884-large.mp4",
      reel_text:
        "Следуй за ритмом: вдох, короткая пауза и длинный выдох. Тело быстро почувствует опору.",
    },
  ],
  practices: [
    {
      title: "Йога",
      subtitle: "#йога #mindbody",
      duration_minutes: 45,
      level: "Легкий уровень",
      image_url:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Дыхание 4-7-8",
      subtitle: "#дыхание #calm",
      duration_minutes: 10,
      level: "Быстрый старт",
      image_url:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Растяжка",
      subtitle: "#тело #баланс",
      duration_minutes: 20,
      level: "Средний уровень",
      image_url:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    },
  ],
  banners: [
    {
      title: "Звуки спокойствия",
      image_url:
        "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Звуки природы",
      image_url:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    },
  ],
  progress: {
    todayWords: 0,
    goalWords: 110,
    week: [
      { completed: false, isToday: false, words: 65, goal: 110 },
      { completed: false, isToday: false, words: 0, goal: 110 },
      { completed: true, isToday: false, words: 92, goal: 110 },
      { completed: true, isToday: false, words: 115, goal: 110 },
      { completed: false, isToday: false, words: 0, goal: 110 },
      { completed: true, isToday: false, words: 74, goal: 110 },
      { completed: false, isToday: true, words: 0, goal: 110 },
    ],
  },
  diary: {
    goal: 110,
    entries: [
      {
        id: "fallback-entry-1",
        content:
          "Сегодня тревога была выше обычного, но после короткой практики дыхания стало спокойнее.",
        word_count: 12,
        emotion_tags: ["Тревога", "Спокойствие"],
        created_at: new Date().toISOString(),
      },
    ],
  },
};

const ADMIN_SECTIONS = {
  categories: {
    table: "categories",
    title: "Категории",
    description: "Карточки верхнего горизонтального списка на экране Дом.",
    fields: [
      { name: "title", label: "Название", type: "text", required: true },
      { name: "image_url", label: "Изображение URL", type: "url" },
      { name: "video_url", label: "Видео URL", type: "url" },
      { name: "reel_text", label: "Текст рилса", type: "text" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активно", type: "checkbox" },
    ],
  },
  practices: {
    table: "practices",
    title: "Практики",
    description: "Карточки блока Практики для тебя.",
    fields: [
      { name: "title", label: "Название", type: "text", required: true },
      { name: "subtitle", label: "Подзаголовок", type: "text" },
      { name: "duration_minutes", label: "Минут", type: "number" },
      { name: "level", label: "Уровень", type: "text" },
      { name: "image_url", label: "Изображение URL", type: "url" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_featured", label: "Показывать на Дом", type: "checkbox" },
    ],
  },
  banners: {
    table: "audio_banners",
    title: "Баннеры",
    description: "Аудио- и контент-баннеры под практиками.",
    fields: [
      { name: "title", label: "Название", type: "text", required: true },
      { name: "theme", label: "Тема", type: "text" },
      { name: "image_url", label: "Изображение URL", type: "url" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активно", type: "checkbox" },
    ],
  },
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function getEmptyAdminRecord(sectionName) {
  if (sectionName === "categories") {
    return {
      title: "",
      image_url: "",
      video_url: "",
      reel_text: "",
      sort_order: 0,
      is_active: true,
    };
  }

  if (sectionName === "practices") {
    return {
      title: "",
      subtitle: "",
      duration_minutes: 10,
      level: "",
      image_url: "",
      sort_order: 0,
      is_featured: true,
    };
  }

  if (sectionName === "banners") {
    return { title: "", theme: "", image_url: "", sort_order: 0, is_active: true };
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    words_count: 0,
    goal_words: 110,
  };
}

function setAuthStatus(message, type = "info") {
  authStatus.textContent = message;
  authStatus.classList.toggle("is-success", type === "success");
  authStatus.classList.toggle("is-error", type === "error");
}

function getTelegramWebApp() {
  return window.Telegram?.WebApp || null;
}

function isTelegramRuntime() {
  return Boolean(getTelegramWebApp()?.initData);
}

function updateTelegramAuthUi() {
  telegramAuth?.classList.toggle("is-hidden", !isTelegramRuntime());
}

function isTelegramSession() {
  return state.authMode === "telegram";
}

function buildPseudoSession(profile) {
  return {
    access_token: state.apiToken,
    user: {
      id: profile.id,
      email: profile.email,
      created_at: profile.created_at,
      user_metadata: {
        first_name: profile.first_name || "",
        second_name: profile.second_name || null,
        avatar_url: profile.avatar_url || null,
        auth_provider: profile.auth_provider || "telegram",
        is_admin: Boolean(profile.is_admin),
        is_super_admin: Boolean(profile.is_super_admin),
      },
    },
  };
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (state.apiToken) {
    headers.set("Authorization", `Bearer ${state.apiToken}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Не удалось выполнить запрос к backend.");
  }

  return payload;
}

function isAdminUser() {
  return Boolean(
    state.profile?.is_admin ||
      state.profile?.is_super_admin ||
      state.session?.user?.user_metadata?.is_admin ||
      state.session?.user?.user_metadata?.is_super_admin,
  );
}

function isSuperAdminUser() {
  return Boolean(
    state.profile?.is_super_admin || state.session?.user?.user_metadata?.is_super_admin,
  );
}

function setAppStatus(message = "", type = "info") {
  if (!message) {
    appStatus.textContent = "";
    appStatus.classList.add("is-hidden");
    appStatus.classList.remove("is-success", "is-error");
    return;
  }

  appStatus.textContent = message;
  appStatus.classList.remove("is-hidden");
  appStatus.classList.toggle("is-success", type === "success");
  appStatus.classList.toggle("is-error", type === "error");
}

function updateAdminToggleButtons() {
  if (globalAdminToggle) {
    globalAdminToggle.textContent = "Админка";
    globalAdminToggle.classList.toggle("is-hidden", !isAdminUser() || state.isAdminMode);
  }

  if (sidebarAdminToggle) {
    sidebarAdminToggle.textContent = "Открыть админку";
    sidebarAdminToggle.classList.toggle("is-hidden", !isAdminUser() || state.isAdminMode);
  }
}

function updateNavigationVisibility() {
  const admin = isAdminUser();
  navContainers.forEach((container) => {
    container.classList.toggle("is-admin-only", admin && state.isAdminMode);
  });

  bottomNavButtons.forEach((button) => {
    button.classList.toggle("is-hidden", admin);
  });

  adminNavButtons.forEach((button) => {
    const visible = admin && state.isAdminMode;
    button.classList.toggle("is-hidden", !visible);
    button.classList.toggle(
      "is-active",
      visible && button.dataset.adminNav === state.adminSection,
    );
  });
}

function setActiveAuthScreen(screenName) {
  state.authScreen = screenName;

  screenButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.screenTarget === screenName);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === screenName);
  });

  setAuthStatus(authScreenMessages[screenName]);
}

function getPasswordResetRedirect() {
  if (
    window.location.protocol === "http:" ||
    window.location.protocol === "https:"
  ) {
    return `${window.location.origin}${window.location.pathname}`;
  }

  return undefined;
}

function getAvatarMarkup(profile, authUser) {
  const avatarUrl = profile?.avatar_url || authUser?.user_metadata?.avatar_url || "";
  const nameSeed = profile?.first_name || authUser?.email || "MF";
  const initials = nameSeed
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return `<div class="avatar"><img src="${escapeHtml(avatarUrl)}" alt="Аватар пользователя" /></div>`;
  }

  return `<div class="avatar" aria-label="Аватар пользователя">${escapeHtml(initials)}</div>`;
}

function getGreeting(profile) {
  const firstName = profile?.first_name?.trim();
  return firstName ? `Привет, ${firstName} 💚` : "Привет 💚";
}

function formatTodaySubtitle() {
  return "Сегодня мы справимся с тревогой вместе";
}

function formatWordsCount(value) {
  return `${value ?? 0} слов за сегодня`;
}

function countWords(text) {
  const trimmed = (text || "").trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function getWeekDays() {
  return ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
}

function formatEntryDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDiaryFilterOptions() {
  return [
    { id: "all", label: "Все" },
    { id: "week", label: "За неделю" },
    { id: "anxiety", label: "С тревогой" },
    { id: "untagged", label: "Без тегов" },
  ];
}

function filterDiaryEntries(entries, filterId) {
  if (filterId === "week") {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return entries.filter((entry) => new Date(entry.created_at).getTime() >= cutoff);
  }

  if (filterId === "anxiety") {
    return entries.filter((entry) => (entry.emotion_tags || []).includes("Тревога"));
  }

  if (filterId === "untagged") {
    return entries.filter((entry) => !(entry.emotion_tags || []).length);
  }

  return entries;
}

function buildImageMarkup(src, alt) {
  if (!src) {
    return "";
  }

  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
}

function getReelDescription(category) {
  if (category?.reel_text) {
    return category.reel_text;
  }

  const fallbackDescriptions = {
    "Мотивация дня":
      "Сделай глубокий вдох. Сегодня ты уже достаточно хороша, чтобы начать маленький шаг к себе.",
    "Мини практики":
      "10 секунд, чтобы выбрать короткую практику и мягко вернуть себе внимание и устойчивость.",
    "Природа и звуки":
      "Представь шум листьев, прохладный воздух и спокойный ритм. Пауза тоже часть продуктивности.",
    "График дыхания":
      "Следуй за ритмом: вдох, короткая пауза и длинный выдох. Тело быстро почувствует опору.",
  };

  return (
    fallbackDescriptions[category?.title] ||
    "Небольшой reels-эпизод помогает быстро сфокусироваться и перейти к следующему полезному действию."
  );
}

function closeReel() {
  if (state.reelTimer) {
    window.clearTimeout(state.reelTimer);
    state.reelTimer = null;
  }

  state.activeReel = null;
  reelOverlay?.classList.add("is-hidden");

  if (reelVideo) {
    reelVideo.pause();
    reelVideo.removeAttribute("src");
    reelVideo.load();
    reelVideo.classList.add("is-hidden");
  }

  if (reelProgressBar) {
    reelProgressBar.style.transition = "none";
    reelProgressBar.style.transform = "scaleX(0)";
  }
}

function openReel(category) {
  if (!category) {
    return;
  }

  state.activeReel = category;

  if (reelTitle) {
    reelTitle.textContent = category.title || "Рилс";
  }

  if (reelEyebrow) {
    reelEyebrow.textContent = "Категория";
  }

  if (reelDescription) {
    reelDescription.textContent = getReelDescription(category);
  }

  if (reelMedia) {
    const image = category.image_url || "";
    reelMedia.style.backgroundImage = `
      linear-gradient(180deg, rgba(9, 16, 34, 0.12), rgba(9, 16, 34, 0.74)),
      url("${image}")
    `;
  }

  if (reelVideo) {
    if (category.video_url) {
      reelVideo.src = category.video_url;
      reelVideo.classList.remove("is-hidden");
      const playPromise = reelVideo.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          reelVideo.classList.add("is-hidden");
        });
      }
    } else {
      reelVideo.pause();
      reelVideo.removeAttribute("src");
      reelVideo.load();
      reelVideo.classList.add("is-hidden");
    }
  }

  reelOverlay?.classList.remove("is-hidden");

  if (reelProgressBar) {
    reelProgressBar.style.transition = "none";
    reelProgressBar.style.transform = "scaleX(0)";

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        reelProgressBar.style.transition = `transform ${REEL_DURATION_MS}ms linear`;
        reelProgressBar.style.transform = "scaleX(1)";
      });
    });
  }

  if (state.reelTimer) {
    window.clearTimeout(state.reelTimer);
  }

  state.reelTimer = window.setTimeout(() => {
    closeReel();
  }, REEL_DURATION_MS);
}

function withTimeout(promise, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, REQUEST_TIMEOUT_MS);
    }),
  ]);
}

function renderLoadingState(message) {
  appContent.innerHTML = `
    <section class="loading-state">
      <h3>Загрузка</h3>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function renderAdminField(sectionName, field, selectedRecord) {
  const value = selectedRecord?.[field.name];

  if (field.type === "checkbox") {
    return `
      <label class="admin-checkbox">
        <input
          type="checkbox"
          name="${escapeHtml(field.name)}"
          ${value ?? true ? "checked" : ""}
        />
        <span>${escapeHtml(field.label)}</span>
      </label>
    `;
  }

  return `
    <label class="admin-field">
      <span>${escapeHtml(field.label)}</span>
      <input
        type="${escapeHtml(field.type)}"
        name="${escapeHtml(field.name)}"
        value="${escapeHtml(value ?? "")}"
        ${field.required ? "required" : ""}
      />
    </label>
  `;
}

function renderAdminListItem(sectionName, item) {
  const title =
    item.title ||
    item.date ||
    item.theme ||
    item.subtitle ||
    "Без названия";
  const metaParts = [];

  if (sectionName === "categories") {
    metaParts.push(`sort ${item.sort_order ?? 0}`);
    metaParts.push(item.is_active ? "активно" : "скрыто");
  }

  if (sectionName === "practices") {
    metaParts.push(`${item.duration_minutes ?? 0} минут`);
    metaParts.push(item.level || "без уровня");
  }

  if (sectionName === "banners") {
    metaParts.push(item.theme || "без темы");
    metaParts.push(item.is_active ? "активно" : "скрыто");
  }

  if (sectionName === "progress") {
    metaParts.push(`${item.words_count ?? 0} слов`);
    metaParts.push(`цель ${item.goal_words ?? 110}`);
  }

  return `
    <article class="admin-list-item">
      <div class="admin-list-item__body">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(metaParts.join(" • "))}</p>
      </div>
      <div class="admin-list-item__actions">
        <button class="secondary-button" type="button" data-admin-edit="${escapeHtml(sectionName)}" data-id="${escapeHtml(item.id)}">
          Редактировать
        </button>
        <button class="secondary-button" type="button" data-admin-delete="${escapeHtml(sectionName)}" data-id="${escapeHtml(item.id)}">
          Удалить
        </button>
      </div>
    </article>
  `;
}

function renderAdminSection(sectionName) {
  const config = ADMIN_SECTIONS[sectionName];
  const items = state.adminData[sectionName] || [];
  const selectedRecord = state.adminSelections[sectionName] || getEmptyAdminRecord(sectionName);
  const selectedId = state.adminSelections[sectionName]?.id || "";
  const listMarkup = items.length
    ? items.map((item) => renderAdminListItem(sectionName, item)).join("")
    : `
      <article class="admin-empty">
        <h4>Пока пусто</h4>
        <p>${escapeHtml(config.description)}</p>
      </article>
    `;

  return `
    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <h3>${escapeHtml(config.title)}</h3>
          <p>${escapeHtml(config.description)}</p>
        </div>
      </div>

      <form class="admin-form" data-admin-form="${escapeHtml(sectionName)}">
        <input type="hidden" name="id" value="${escapeHtml(selectedId)}" />
        <div class="admin-form__grid">
          ${config.fields
            .map((field) => renderAdminField(sectionName, field, selectedRecord))
            .join("")}
        </div>
        <div class="admin-form__actions">
          <button class="primary-button" type="submit">
            ${selectedId ? "Сохранить изменения" : "Добавить запись"}
          </button>
          ${
            selectedId
              ? `<button class="secondary-button" type="button" data-admin-cancel="${escapeHtml(sectionName)}">Отмена</button>`
              : ""
          }
        </div>
      </form>

      <div class="admin-list">
        ${listMarkup}
      </div>
    </section>
  `;
}

function renderAdminScreen() {
  if (state.adminSection === "profile") {
    const adminUsersMarkup = (state.adminData.users || []).length
      ? state.adminData.users
          .map((user) => {
            const roleLabel = user.is_super_admin ? "Главный админ" : "Админ";
            return `
              <article class="admin-list-item">
                <div class="admin-list-item__body">
                  <h4>${escapeHtml(user.first_name || user.email || "Администратор")}</h4>
                  <p>${escapeHtml(user.email || "")} • ${escapeHtml(roleLabel)}</p>
                </div>
              </article>
            `;
          })
          .join("")
      : `
        <article class="admin-empty">
          <h4>Пока нет администраторов</h4>
          <p>Главный администратор может создавать дополнительных администраторов здесь.</p>
        </article>
      `;

    appContent.innerHTML = `
      <section class="admin-screen">
        <header class="admin-screen__header">
          <div>
            <p class="admin-screen__eyebrow">Аккаунт администратора</p>
            <h1>Профиль</h1>
            <p>У администратора есть доступ только к панели управления и собственному профилю.</p>
          </div>
        </header>

        <section class="admin-grid">
          <article class="admin-panel">
            <div class="admin-panel__header">
              <div>
                <h3>${escapeHtml(state.profile?.first_name || "Администратор")}</h3>
                <p>${escapeHtml(state.profile?.email || state.session?.user?.email || "")}</p>
              </div>
            </div>
            <div class="profile-actions">
              <button class="secondary-button" type="button" id="adminRefreshButton">Обновить данные</button>
              <button class="secondary-button" type="button" id="logoutButton">Выйти из аккаунта</button>
            </div>
          </article>
          ${
            isSuperAdminUser()
              ? `
                <article class="admin-panel">
                  <div class="admin-panel__header">
                    <div>
                      <h3>Управление администраторами</h3>
                      <p>Только главный администратор может создавать новых администраторов. Новые админы не могут создавать других админов.</p>
                    </div>
                  </div>
                  <form class="admin-form" id="adminUserForm">
                    <div class="admin-form__grid">
                      <label class="admin-field">
                        <span>Email</span>
                        <input type="email" name="email" required />
                      </label>
                      <label class="admin-field">
                        <span>Пароль</span>
                        <input type="password" name="password" minlength="8" required />
                      </label>
                      <label class="admin-field">
                        <span>Имя</span>
                        <input type="text" name="first_name" required />
                      </label>
                      <label class="admin-field">
                        <span>Фамилия</span>
                        <input type="text" name="second_name" />
                      </label>
                    </div>
                    <div class="admin-form__actions">
                      <button class="primary-button" type="submit">Создать администратора</button>
                    </div>
                  </form>
                  <div class="admin-list">
                    ${adminUsersMarkup}
                  </div>
                </article>
              `
              : ""
          }
        </section>
      </section>
    `;

    const refreshButton = document.getElementById("adminRefreshButton");
    const logoutButton = document.getElementById("logoutButton");
    const adminUserForm = document.getElementById("adminUserForm");

    refreshButton?.addEventListener("click", async () => {
      setAppStatus("Обновляем данные...");
      await loadAdminData();
      await refreshHomeFeed();
      renderAdminScreen();
      setAppStatus("Данные обновлены.", "success");
    });

    logoutButton?.addEventListener("click", async () => {
      await logout();
    });

    adminUserForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setAppStatus("Создаём администратора...");

      try {
        await createAdminUser(new FormData(adminUserForm));
        renderAdminScreen();
        setAppStatus("Новый администратор создан.", "success");
      } catch (error) {
        setAppStatus(error.message || "Не удалось создать администратора.", "error");
      }
    });

    updateNavigationVisibility();
    return;
  }

  appContent.innerHTML = `
    <section class="admin-screen">
      <header class="admin-screen__header">
        <div>
          <p class="admin-screen__eyebrow">Контент и данные</p>
          <h1>Админка MindFlow</h1>
          <p>Управляй наполнением главной страницы из одного места.</p>
        </div>
        <div class="admin-screen__actions">
          <button class="secondary-button" type="button" id="adminRefreshButton">Обновить данные</button>
        </div>
      </header>

      <section class="admin-summary">
        <article class="admin-summary__card">
          <strong>${escapeHtml(String(state.adminData.categories.length))}</strong>
          <span>категории</span>
        </article>
        <article class="admin-summary__card">
          <strong>${escapeHtml(String(state.adminData.practices.length))}</strong>
          <span>практики</span>
        </article>
        <article class="admin-summary__card">
          <strong>${escapeHtml(String(state.adminData.banners.length))}</strong>
          <span>баннеры</span>
        </article>
      </section>

      <div class="admin-grid">
        ${renderAdminSection("categories")}
        ${renderAdminSection("practices")}
        ${renderAdminSection("banners")}
      </div>
    </section>
  `;

  bindAdminScreenEvents();
  updateNavigationVisibility();
}

function renderErrorState(message) {
  appContent.innerHTML = `
    <section class="error-state">
      <h3>Не удалось загрузить данные</h3>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function renderEmptyHome(profile, authUser) {
  renderHomeScreen({
    ...DEFAULT_HOME_CONTENT,
    profile,
    authUser,
  });
}

function renderDiaryScreen() {
  const diary = state.diaryData || DEFAULT_HOME_CONTENT.diary;
  const entries = diary.entries || [];
  const filteredEntries = filterDiaryEntries(entries, state.diaryFilter);
  const latestEntry = entries[0] || null;
  const editingEntry = entries.find((entry) => entry.id === state.diaryEditingId) || null;
  const todayWords = entries
    .filter((entry) => entry.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((sum, entry) => sum + (entry.word_count || 0), 0);
  const streak = Math.max(
    0,
    entries.reduce((days, entry, index, arr) => {
      if (index === 0) {
        return 1;
      }

      const prev = new Date(arr[index - 1].created_at);
      const current = new Date(entry.created_at);
      const diff = Math.round((prev - current) / 86400000);
      return diff <= 1 ? days + 1 : days;
    }, entries.length ? 1 : 0),
  );
  const tagCounts = entries.flatMap((entry) => entry.emotion_tags || []);
  const topTag =
    tagCounts.sort(
      (a, b) =>
        tagCounts.filter((item) => item === b).length -
        tagCounts.filter((item) => item === a).length,
    )[0] || "Спокойствие";
  const filterMarkup = getDiaryFilterOptions()
    .map((filter) => {
      const activeClass = filter.id === state.diaryFilter ? " is-active" : "";
      return `<button class="diary-filter${activeClass}" type="button" data-diary-filter="${escapeHtml(
        filter.id,
      )}">${escapeHtml(filter.label)}</button>`;
    })
    .join("");
  const historyMarkup = filteredEntries.length
    ? filteredEntries
        .map((entry) => {
          const preview =
            entry.content.length > 140 ? `${entry.content.slice(0, 140)}...` : entry.content;

          return `
            <article class="diary-entry">
              <div class="diary-entry__meta">
                <strong>${escapeHtml(formatEntryDate(entry.created_at))}</strong>
                <span>${escapeHtml(String(entry.word_count || 0))} слов</span>
              </div>
              <p>${escapeHtml(preview)}</p>
              <div class="diary-tags">
                ${(entry.emotion_tags || [])
                  .map((tag) => `<span>${escapeHtml(tag)}</span>`)
                  .join("")}
              </div>
              <div class="diary-entry__actions">
                <button class="secondary-button" type="button" data-diary-edit="${escapeHtml(entry.id)}">Редактировать</button>
                <button class="secondary-button" type="button" data-diary-delete="${escapeHtml(entry.id)}">Удалить</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `
      <article class="placeholder-card">
        <h3>Пока нет записей</h3>
        <p>Начни с короткой заметки о том, что чувствуешь прямо сейчас.</p>
      </article>
    `;

  appContent.innerHTML = `
    <section class="diary-screen">
      <header class="tab-header">
        <div>
          <h1>Дневник</h1>
          <p class="diary-subtitle">Место, где можно выгрузить мысли и настроить свою цель на день.</p>
        </div>
        ${getAvatarMarkup(state.profile, state.session?.user)}
      </header>

      <section class="diary-grid">
        <article class="diary-goal-card">
          <h3>Цель на сегодня</h3>
          <p class="diary-goal-card__value">${escapeHtml(String(todayWords))} / ${escapeHtml(
            String(diary.goal || 110),
          )} слов</p>
          <form class="diary-goal-form" id="diaryGoalForm">
            <input type="number" min="10" step="10" name="goal_words" value="${escapeHtml(
              String(diary.goal || 110),
            )}" />
            <button class="secondary-button" type="submit">Изменить цель</button>
          </form>
        </article>

        <article class="diary-editor-card">
          <h3>${editingEntry ? "Редактирование записи" : "Новая запись"}</h3>
          <form class="diary-entry-form" id="diaryEntryForm">
            <textarea
              name="content"
              rows="7"
              placeholder="Что ты сейчас чувствуешь?"
              required
            >${escapeHtml(editingEntry?.content || "")}</textarea>
            <div class="diary-tag-picker">
              ${["Тревога", "Спокойствие", "Усталость", "Радость", "Не могу понять"]
                .map((tag) => {
                  const checked = (editingEntry?.emotion_tags || []).includes(tag)
                    ? "checked"
                    : "";
                  return `<label><input type="checkbox" name="emotion_tags" value="${escapeHtml(
                    tag,
                  )}" ${checked} />${escapeHtml(tag)}</label>`;
                })
                .join("")}
            </div>
            <div class="diary-entry-form__actions">
              <button class="primary-button" type="submit">
                ${editingEntry ? "Сохранить изменения" : "Сохранить запись"}
              </button>
              ${
                editingEntry
                  ? '<button class="secondary-button" type="button" id="cancelDiaryEdit">Отмена</button>'
                  : ""
              }
            </div>
          </form>
        </article>
      </section>

      <section class="diary-grid">
        <article class="diary-insights-card">
          <h3>Инсайты</h3>
          <div class="diary-insights">
            <p>Серия записей: <strong>${escapeHtml(String(streak))} дней</strong></p>
            <p>Чаще всего встречается: <strong>${escapeHtml(topTag)}</strong></p>
            <p>Последняя запись: <strong>${escapeHtml(
              latestEntry ? `${latestEntry.word_count} слов` : "пока нет",
            )}</strong></p>
          </div>
        </article>

        <article class="diary-history-card">
          <div class="section-title">
            <h2>История записей</h2>
          </div>
          <div class="diary-filters">
            ${filterMarkup}
          </div>
          <div class="diary-history">
            ${historyMarkup}
          </div>
        </article>
      </section>
    </section>
  `;

  document.getElementById("diaryGoalForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const goal = Number(new FormData(form).get("goal_words") || 110);

    try {
      await saveDiaryGoal(goal);
      setAppStatus("Цель обновлена.", "success");
      await refreshHomeFeed();
      await loadDiaryData();
      renderDiaryScreen();
    } catch (error) {
      setAppStatus(error.message || "Не удалось обновить цель.", "error");
    }
  });

  document.getElementById("diaryEntryForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      if (state.diaryEditingId) {
        await updateDiaryEntry(state.diaryEditingId, {
          content: formData.get("content")?.toString().trim() || "",
          emotion_tags: formData.getAll("emotion_tags").map(String),
        });
      } else {
        await createDiaryEntry({
          content: formData.get("content")?.toString().trim() || "",
          emotion_tags: formData.getAll("emotion_tags").map(String),
        });
      }
      state.diaryEditingId = null;
      setAppStatus("Запись сохранена.", "success");
      await refreshHomeFeed();
      await loadDiaryData();
      renderDiaryScreen();
    } catch (error) {
      setAppStatus(error.message || "Не удалось сохранить запись.", "error");
    }
  });

  document.getElementById("cancelDiaryEdit")?.addEventListener("click", () => {
    state.diaryEditingId = null;
    renderDiaryScreen();
  });

  appContent.querySelectorAll("[data-diary-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.diaryFilter = button.dataset.diaryFilter;
      renderDiaryScreen();
    });
  });

  appContent.querySelectorAll("[data-diary-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.diaryEditingId = button.dataset.diaryEdit;
      renderDiaryScreen();
    });
  });

  appContent.querySelectorAll("[data-diary-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteDiaryEntry(button.dataset.diaryDelete);
        if (state.diaryEditingId === button.dataset.diaryDelete) {
          state.diaryEditingId = null;
        }
        setAppStatus("Запись удалена.", "success");
        await refreshHomeFeed();
        await loadDiaryData();
        renderDiaryScreen();
      } catch (error) {
        setAppStatus(error.message || "Не удалось удалить запись.", "error");
      }
    });
  });
}

function renderHomeScreen(data) {
  const { profile, authUser, categories, practices, banners, progress } = data;
  const categoriesMarkup = categories.length
    ? categories
        .map((item) => {
          return `
            <article
              class="category-card"
              role="button"
              tabindex="0"
              data-category-reel="${escapeHtml(item.title)}"
            >
              ${buildImageMarkup(item.image_url, item.title)}
              <span>${escapeHtml(item.title)}</span>
            </article>
          `;
        })
        .join("")
    : `
      <article class="placeholder-card">
        <h3>Категории пусты</h3>
        <p>Добавь записи в таблицу <code>categories</code>, чтобы показать тематические подборки.</p>
      </article>
    `;

  const practicesMarkup = practices.length
    ? practices
        .map((item) => {
          return `
            <article class="practice-card">
              <div class="media-thumb">
                ${buildImageMarkup(item.image_url, item.title)}
              </div>
              <div class="practice-card__content">
                <h3>${escapeHtml(item.title)}</h3>
                <div class="practice-card__tags">
                  <span>${escapeHtml(item.subtitle || "#mindbody")}</span>
                  <span>${escapeHtml(
                    `${item.duration_minutes || 0} минут`,
                  )}</span>
                  <span>${escapeHtml(item.level || "Легкий уровень")}</span>
                </div>
              </div>
            </article>
          `;
        })
        .join("")
    : `
      <article class="placeholder-card">
        <h3>Пока нет практик</h3>
        <p>Отметь нужные записи в таблице <code>practices</code> как <code>is_featured = true</code>.</p>
      </article>
    `;

  const bannersMarkup = banners.length
    ? banners
        .slice(0, 2)
        .map((item, index) => {
          const warmClass = index % 2 === 1 ? "banner-card--warm" : "";
          return `
            <article class="banner-card ${warmClass}">
              ${buildImageMarkup(item.image_url, item.title)}
              <div class="banner-card__content">
                <h3>${escapeHtml(item.title)}</h3>
              </div>
              <div class="banner-card__play">▶</div>
            </article>
          `;
        })
        .join("")
    : `
      <article class="placeholder-card">
        <h3>Баннеры еще не добавлены</h3>
        <p>Таблица <code>audio_banners</code> может хранить аудио-карточки для главного экрана.</p>
      </article>
    `;

  const weekDays = getWeekDays();
  const weekMarkup = weekDays
    .map((label, index) => {
      const dayData = progress.week[index];
      const ringClasses = [
        "week-progress__ring",
        dayData?.completed ? "is-done" : "",
        dayData?.isToday ? "is-today" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <div class="week-progress__day">
          <div class="${ringClasses}"></div>
          <span>${label}</span>
        </div>
      `;
    })
    .join("");

  appContent.innerHTML = `
    <section class="home-screen">
      <header class="home-header">
        <div>
          <h1>Главная страница</h1>
        </div>
        ${getAvatarMarkup(profile, authUser)}
      </header>

      <section class="horizontal-scroll" aria-label="Категории">
        ${categoriesMarkup}
      </section>

      <section class="welcome-block">
        <h2>${escapeHtml(getGreeting(profile))}</h2>
        <p>${escapeHtml(formatTodaySubtitle())}</p>
      </section>

      <section class="quick-actions" aria-label="Быстрые действия">
        <button class="quick-action quick-action--green" type="button">🍃 Тревожная кнопка</button>
        <button class="quick-action" type="button">✍️ Сделай запись в дневнике эмоций</button>
        <button class="quick-action" type="button">✅ Тест на тревожность</button>
      </section>

      <section>
        <div class="section-title">
          <h2>Практики для тебя</h2>
          <button type="button">Показать все</button>
        </div>
        <div class="cards-row">
          ${practicesMarkup}
        </div>
      </section>

      <section class="banners-grid">
        ${bannersMarkup}
      </section>

      <section class="progress-card">
        <p class="progress-card__value">${escapeHtml(
          formatWordsCount(progress.todayWords),
        )}</p>
        <p class="progress-card__goal">
          Цель - ${escapeHtml(String(progress.goalWords))} слов в дневнике эмоций
        </p>
        <span class="progress-card__link">изменить цель</span>
        <div class="week-progress">
          ${weekMarkup}
        </div>
      </section>
    </section>
  `;

  const categoryCards = appContent.querySelectorAll("[data-category-reel]");
  categoryCards.forEach((card, index) => {
    const category = categories[index];

    card.addEventListener("click", () => {
      openReel(category);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openReel(category);
      }
    });
  });
}

function renderTabScreen(tabName) {
  if (state.isAdminMode) {
    renderAdminScreen();
    return;
  }

  if (tabName === "home") {
    if (state.homeState === "loading") {
      renderLoadingState("Подтягиваем профиль, карточки и дневной прогресс.");
      return;
    }

    if (state.homeState === "error") {
      renderErrorState(
        "Проверь таблицы Supabase, политики доступа и подключение к сети.",
      );
      return;
    }

    if (state.homeState === "empty") {
      renderEmptyHome(state.profile, state.session?.user);
      return;
    }

    renderHomeScreen({
      ...state.homeFeed,
      profile: state.profile,
      authUser: state.session?.user,
    });
    return;
  }

  const titles = {
    practices: "Практики",
    diary: "Дневник",
    places: "Места",
    profile: "Профиль",
  };

  const descriptions = {
    practices: "Здесь появятся полные подборки упражнений, звуков и курсов.",
    diary: "Личное пространство записей, целей и эмоциональных наблюдений.",
    places: "Раздел мест можно наполнить безопасными пространствами и точками восстановления.",
    profile:
      "Профиль уже связан с Supabase и может показывать данные пользователя, настройки и выход.",
  };

  if (tabName === "diary") {
    renderDiaryScreen();
    return;
  }

  const extraContent =
    tabName === "profile"
      ? `
        <section class="placeholder-card">
          <h3>${escapeHtml(getGreeting(state.profile))}</h3>
          <p>${escapeHtml(state.profile?.email || state.session?.user?.email || "")}</p>
        </section>
        <div class="profile-actions">
          <button class="secondary-button" type="button" id="refreshHomeButton">Обновить главную</button>
          <button class="secondary-button" type="button" id="logoutButton">Выйти из аккаунта</button>
        </div>
      `
      : `
        <div class="tab-grid">
          <section class="placeholder-card">
            <h3>Раздел в работе</h3>
            <p>${escapeHtml(descriptions[tabName])}</p>
          </section>
          <section class="placeholder-card">
            <h3>Навигация готова</h3>
            <p>Нижний таббар уже переключает настоящие экраны без перезагрузки.</p>
          </section>
        </div>
      `;

  appContent.innerHTML = `
    <section class="tab-screen">
      <header class="tab-header">
        <div>
          <h1>${escapeHtml(titles[tabName])}</h1>
        </div>
        ${getAvatarMarkup(state.profile, state.session?.user)}
      </header>
      ${extraContent}
    </section>
  `;

  const refreshButton = document.getElementById("refreshHomeButton");
  const logoutButton = document.getElementById("logoutButton");

  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      setAppStatus("Обновляем контент главной страницы...");
      await refreshHomeFeed();
      setAppStatus("Данные обновлены.", "success");
      navigateTo("home");
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await logout();
    });
  }
}

async function loadAdminData() {
  const authUser = state.session?.user;

  if (!authUser?.id) {
    throw new Error("Для админки нужна активная сессия.");
  }

  if (state.apiToken) {
    const payload = await apiRequest("/api/admin/content");
    const usersPayload = isSuperAdminUser()
      ? await apiRequest("/api/admin/users")
      : { users: [] };

    state.adminData = {
      categories: payload.categories || [],
      practices: payload.practices || [],
      banners: payload.banners || [],
      users: usersPayload.users || [],
    };
    return;
  }

  const [categories, practices, banners] = await Promise.all([
    safeSelect(
      () =>
        supabaseClient
          .from("categories")
          .select("id, title, image_url, video_url, reel_text, sort_order, is_active")
          .order("sort_order", { ascending: true }),
      [],
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("practices")
          .select(
            "id, title, subtitle, duration_minutes, level, image_url, is_featured, sort_order",
          )
          .order("sort_order", { ascending: true }),
      [],
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("audio_banners")
          .select("id, title, image_url, theme, sort_order, is_active")
          .order("sort_order", { ascending: true }),
      [],
    ),
  ]);

  state.adminData = {
    categories,
    practices,
    banners,
    users: [],
  };
}

function getAdminSelection(sectionName, id) {
  return state.adminData[sectionName].find((item) => item.id === id) || null;
}

function resetAdminSelection(sectionName) {
  state.adminSelections[sectionName] = null;
}

async function createAdminUser(formData) {
  await apiRequest("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: formData.get("email")?.toString().trim() || "",
      password: formData.get("password")?.toString() || "",
      first_name: formData.get("first_name")?.toString().trim() || "",
      second_name: formData.get("second_name")?.toString().trim() || "",
    }),
  });

  await loadAdminData();
}

async function enterAdminMode() {
  if (!isAdminUser()) {
    setAppStatus("Доступ к админке разрешен только администратору.", "error");
    return;
  }

  state.isAdminMode = true;
  state.adminSection = "dashboard";
  updateAdminToggleButtons();
  updateNavigationVisibility();
  setAppStatus("Загружаем данные админки...");
  await loadAdminData();
  setAppStatus("Админка готова.", "success");
  renderAdminScreen();
}

function exitAdminMode() {
  if (isAdminUser()) {
    return;
  }

  state.isAdminMode = false;
  updateAdminToggleButtons();
  updateNavigationVisibility();
  setAppStatus("");
  navigateTo(state.currentTab || "home");
}

function sanitizeAdminPayload(sectionName, formData) {
  if (sectionName === "categories") {
    return {
      title: formData.get("title")?.toString().trim(),
      image_url: formData.get("image_url")?.toString().trim() || null,
      video_url: formData.get("video_url")?.toString().trim() || null,
      reel_text: formData.get("reel_text")?.toString().trim() || null,
      sort_order: Number(formData.get("sort_order") || 0),
      is_active: formData.get("is_active") === "on",
    };
  }

  if (sectionName === "practices") {
    return {
      title: formData.get("title")?.toString().trim(),
      subtitle: formData.get("subtitle")?.toString().trim() || null,
      duration_minutes: Number(formData.get("duration_minutes") || 0),
      level: formData.get("level")?.toString().trim() || null,
      image_url: formData.get("image_url")?.toString().trim() || null,
      sort_order: Number(formData.get("sort_order") || 0),
      is_featured: formData.get("is_featured") === "on",
    };
  }

  if (sectionName === "banners") {
    return {
      title: formData.get("title")?.toString().trim(),
      theme: formData.get("theme")?.toString().trim() || null,
      image_url: formData.get("image_url")?.toString().trim() || null,
      sort_order: Number(formData.get("sort_order") || 0),
      is_active: formData.get("is_active") === "on",
    };
  }

  return {
    user_id: state.session?.user?.id,
    date: formData.get("date"),
    words_count: Number(formData.get("words_count") || 0),
    goal_words: Number(formData.get("goal_words") || 110),
  };
}

async function saveAdminRecord(sectionName, formElement) {
  const config = ADMIN_SECTIONS[sectionName];
  const formData = new FormData(formElement);
  const id = formData.get("id")?.toString().trim();
  const payload = sanitizeAdminPayload(sectionName, formData);

  if (isTelegramSession()) {
    if (id) {
      await apiRequest(`/api/admin/${sectionName}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await apiRequest(`/api/admin/${sectionName}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    resetAdminSelection(sectionName);
    await loadAdminData();
    await refreshHomeFeed();
    renderAdminScreen();
    return;
  }

  if (id) {
    const { error } = await withTimeout(
      supabaseClient.from(config.table).update(payload).eq("id", id),
      "Истекло время ожидания сохранения записи.",
    );

    if (error) {
      throw error;
    }
  } else {
    const { error } = await withTimeout(
      supabaseClient.from(config.table).insert(payload),
      "Истекло время ожидания создания записи.",
    );

    if (error) {
      throw error;
    }
  }

  resetAdminSelection(sectionName);
  await loadAdminData();
  await refreshHomeFeed();
  renderAdminScreen();
}

async function deleteAdminRecord(sectionName, id) {
  const config = ADMIN_SECTIONS[sectionName];

  if (isTelegramSession()) {
    await apiRequest(`/api/admin/${sectionName}/${id}`, {
      method: "DELETE",
    });

    resetAdminSelection(sectionName);
    await loadAdminData();
    await refreshHomeFeed();
    renderAdminScreen();
    return;
  }

  const { error } = await withTimeout(
    supabaseClient.from(config.table).delete().eq("id", id),
    "Истекло время ожидания удаления записи.",
  );

  if (error) {
    throw error;
  }

  resetAdminSelection(sectionName);
  await loadAdminData();
  await refreshHomeFeed();
  renderAdminScreen();
}

function bindAdminScreenEvents() {
  const refreshButton = document.getElementById("adminRefreshButton");
  const adminForms = appContent.querySelectorAll("[data-admin-form]");
  const editButtons = appContent.querySelectorAll("[data-admin-edit]");
  const deleteButtons = appContent.querySelectorAll("[data-admin-delete]");
  const cancelButtons = appContent.querySelectorAll("[data-admin-cancel]");

  refreshButton?.addEventListener("click", async () => {
    setAppStatus("Обновляем данные админки...");
    await loadAdminData();
    await refreshHomeFeed();
    renderAdminScreen();
    setAppStatus("Данные админки обновлены.", "success");
  });

  adminForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const sectionName = form.dataset.adminForm;
      setAppStatus("Сохраняем изменения...");

      try {
        await saveAdminRecord(sectionName, form);
        setAppStatus("Изменения сохранены.", "success");
      } catch (error) {
        setAppStatus(
          error.message || "Не удалось сохранить запись. Проверь RLS policy и права.",
          "error",
        );
      }
    });
  });

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sectionName = button.dataset.adminEdit;
      const id = button.dataset.id;
      state.adminSelections[sectionName] = getAdminSelection(sectionName, id);
      renderAdminScreen();
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const sectionName = button.dataset.adminDelete;
      const id = button.dataset.id;
      setAppStatus("Удаляем запись...");

      try {
        await deleteAdminRecord(sectionName, id);
        setAppStatus("Запись удалена.", "success");
      } catch (error) {
        setAppStatus(
          error.message || "Не удалось удалить запись. Проверь RLS policy и права.",
          "error",
        );
      }
    });
  });

  cancelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      resetAdminSelection(button.dataset.adminCancel);
      renderAdminScreen();
    });
  });
}

function navigateTo(tabName) {
  if (isAdminUser()) {
    state.isAdminMode = true;
    state.adminSection = tabName === "profile" ? "profile" : "dashboard";
    updateAdminToggleButtons();
    updateNavigationVisibility();
    renderAdminScreen();
    return;
  }

  state.currentTab = tabName;
  state.isAdminMode = false;
  updateAdminToggleButtons();
  updateNavigationVisibility();

  bottomNavButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });

  renderTabScreen(tabName);
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.session;
}

async function loginWithTelegram() {
  const webApp = getTelegramWebApp();

  if (!webApp?.initData) {
    throw new Error("Открой приложение внутри Telegram, чтобы войти этим способом.");
  }

  const { token, profile } = await apiRequest("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify({
      initData: webApp.initData,
    }),
  });

  state.authMode = "telegram";
  state.apiToken = token;
  state.profile = profile;
  return buildPseudoSession(profile);
}

async function createBackendSessionFromSupabase(session) {
  if (!session?.access_token) {
    return null;
  }

  const { token, profile } = await apiRequest("/api/auth/session", {
    method: "POST",
    body: JSON.stringify({
      accessToken: session.access_token,
    }),
  });

  state.apiToken = token;
  state.profile = profile;
  return token;
}

async function register(email, password, firstName, secondName) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        second_name: secondName || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error("Не удалось получить id пользователя после регистрации.");
  }

  const { error: profileError } = await supabaseClient.from("user").upsert({
    id: userId,
    email,
    first_name: firstName,
    second_name: secondName || null,
    is_admin: false,
    is_super_admin: false,
  });

  if (profileError) {
    throw profileError;
  }

  return data.session;
}

async function resetPassword(email) {
  const redirectTo = getPasswordResetRedirect();
  const options = redirectTo ? { redirectTo } : undefined;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(
    email,
    options,
  );

  if (error) {
    throw error;
  }
}

async function logout() {
  if (!isTelegramSession()) {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      setAppStatus(error.message || "Не удалось выйти.", "error");
      return;
    }
  }

  state.authMode = "supabase";
  state.apiToken = "";
  state.session = null;
  state.profile = null;
  state.homeFeed = null;
  state.homeState = "loading";
  state.diaryData = null;
  state.diaryFilter = "all";
  state.diaryEditingId = null;
  state.isAdminMode = false;
  state.adminSection = "dashboard";
  pageShell.classList.remove("is-app-mode");
  appView.classList.add("is-hidden");
  authView.classList.remove("is-hidden");
  setActiveAuthScreen("login");
  setAuthStatus("Вы вышли из аккаунта.");
  updateAdminToggleButtons();
  updateNavigationVisibility();
}

async function loadCurrentUserProfile() {
  const authUser = state.session?.user;

  if (!authUser?.id) {
    throw new Error("Сессия пользователя не найдена.");
  }

  if (isTelegramSession()) {
    const payload = await apiRequest("/api/profile");
    return payload.profile || state.profile;
  }

  const { data, error } = await withTimeout(
    supabaseClient
      .from("user")
      .select(
        "id, email, first_name, second_name, created_at, avatar_url, auth_provider, is_admin, is_super_admin",
      )
      .eq("id", authUser.id)
      .maybeSingle(),
    "Истекло время ожидания профиля пользователя.",
  );

  if (error) {
    throw error;
  }

  return (
    data || {
      id: authUser.id,
      email: authUser.email,
      first_name: authUser.user_metadata?.first_name || "",
      second_name: authUser.user_metadata?.second_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      auth_provider: authUser.user_metadata?.auth_provider || "email",
      is_admin: Boolean(authUser.user_metadata?.is_admin),
      is_super_admin: Boolean(authUser.user_metadata?.is_super_admin),
      created_at: authUser.created_at || null,
    }
  );
}

async function safeSelect(builderFactory, fallbackValue) {
  try {
    const { data, error } = await withTimeout(
      builderFactory(),
      "Истекло время ожидания данных главной страницы.",
    );

    if (error) {
      console.warn(error.message);
      return fallbackValue;
    }

    return data ?? fallbackValue;
  } catch (error) {
    console.warn(error);
    return fallbackValue;
  }
}

function normalizeProgress(rows) {
  const today = new Date();
  const mondayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayIndex);

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const iso = day.toISOString().slice(0, 10);
    const row = rows.find((item) => item.date === iso);

    return {
      date: iso,
      completed: Boolean((row?.words_count || 0) > 0),
      words: row?.words_count || 0,
      goal: row?.goal_words || 110,
      isToday: iso === today.toISOString().slice(0, 10),
    };
  });

  const todayEntry = week.find((item) => item.isToday);

  return {
    todayWords: todayEntry?.words || 0,
    goalWords: todayEntry?.goal || 110,
    week,
  };
}

async function loadDiaryData() {
  const authUser = state.session?.user;

  if (!authUser?.id) {
    throw new Error("Для дневника нужна активная сессия.");
  }

  if (isTelegramSession()) {
    state.diaryData = await apiRequest("/api/diary");
    return state.diaryData;
  }

  const [goalRow, entries] = await Promise.all([
    safeSelect(
      () =>
        supabaseClient
          .from("journal_goals")
          .select("id, user_id, daily_word_goal, updated_at")
          .eq("user_id", authUser.id)
          .maybeSingle(),
      null,
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("journal_entries")
          .select("id, user_id, content, word_count, emotion_tags, created_at, updated_at")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false }),
      [],
    ),
  ]);

  state.diaryData = {
    goal: goalRow?.daily_word_goal || DEFAULT_HOME_CONTENT.diary.goal,
    entries: entries.length ? entries : DEFAULT_HOME_CONTENT.diary.entries,
  };

  return state.diaryData;
}

async function saveDiaryGoal(goal) {
  const authUser = state.session?.user;

  if (isTelegramSession()) {
    await apiRequest("/api/diary/goal", {
      method: "PUT",
      body: JSON.stringify({
        goal_words: goal,
      }),
    });
    return;
  }

  const payload = {
    user_id: authUser.id,
    daily_word_goal: goal,
  };

  const { error } = await withTimeout(
    supabaseClient.from("journal_goals").upsert(payload, { onConflict: "user_id" }),
    "Истекло время ожидания сохранения цели дневника.",
  );

  if (error) {
    throw error;
  }
}

async function createDiaryEntry({ content, emotion_tags }) {
  const authUser = state.session?.user;

  if (isTelegramSession()) {
    await apiRequest("/api/diary/entries", {
      method: "POST",
      body: JSON.stringify({
        content,
        emotion_tags,
      }),
    });
    return;
  }

  const payload = {
    user_id: authUser.id,
    content,
    word_count: countWords(content),
    emotion_tags,
  };

  const { error } = await withTimeout(
    supabaseClient.from("journal_entries").insert(payload),
    "Истекло время ожидания сохранения записи дневника.",
  );

  if (error) {
    throw error;
  }
}

async function updateDiaryEntry(id, { content, emotion_tags }) {
  if (isTelegramSession()) {
    await apiRequest(`/api/diary/entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        content,
        emotion_tags,
      }),
    });
    return;
  }

  const payload = {
    content,
    word_count: countWords(content),
    emotion_tags,
    updated_at: new Date().toISOString(),
  };

  const { error } = await withTimeout(
    supabaseClient.from("journal_entries").update(payload).eq("id", id),
    "Истекло время ожидания обновления записи дневника.",
  );

  if (error) {
    throw error;
  }
}

async function deleteDiaryEntry(id) {
  if (isTelegramSession()) {
    await apiRequest(`/api/diary/entries/${id}`, {
      method: "DELETE",
    });
    return;
  }

  const { error } = await withTimeout(
    supabaseClient.from("journal_entries").delete().eq("id", id),
    "Истекло время ожидания удаления записи дневника.",
  );

  if (error) {
    throw error;
  }
}

function mergeHomeFeedWithDefaults(feed) {
  const mergedProgress = {
    ...DEFAULT_HOME_CONTENT.progress,
    ...(feed.progress || {}),
  };

  if (!feed.progress?.week?.length) {
    mergedProgress.week = DEFAULT_HOME_CONTENT.progress.week;
  }

  return {
    categories: feed.categories.length ? feed.categories : DEFAULT_HOME_CONTENT.categories,
    practices: feed.practices.length ? feed.practices : DEFAULT_HOME_CONTENT.practices,
    banners: feed.banners.length ? feed.banners : DEFAULT_HOME_CONTENT.banners,
    progress: mergedProgress,
  };
}

async function loadHomeFeed() {
  const authUser = state.session?.user;

  if (!authUser?.id) {
    throw new Error("Нужно авторизоваться перед загрузкой главной страницы.");
  }

  if (isTelegramSession()) {
    const payload = await apiRequest("/api/home");
    if (payload.profile) {
      state.profile = payload.profile;
    }

    return mergeHomeFeedWithDefaults({
      categories: payload.categories || [],
      practices: payload.practices || [],
      banners: payload.banners || [],
      progress: payload.progress || DEFAULT_HOME_CONTENT.progress,
    });
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);
  const startIso = startDate.toISOString().slice(0, 10);

  const [categories, practices, banners, goalRow, entries] = await Promise.all([
    safeSelect(
      () =>
        supabaseClient
          .from("categories")
          .select("id, title, image_url, video_url, reel_text, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      [],
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("practices")
          .select(
            "id, title, subtitle, duration_minutes, level, image_url, is_featured, sort_order",
          )
          .eq("is_featured", true)
          .order("sort_order", { ascending: true }),
      [],
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("audio_banners")
          .select("id, title, image_url, theme, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      [],
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("journal_goals")
          .select("id, user_id, daily_word_goal, updated_at")
          .eq("user_id", authUser.id)
          .maybeSingle(),
      null,
    ),
    safeSelect(
      () =>
        supabaseClient
          .from("journal_entries")
          .select("id, user_id, created_at, word_count")
          .eq("user_id", authUser.id)
          .gte("created_at", `${startIso}T00:00:00`)
          .order("created_at", { ascending: true }),
      [],
    ),
  ]);

  const groupedByDay = entries.reduce((acc, entry) => {
    const date = entry.created_at.slice(0, 10);
    const existing = acc.get(date) || {
      date,
      words_count: 0,
      goal_words: goalRow?.daily_word_goal || DEFAULT_HOME_CONTENT.diary.goal,
    };
    existing.words_count += entry.word_count || 0;
    acc.set(date, existing);
    return acc;
  }, new Map());

  const progressRows = Array.from(groupedByDay.values());

  return mergeHomeFeedWithDefaults({
    categories,
    practices,
    banners,
    progress: normalizeProgress(progressRows),
  });
}

async function refreshHomeFeed() {
  state.homeState = "loading";

  try {
    state.profile = await loadCurrentUserProfile();
    await loadDiaryData();
    state.homeFeed = await loadHomeFeed();
    state.homeState = "ready";
  } catch (error) {
    console.error(error);
    state.profile =
      state.profile || {
        id: state.session?.user?.id || "",
        email: state.session?.user?.email || "",
        first_name: state.session?.user?.user_metadata?.first_name || "",
        second_name: state.session?.user?.user_metadata?.second_name || null,
        avatar_url: state.session?.user?.user_metadata?.avatar_url || null,
        auth_provider: state.session?.user?.user_metadata?.auth_provider || "email",
        is_admin: Boolean(state.session?.user?.user_metadata?.is_admin),
        is_super_admin: Boolean(state.session?.user?.user_metadata?.is_super_admin),
        created_at: state.session?.user?.created_at || null,
      };
    state.homeFeed = DEFAULT_HOME_CONTENT;
    state.homeState = "empty";
    setAppStatus(
      "Supabase отвечает слишком долго, поэтому показываем встроенный контент.",
      "error",
    );
  }
}

async function enterApp(session) {
  if (state.isEnteringApp) {
    return;
  }

  state.isEnteringApp = true;
  state.session = session;
  pageShell.classList.add("is-app-mode");
  authView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  renderLoadingState("Подготавливаем домашний экран...");
  setAppStatus("");

  try {
    if (!isTelegramSession()) {
      try {
        await createBackendSessionFromSupabase(session);
      } catch (error) {
        console.warn(error);
      }
    }

    await refreshHomeFeed();
    if (isAdminUser()) {
      state.isAdminMode = true;
      state.adminSection = "dashboard";
      updateAdminToggleButtons();
      updateNavigationVisibility();
      await loadAdminData();
      renderAdminScreen();
      setAppStatus("Вы вошли как администратор.", "success");
      return;
    }

    updateAdminToggleButtons();
    updateNavigationVisibility();
    navigateTo("home");
  } finally {
    state.isEnteringApp = false;
  }
}

async function handleLoginSubmit(form) {
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  state.authMode = "supabase";
  state.apiToken = "";
  const session = await login(email, password);

  setAuthStatus("Вход выполнен успешно.", "success");
  await enterApp(session);
}

async function handleTelegramLogin() {
  setAuthStatus("Проверяем Telegram Mini App...");
  const session = await loginWithTelegram();
  setAuthStatus("Вход через Telegram выполнен.", "success");
  await enterApp(session);
}

async function handleRegisterSubmit(form) {
  state.authMode = "supabase";
  state.apiToken = "";
  const password = form.elements.password.value;
  const passwordConfirmation = form.elements.passwordConfirmation.value;
  const firstName = form.elements.firstName.value.trim();
  const secondName = form.elements.lastName.value.trim();

  if (password !== passwordConfirmation) {
    throw new Error("Пароли не совпадают. Проверьте данные и попробуйте снова.");
  }

  const session = await register(
    form.elements.email.value.trim(),
    password,
    firstName,
    secondName,
  );

  setAuthStatus(
    "Аккаунт создан. Если подтверждение email отключено, вы уже внутри приложения.",
    "success",
  );

  if (session) {
    await enterApp(session);
    return;
  }

  setActiveAuthScreen("login");
}

async function handleResetSubmit(form) {
  await resetPassword(form.elements.email.value.trim());
  setAuthStatus("Письмо для восстановления отправлено. Проверьте почту.", "success");
}

async function handleAuthFormSubmit(form, event) {
  event.preventDefault();
  setAuthStatus("Отправляем запрос...");

  try {
    if (form.dataset.formName === "login") {
      await handleLoginSubmit(form);
      return;
    }

    if (form.dataset.formName === "register") {
      await handleRegisterSubmit(form);
      return;
    }

    if (form.dataset.formName === "reset") {
      await handleResetSubmit(form);
    }
  } catch (error) {
    setAuthStatus(error.message || "Что-то пошло не так. Попробуйте снова.", "error");
  }
}

screenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveAuthScreen(button.dataset.screenTarget);
  });
});

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    await handleAuthFormSubmit(form, event);
  });
});

bottomNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.tab);
  });
});

telegramLoginButton?.addEventListener("click", async () => {
  try {
    await handleTelegramLogin();
  } catch (error) {
    setAuthStatus(error.message || "Не удалось войти через Telegram.", "error");
  }
});

adminNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.adminSection = button.dataset.adminNav;
    state.isAdminMode = true;
    updateNavigationVisibility();
    renderAdminScreen();
  });
});

globalAdminToggle?.addEventListener("click", async () => {
  if (!isAdminUser() || state.isAdminMode) {
    return;
  }

  await enterAdminMode();
});

sidebarAdminToggle?.addEventListener("click", async () => {
  if (!isAdminUser() || state.isAdminMode) {
    return;
  }

  await enterAdminMode();
});

reelCloseButton?.addEventListener("click", () => {
  closeReel();
});

reelOverlay?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.reelClose === "true") {
    closeReel();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.activeReel) {
    closeReel();
  }
});

supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (isTelegramSession()) {
    return;
  }

  if (event === "SIGNED_OUT") {
    return;
  }

  if (session?.user) {
    state.session = session;

    if (appView.classList.contains("is-hidden")) {
      await enterApp(session);
    }
  }
});

async function bootstrap() {
  setActiveAuthScreen("login");
  updateTelegramAuthUi();
  updateAdminToggleButtons();
  updateNavigationVisibility();

  const telegramWebApp = getTelegramWebApp();
  telegramWebApp?.ready?.();
  telegramWebApp?.expand?.();

  if (isTelegramRuntime()) {
    try {
      await handleTelegramLogin();
      return;
    } catch (error) {
      setAuthStatus(
        error.message || "Не удалось выполнить автоматический вход через Telegram.",
        "error",
      );
    }
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    await enterApp(session);
  }
}

bootstrap();
