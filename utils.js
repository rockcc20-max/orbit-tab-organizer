export const MANAGER_PATH = "/manager.html";

const SITE_NAMES = [
  ["perplexity.ai", "Perplexity"],
  ["gemini.google.com", "Gemini"],
  ["chatgpt.com", "ChatGPT"],
  ["chat.openai.com", "ChatGPT"],
  ["openai.com", "OpenAI"],
  ["claude.ai", "Claude"],
  ["docs.google.com", "Google Docs"],
  ["drive.google.com", "Google Drive"],
  ["notion.so", "Notion"],
  ["figma.com", "Figma"],
  ["github.com", "GitHub"],
  ["gitlab.com", "GitLab"],
  ["tailwindcss.com", "Tailwind CSS"],
  ["tradingview.com", "TradingView"],
  ["coingecko.com", "CoinGecko"],
  ["coinmarketcap.com", "CoinMarketCap"],
  ["x.com", "X"],
  ["twitter.com", "X"],
  ["slack.com", "Slack"],
  ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"],
  ["medium.com", "Medium"],
  ["gmail.com", "Gmail"],
  ["mail.google.com", "Gmail"],
  ["google.com", "Google"],
  ["project.larksuite.com", "Meegle", { hostScoped: true }],
  ["project.feishu.cn", "Feishu Project", { hostScoped: true }],
  ["larksuite.com", "Lark", { hostScoped: true, tenantName: "Lark Docs" }],
  ["feishu.cn", "Feishu", { hostScoped: true, tenantName: "Feishu Docs" }],
  ["okx.com", "OKX"],
  ["linkedin.com", "LinkedIn"],
  ["reddit.com", "Reddit"],
  ["bilibili.com", "哔哩哔哩"]
];

const SITE_LABELS = {
  "zh-CN": {
    unknown: "未命名网站", browser: "浏览器页面", local: "本地文件", newTab: "新标签页",
    "Lark Docs": "Lark 云文档", "Feishu": "飞书", "Feishu Docs": "飞书云文档",
    "Feishu Project": "飞书项目", "哔哩哔哩": "哔哩哔哩"
  },
  en: {
    unknown: "Unnamed website", browser: "Browser page", local: "Local file", newTab: "New tab",
    "Lark Docs": "Lark Docs", "Feishu": "Feishu", "Feishu Docs": "Feishu Docs",
    "Feishu Project": "Feishu Project", "哔哩哔哩": "bilibili"
  },
  ko: {
    unknown: "이름 없는 웹사이트", browser: "브라우저 페이지", local: "로컬 파일", newTab: "새 탭",
    "Lark Docs": "Lark 문서", "Feishu": "Feishu", "Feishu Docs": "Feishu 문서",
    "Feishu Project": "Feishu 프로젝트", "哔哩哔哩": "bilibili"
  },
  ja: {
    unknown: "名前のないサイト", browser: "ブラウザのページ", local: "ローカルファイル", newTab: "新しいタブ",
    "Lark Docs": "Lark ドキュメント", "Feishu": "Feishu", "Feishu Docs": "Feishu ドキュメント",
    "Feishu Project": "Feishu プロジェクト", "哔哩哔哩": "bilibili"
  }
};

const SITE_SEARCH_ALIASES = {
  "Meegle": ["Lark Project", "Lark 项目"],
  "Feishu Project": ["飞书项目"],
  "Lark Docs": ["Lark 云文档", "Lark 文档"],
  "Feishu Docs": ["飞书云文档", "飞书文档"],
  "OKX": ["欧易"]
};

function siteLabels(locale = "zh-CN") {
  const language = String(locale).toLowerCase().split(/[-_]/)[0];
  return SITE_LABELS[language === "zh" ? "zh-CN" : language] || SITE_LABELS.en;
}

const CATEGORY_RULES = [
  {
    key: "ai",
    label: "AI 工具",
    color: "purple",
    hosts: [
      "openai.com", "chatgpt.com", "claude.ai", "perplexity.ai", "gemini.google.com",
      "poe.com", "huggingface.co", "copilot.microsoft.com", "midjourney.com", "grok.com"
    ],
    words: ["artificial intelligence", "machine learning", "llm", "chatgpt", "claude", "gemini", "perplexity"]
  },
  {
    key: "docs",
    label: "文档与知识库",
    color: "cyan",
    hosts: [
      "docs.google.com", "drive.google.com", "notion.so", "coda.io", "airtable.com",
      "office.com", "onedrive.live.com", "dropbox.com", "feishu.cn", "larksuite.com", "yuque.com"
    ],
    words: ["google docs", "google sheets", "google slides", "document", "spreadsheet", "notion", "知识库", "文档"]
  },
  {
    key: "design",
    label: "设计与创意",
    color: "pink",
    hosts: ["figma.com", "canva.com", "framer.com", "miro.com", "adobe.com", "behance.net", "dribbble.com", "iconfont.cn"],
    words: ["figma", "design", "prototype", "wireframe", "设计", "原型"]
  },
  {
    key: "build",
    label: "开发与技术",
    color: "blue",
    hosts: [
      "github.com", "gitlab.com", "stackoverflow.com", "vercel.com", "netlify.com", "localhost",
      "npmjs.com", "developer.mozilla.org", "codepen.io", "codesandbox.io", "replit.com"
    ],
    words: ["documentation", "developer", "api reference", "npm", "github", "code", "docs"]
  },
  {
    key: "money",
    label: "行情与金融",
    color: "green",
    hosts: [
      "tradingview.com", "coinmarketcap.com", "coingecko.com", "binance.com", "okx.com",
      "bitget.com", "bloomberg.com", "reuters.com", "wsj.com", "finance.yahoo.com"
    ],
    words: ["market", "crypto", "stock", "portfolio", "finance", "bitcoin", "行情", "交易"]
  },
  {
    key: "social",
    label: "沟通与社交",
    color: "orange",
    hosts: [
      "x.com", "twitter.com", "linkedin.com", "discord.com", "slack.com", "reddit.com",
      "web.telegram.org", "web.whatsapp.com", "mail.google.com", "outlook.live.com"
    ],
    words: ["inbox", "messages", "community", "gmail", "mail", "消息"]
  },
  {
    key: "research",
    label: "阅读与研究",
    color: "cyan",
    hosts: ["wikipedia.org", "medium.com", "substack.com", "arxiv.org", "researchgate.net", "news.ycombinator.com"],
    words: ["research", "report", "whitepaper", "analysis", "article", "研究", "报告"]
  },
  {
    key: "media",
    label: "影音媒体",
    color: "orange",
    hosts: ["youtube.com", "spotify.com", "netflix.com", "bilibili.com", "music.apple.com"],
    words: ["watch", "video", "music", "podcast"]
  },
  {
    key: "shopping",
    label: "购物与服务",
    color: "pink",
    hosts: ["amazon.com", "taobao.com", "tmall.com", "jd.com", "ebay.com", "shopify.com", "trip.com", "booking.com"],
    words: ["shopping", "cart", "order", "购物车", "订单"]
  },
  {
    key: "web",
    label: "搜索与浏览",
    color: "grey",
    hosts: ["google.com", "bing.com", "baidu.com", "duckduckgo.com", "browser"],
    words: ["google search", "搜索结果", "new tab"]
  }
];

export function safeUrl(value = "") {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isManageableUrl(value = "") {
  const url = safeUrl(value);
  return Boolean(url && ["http:", "https:", "file:"].includes(url.protocol));
}

export function isOrbitUrl(value = "", managerUrl) {
  const url = safeUrl(value);
  const manager = safeUrl(managerUrl || globalThis.chrome?.runtime?.getURL?.("manager.html"));
  // Extension URLs have a null URL.origin, so compare protocol and host explicitly.
  return Boolean(url && manager &&
    url.protocol === manager.protocol &&
    url.host === manager.host &&
    url.username === manager.username &&
    url.password === manager.password &&
    url.pathname === manager.pathname);
}

export function normalizeUrl(value = "") {
  const url = safeUrl(value);
  // Closing a tab must not assume that routes, query parameters, subdomains,
  // or trailing slashes are interchangeable. Use only the URL standard's
  // canonicalization (for example, host casing and a default port).
  return url ? url.href : String(value ?? "").trim();
}

export function getDisplayHost(value = "", locale = "zh-CN") {
  const url = safeUrl(value);
  const labels = siteLabels(locale);
  if (!url) return labels.newTab;
  if (["chrome:", "edge:", "about:"].includes(url.protocol)) return labels.browser;
  if (url.protocol === "file:") return labels.local;
  return url.host.replace(/^www\./, "") || labels.browser;
}

function knownSiteForUrl(url) {
  if (!url || !["http:", "https:"].includes(url.protocol) || url.port) return null;
  // The most specific match keeps Google products separate from Google Search.
  return SITE_NAMES
    .filter(([domain]) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    .sort((a, b) => b[0].length - a[0].length)[0] || null;
}

function knownSiteName(url, knownSite) {
  if (!knownSite) return null;
  const [domain, name, options] = knownSite;
  // The suite home page is its brand; a tenant host is its document workspace.
  return options?.tenantName && url.hostname !== domain && url.hostname !== `www.${domain}`
    ? options.tenantName
    : name;
}

export function getSiteName(value = "", locale = "zh-CN") {
  const url = safeUrl(value);
  const labels = siteLabels(locale);
  if (!url) return labels.unknown;
  if (["chrome:", "edge:", "about:"].includes(url.protocol)) return labels.browser;
  if (url.protocol === "file:") return labels.local;
  const knownSite = knownSiteForUrl(url);
  const name = knownSiteName(url, knownSite);
  return labels[name] || name || url.host || url.protocol.replace(/:$/, "");
}

export function getSiteKey(value = "") {
  const url = safeUrl(value);
  if (!url) return `unknown:${String(value ?? "")}`;
  if (["chrome:", "edge:", "about:"].includes(url.protocol)) return "browser";
  if (url.protocol === "file:") return "local file";
  const knownSite = knownSiteForUrl(url);
  // Friendly labels must not collapse separate tenant workspaces or products.
  // This identity is deliberately independent of the selected UI language.
  if (knownSite?.[2]?.hostScoped) return `host:${url.host}`;
  if (knownSite) return knownSite[1].toLowerCase();

  // Without a public suffix list, full hosts are safer than guessing a root
  // domain: alice.github.io and bob.github.io are independent websites.
  return ["http:", "https:"].includes(url.protocol)
    ? `host:${url.host}`
    : `${url.protocol}//${url.host}`;
}

export function matchesQuery(tab, query, locale = "zh-CN") {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  const url = safeUrl(tab.url);
  const name = knownSiteName(url, knownSiteForUrl(url));
  const aliases = name ? [name, ...(SITE_SEARCH_ALIASES[name] || []),
    ...Object.values(SITE_LABELS).map((labels) => labels[name])] : [];
  return [tab.title, tab.url, getDisplayHost(tab.url, locale), getSiteName(tab.url, locale), ...aliases]
    .filter(Boolean)
    .some((value) => value.toLocaleLowerCase().includes(needle));
}

export function classifyTab(tab) {
  const host = getSiteKey(tab.url) === "browser" ? "browser" : getDisplayHost(tab.url).toLowerCase();
  const title = (tab.title || "").toLowerCase();
  const match = CATEGORY_RULES.find((rule) =>
    rule.hosts.some((item) => host === item || host.endsWith(`.${item}`)) ||
    rule.words.some((word) => title.includes(word))
  );

  return match || { key: "other", label: "其他网页", color: "grey" };
}

export function findDuplicateTabIds(tabs, managerUrl) {
  const groups = new Map();

  tabs
    .filter((tab) => isManageableUrl(tab.url) && !isOrbitUrl(tab.url, managerUrl) &&
      (!tab.pendingUrl || normalizeUrl(tab.pendingUrl) === normalizeUrl(tab.url)))
    .forEach((tab) => {
      const key = JSON.stringify([Boolean(tab.incognito), tab.cookieStoreId || "", normalizeUrl(tab.url)]);
      const current = groups.get(key) || [];
      current.push(tab);
      groups.set(key, current);
    });

  const duplicateIds = [];
  groups.forEach((matches) => {
    if (matches.length < 2) return;
    const isProtected = (tab) => tab.pinned || tab.active || tab.audible || tab.status === "loading";
    const candidates = matches
      .filter((tab) => !isProtected(tab))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    // Keep every tab in use; when none is protected, keep the most recent one.
    const toClose = matches.some(isProtected) ? candidates : candidates.slice(1);
    duplicateIds.push(...toClose.map((tab) => tab.id));
  });

  return duplicateIds;
}

export function formatRelativeTime(timestamp, now = Date.now()) {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(timestamp);
}

export function snapshotFromWindow(browserWindow, name) {
  const tabs = (browserWindow.tabs || [])
    .filter((tab) => isManageableUrl(tab.url) && !isOrbitUrl(tab.url))
    .map((tab) => ({ title: tab.title || getDisplayHost(tab.url), url: tab.url, pinned: Boolean(tab.pinned) }));

  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    tabs
  };
}

export function groupableCategories(tabs) {
  const result = new Map();
  tabs
    .filter((tab) =>
      !tab.pinned &&
      (tab.groupId === undefined || tab.groupId === -1) &&
      isManageableUrl(tab.url) &&
      !isOrbitUrl(tab.url)
    )
    .forEach((tab) => {
      const category = classifyTab(tab);
      if (category.key === "other") return;
      const current = result.get(category.key) || { ...category, tabIds: [] };
      current.tabIds.push(tab.id);
      result.set(category.key, current);
    });

  return [...result.values()].filter((category) => category.tabIds.length >= 2);
}
