(function () {
  "use strict";

  var STORAGE_KEY = "yongki_setup_v1";
  var ENTRIES_KEY = "yongki_entries_v1";
  var KEYWORDS_KEY = "yongki_keywords_v1";
  var KEYWORDS_EXPENSE_KEY = "yongki_keywords_expense_v1";
  var KEYWORDS_INCOME_KEY = "yongki_keywords_income_v1";
  var ARCHIVES_KEY = "yongki_archives_v1";
  var BADGES_KEY = "yongki_badges_v1";
  var VISIT_DAYS_KEY = "yongki_visit_days_v1";
  var LEDGER_RECENT_VIEW_KEY = "yongki_ledger_recent_view_v1";

  /** localStorage JSON — __proto__/constructor 키로 인한 프로토타입 오염 완화 */
  function parseJsonSafe(text) {
    if (text == null || text === "") return null;
    try {
      return JSON.parse(String(text), function (key, val) {
        if (key === "__proto__" || key === "constructor") return undefined;
        return val;
      });
    } catch (e) {
      return null;
    }
  }

  var DEFAULT_KEYWORDS = ["문구점", "편의점", "PC방"];
  var DEFAULT_KEYWORDS_INCOME = ["용돈", "알바", "세뱃돈"];

  /** @typedef {{ id: string, category: string, name: string, trigger: string, insight: string, image: string }} BadgeDef */

  /** @type {BadgeDef[]} */
  var BADGE_DEFINITIONS = [
    {
      id: "catcsm",
      category: "지출/절약",
      name: "신중한 소비자",
      image: "badges/catcsm.png",
      trigger: "필요한 것만 5회 연속 기록 시",
      insight: "충동구매 억제 및 만족도 높은 소비 지향",
    },
    {
      id: "manhpy",
      category: "지출/절약",
      name: "만원의 행복",
      image: "badges/manhpy.png",
      trigger: "일주일간 ‘갖고 싶던 것’ 지출액수 만원 이하",
      insight: "자잘한 물건, 군것질 지출 통제 능력 배양",
    },
    {
      id: "stpgod",
      category: "지출/절약",
      name: "지름신 멈춰!",
      image: "badges/stpgod.png",
      trigger: "주말(토, 일) 지출 0건 발생 시",
      insight: "유혹이 많은 시기의 절제력 강화",
    },
    {
      id: "fstbtn",
      category: "저축/목표",
      name: "첫 단추 완료",
      image: "badges/fstbtn.png",
      trigger: "목표 금액의 50% 달성 시",
      insight: "중간 지점 도달을 통한 지속 동기 부여",
    },
    {
      id: "tgthnt",
      category: "저축/목표",
      name: "목표 사냥꾼",
      image: "badges/tgthnt.png",
      trigger: "첫 목표 달성 후 서랍 저장 시",
      insight: "저축의 완결을 통한 성공 경험 제공",
    },
    {
      id: "frsoul",
      category: "저축/목표",
      name: "자유로운 영혼",
      image: "badges/frsoul.png",
      trigger: "자유기록 완료 후 서랍 저장 시",
      insight: "자유로운 기록의 경험 제공",
    },
    {
      id: "smlbig",
      category: "저축/목표",
      name: "티끌 모아 태산",
      image: "badges/smlbig.png",
      trigger: "기록된 수입 합계 5만 원 돌파 시",
      insight: "소액이 모여 큰 자산이 되는 과정 체감",
    },
    {
      id: "memcpt",
      category: "기록/분석",
      name: "기록 대장",
      image: "badges/memcpt.png",
      trigger: "7일 연속 당일 접속 및 기록 시",
      insight: "기록의 일상화 및 성실함 보상",
    },
    {
      id: "slfobj",
      category: "기록/분석",
      name: "자기 객관화 완료",
      image: "badges/slfobj.png",
      trigger: "갖고 싶던 것 기록 완료 시",
      insight: "실패한 소비를 직면하고 반성하는 용기",
    },
    {
      id: "drwclt",
      category: "기록/분석",
      name: "서랍 수집가",
      image: "badges/drwclt.png",
      trigger: "완료된 기입장 3개 이상 보관 시",
      insight: "장기적인 경제 활동 데이터 축적",
    },
    {
      id: "dntjoy",
      category: "특별 미션",
      name: "나눔의 기쁨",
      image: "badges/dntjoy.png",
      trigger: "선물/기부 키워드가 포함된 지출 작성 시",
      insight: "돈의 사회적 가치와 나눔의 의미 공유",
    },
    {
      id: "mnywzd",
      category: "특별 미션",
      name: "용돈의 마법사",
      image: "badges/mnywzd.png",
      trigger: "첫 '수입' 항목 기록 발생 시",
      insight: "노동의 가치와 소득의 즐거움 인지",
    },
  ];

  /** 서랍 3×4 그리드 표시 순서 (행 우선) */
  var BADGE_GRID_ORDER = [
    "catcsm",
    "manhpy",
    "stpgod",
    "fstbtn",
    "tgthnt",
    "frsoul",
    "smlbig",
    "memcpt",
    "slfobj",
    "drwclt",
    "dntjoy",
    "mnywzd",
  ];

  /** 이전 버전 앱에서 저장된 뱃지 id → 현재 id */
  var LEGACY_BADGE_ID_MAP = {
    cautious_spender: "catcsm",
    ten_thousand_happiness: "manhpy",
    weekend_stop: "stpgod",
    half_goal: "fstbtn",
    goal_hunter: "tgthnt",
    free_spirit: "frsoul",
    dust_mountain: "smlbig",
    ledger_champion: "memcpt",
    self_objective: "slfobj",
    drawer_collector: "drwclt",
    joy_share: "dntjoy",
    allowance_wizard: "mnywzd",
  };

  var BADGE_SNACK_KEYWORDS = [
    "편의점",
    "과자",
    "간식",
    "아이스크림",
    "음료",
    "군것질",
    "떡볶이",
    "분식",
    "초콜릿",
    "사탕",
    "디저트",
    "빵",
    "라면",
    "햄버거",
    "치킨",
    "피자",
    "탄산",
    "도넛",
    "스낵",
  ];

  var DEFAULT_GOAL_EMOJI = "🎁";
  var GOAL_EMOJI_OPTIONS = [
    "🧸",
    "🎮",
    "📱",
    "🎧",
    "🧱",
    "🤖",
    "👕",
    "👟",
    "🍦",
    "🍭",
    "🥤",
    "🍕",
    "🍰",
    "🍔",
    "🍱",
    "📚",
    "✏️",
    "🎨",
    "🎸",
    "💻",
    "🎒",
    "⚽",
    "🎡",
    "🎬",
    "🏊",
    "🎤",
    "⛺",
    "🎫",
    "🐾",
    "💰",
    "🐷",
    "💎",
    "🎁",
    "🚀",
    "✨",
  ];

  /** 지출 기록 중 구매 판단 표본이 이 값 미만이면 비율 해석을 하지 않음 (3~5건 권장 구간의 보수적 기준). */
  var MIN_EXPENSE_JUDGE_SAMPLES = 5;

  /** @param {unknown} m @return {'nec'|'des'|null} */
  function normalizeExpenseJudge(m) {
    if (m === "nec" || m === "happy") return "nec";
    if (m === "des" || m === "sad") return "des";
    return null;
  }

  /** @param {unknown} m */
  function isValidMood(m) {
    return normalizeExpenseJudge(m) !== null;
  }

  /** @typedef {{ mode: 'goal', itemName: string, targetAmount: number, startAmount: number, goalEmoji: string } | { mode: 'free', balance: number }} SetupState */

  /** @typedef {{ id: string, dateStr: string, type: 'income'|'expense', memo: string, amount: number, mood: 'nec'|'des'|null, createdAt: number }} LedgerEntry */

  /** @typedef {{ id: string, kind: 'goal'|'free', closedAt: number, title: string, targetAmount?: number, walletAtClose: number, entries: LedgerEntry[] }} ArchiveBook */

  /** @typedef {Record<string, { count: number, label: string }>} KeywordMap */

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = parseJsonSafe(raw);
      if (data && data.mode === "goal" && typeof data.itemName === "string") {
        var ge =
          typeof data.goalEmoji === "string" && data.goalEmoji.length > 0 ? data.goalEmoji : DEFAULT_GOAL_EMOJI;
        return {
          mode: "goal",
          itemName: data.itemName.trim(),
          targetAmount: Number(data.targetAmount),
          startAmount: Number(data.startAmount),
          goalEmoji: ge,
        };
      }
      if (data && data.mode === "free") {
        var b = Number(data.balance);
        return { mode: "free", balance: Number.isFinite(b) ? b : 0 };
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  /** @param {SetupState | null} state */
  function saveState(s) {
    if (s === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function isSetupComplete(state) {
    if (!state) return false;
    if (state.mode === "free") return true;
    if (state.mode !== "goal") return false;
    if (!state.itemName) return false;
    if (!Number.isFinite(state.targetAmount) || state.targetAmount <= 0) return false;
    if (!Number.isFinite(state.startAmount)) return false;
    return true;
  }

  function loadEntries() {
    try {
      var raw = localStorage.getItem(ENTRIES_KEY);
      if (!raw) return [];
      var arr = parseJsonSafe(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  /** @param {LedgerEntry[]} list */
  function saveEntries(list) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(list));
  }

  function normKey(s) {
    return String(s).trim().toLowerCase();
  }

  /** @param {'income'|'expense'} type */
  function loadKeywordsForType(type) {
    var storageKey = type === "income" ? KEYWORDS_INCOME_KEY : KEYWORDS_EXPENSE_KEY;
    try {
      var raw = localStorage.getItem(storageKey);
      var data = raw ? parseJsonSafe(raw) : null;
      var map = data && typeof data === "object" ? data : /** @type {KeywordMap} */ ({});
      if (type === "expense" && Object.keys(map).length === 0) {
        var leg = localStorage.getItem(KEYWORDS_KEY);
        if (leg) {
          try {
            var old = parseJsonSafe(leg);
            if (old && typeof old === "object") {
              map = old;
              saveKeywordsForType("expense", map);
            }
          } catch (e2) {
            /* ignore */
          }
        }
      }
      return map;
    } catch (e) {
      return {};
    }
  }

  /** @param {'income'|'expense'} type @param {KeywordMap} map */
  function saveKeywordsForType(type, map) {
    var storageKey = type === "income" ? KEYWORDS_INCOME_KEY : KEYWORDS_EXPENSE_KEY;
    localStorage.setItem(storageKey, JSON.stringify(map));
  }

  /** @param {string} memo @param {'income'|'expense'} type */
  function bumpKeywordForType(memo, type) {
    var k = normKey(memo);
    if (!k) return;
    var map = loadKeywordsForType(type);
    var cur = map[k] || { count: 0, label: memo.trim() };
    cur.count += 1;
    cur.label = memo.trim();
    map[k] = cur;
    saveKeywordsForType(type, map);
  }

  /** @param {'income'|'expense'} type */
  function getTopKeywordsForType(type) {
    var map = loadKeywordsForType(type);
    var ranked = Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return b.count - a.count;
      });
    var labels = ranked.slice(0, 3).map(function (x) {
      return x.label;
    });
    var seen = {};
    labels.forEach(function (l) {
      seen[normKey(l)] = true;
    });
    var defaults = type === "income" ? DEFAULT_KEYWORDS_INCOME : DEFAULT_KEYWORDS;
    defaults.forEach(function (d) {
      if (labels.length >= 3) return;
      if (!seen[normKey(d)]) {
        labels.push(d);
        seen[normKey(d)] = true;
      }
    });
    return labels.slice(0, 3);
  }

  function loadArchives() {
    try {
      var raw = localStorage.getItem(ARCHIVES_KEY);
      if (!raw) return [];
      var data = parseJsonSafe(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(function (x) {
        return (
          x &&
          typeof x.id === "string" &&
          (x.kind === "goal" || x.kind === "free") &&
          typeof x.title === "string" &&
          Array.isArray(x.entries)
        );
      });
    } catch (e) {
      return [];
    }
  }

  /** @param {ArchiveBook[]} list */
  function saveArchives(list) {
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(list));
  }

  /** @param {ArchiveBook} book */
  function pushArchive(book) {
    var a = loadArchives();
    a.unshift(book);
    saveArchives(a);
  }

  /** @type {string | null} */
  var archiveDetailOpenId = null;

  /** @param {string} archiveId */
  function deleteArchiveById(archiveId) {
    if (!archiveId) return;
    var next = loadArchives().filter(function (a) {
      return a.id !== archiveId;
    });
    saveArchives(next);
    archiveDetailOpenId = null;
    closeModal(els.modalArchiveDetail);
    renderDrawer();
  }

  function loadEarnedBadges() {
    try {
      var raw = localStorage.getItem(BADGES_KEY);
      if (!raw) return [];
      var data = parseJsonSafe(raw);
      if (!Array.isArray(data)) return [];
      var next = [];
      var seen = {};
      for (var i = 0; i < data.length; i++) {
        var id = data[i];
        if (typeof id !== "string") continue;
        var mapped = LEGACY_BADGE_ID_MAP[id] || id;
        if (!seen[mapped]) {
          seen[mapped] = true;
          next.push(mapped);
        }
      }
      if (JSON.stringify(next) !== JSON.stringify(data)) {
        saveEarnedBadges(next);
      }
      return next;
    } catch (e) {
      return [];
    }
  }

  /** @param {string[]} ids */
  function saveEarnedBadges(ids) {
    localStorage.setItem(BADGES_KEY, JSON.stringify(ids));
  }

  /** @return {LedgerEntry[]} */
  function getAllLedgerEntriesForInsight() {
    var out = loadEntries().slice();
    loadArchives().forEach(function (a) {
      out = out.concat(a.entries);
    });
    return out;
  }

  /**
   * 용키의 한 마디·홈 소비 분석용. 진행 중인 기입장(현재 목표 또는 자유 기록)만 포함하고,
   * 서랍에 보관된 통장 티켓은 제외한다.
   * @return {LedgerEntry[]}
   */
  function getActiveLedgerEntriesForInsight() {
    return loadEntries().slice();
  }

  /** @param {string} dateStr */
  function parseEntryDateKey(dateStr) {
    var p = String(dateStr || "").split("-");
    if (p.length !== 3) return null;
    var y = 2000 + parseInt(p[0], 10);
    var mo = parseInt(p[1], 10) - 1;
    var day = parseInt(p[2], 10);
    var d = new Date(y, mo, day);
    if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
    return d;
  }

  function startOfLocalDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  /** @param {LedgerEntry[]} all */
  function hasAtLeastSevenDaysSinceFirstEntry(all) {
    if (!all || all.length === 0) return false;
    var firstTs = null;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      var d = parseEntryDateKey(e.dateStr);
      var ts = d ? startOfLocalDay(d) : startOfLocalDay(new Date(e.createdAt || Date.now()));
      if (firstTs === null || ts < firstTs) firstTs = ts;
    }
    if (firstTs === null) return false;
    var todayTs = startOfLocalDay(todayDate());
    return todayTs - firstTs >= 7 * 86400000;
  }

  /** @param {string} memo */
  function memoLooksLikeSnack(memo) {
    var m = normKey(memo);
    for (var i = 0; i < BADGE_SNACK_KEYWORDS.length; i++) {
      if (m.includes(normKey(BADGE_SNACK_KEYWORDS[i]))) return true;
    }
    return false;
  }

  /** @param {string} memo */
  function memoHasGiftOrDonation(memo) {
    var m = normKey(memo);
    return m.includes("선물") || m.includes("기부");
  }

  /** @param {LedgerEntry[]} all */
  function badgeSnackWeekUnder10k(all) {
    // 최소 7일이 지나야 '일주일 동안' 조건을 의미 있게 판정할 수 있음
    if (!hasAtLeastSevenDaysSinceFirstEntry(all)) return false;
    var today = todayDate();
    var sum = 0;
    var cnt = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var key = formatYYMMDD(d);
      for (var j = 0; j < all.length; j++) {
        var e = all[j];
        if (e.type !== "expense" || e.dateStr !== key) continue;
        if (normalizeExpenseJudge(e.mood) !== "des") continue;
        sum += e.amount;
        cnt++;
      }
    }
    return cnt > 0 && sum <= 10000;
  }

  /** @param {LedgerEntry[]} all */
  function badgeWeekendNoExpense(all) {
    // 최초 기록 후 최소 1주(다음 주말 판정 가능 시점) 경과 전에는 미획득
    if (!hasAtLeastSevenDaysSinceFirstEntry(all)) return false;
    var hadExpense = false;
    for (var h = 0; h < all.length; h++) {
      if (all[h].type === "expense") {
        hadExpense = true;
        break;
      }
    }
    if (!hadExpense) return false;

    var expenseCount = {};
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.type !== "expense") continue;
      expenseCount[e.dateStr] = (expenseCount[e.dateStr] || 0) + 1;
    }
    var today = todayDate();
    var todayStart = startOfLocalDay(today);
    for (var back = 0; back < 200; back++) {
      var sat = new Date(today);
      sat.setDate(sat.getDate() - back);
      if (sat.getDay() !== 6) continue;
      var sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      if (sun.getDay() !== 0) continue;
      if (startOfLocalDay(sun) >= todayStart) continue;
      var satStr = formatYYMMDD(sat);
      var sunStr = formatYYMMDD(sun);
      if ((expenseCount[satStr] || 0) + (expenseCount[sunStr] || 0) === 0) return true;
    }
    return false;
  }

  function loadVisitDays() {
    try {
      var raw = localStorage.getItem(VISIT_DAYS_KEY);
      var o = raw ? parseJsonSafe(raw) : null;
      if (!o || typeof o !== "object" || Array.isArray(o)) return {};
      return o;
    } catch (e) {
      return {};
    }
  }

  /** @param {Record<string, boolean>} o */
  function saveVisitDays(o) {
    localStorage.setItem(VISIT_DAYS_KEY, JSON.stringify(o));
  }

  function markVisitToday() {
    var k = formatYYMMDD(todayDate());
    var o = loadVisitDays();
    o[k] = true;
    saveVisitDays(o);
  }

  /** 당일 접속 + 그날 기록이 모두 있는 날만 이어서 최장 연속 일수 */
  /** @param {LedgerEntry[]} all */
  function maxConsecutiveVisitRecordStreak(all) {
    var visits = loadVisitDays();
    var entryByDate = {};
    for (var i = 0; i < all.length; i++) {
      if (all[i].dateStr) entryByDate[all[i].dateStr] = true;
    }
    var bothKeys = [];
    Object.keys(entryByDate).forEach(function (ds) {
      if (visits[ds]) bothKeys.push(ds);
    });
    var dates = [];
    for (var j = 0; j < bothKeys.length; j++) {
      var dt = parseEntryDateKey(bothKeys[j]);
      if (dt) dates.push(dt.getTime());
    }
    dates.sort(function (a, b) {
      return a - b;
    });
    if (dates.length === 0) return 0;
    var maxRun = 1;
    var run = 1;
    for (var k = 1; k < dates.length; k++) {
      var diff = (dates[k] - dates[k - 1]) / 86400000;
      if (diff === 1) run++;
      else run = 1;
      if (run > maxRun) maxRun = run;
    }
    return maxRun;
  }

  /** @param {LedgerEntry[]} all */
  function totalIncomeRecorded(all) {
    var s = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i].type === "income") s += all[i].amount;
    }
    return s;
  }

  /**
   * @param {SetupState | null} st
   * @return {string[]}
   */
  function computeEligibleBadgeIds(st) {
    var all = getAllLedgerEntriesForInsight();
    var archives = loadArchives();
    var earnedIds = [];

    var byNewestExpense = all
      .filter(function (e) {
        return e.type === "expense" && isValidMood(e.mood);
      })
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      });
    if (byNewestExpense.length >= 5) {
      var fiveNeed = true;
      for (var i = 0; i < 5; i++) {
        if (normalizeExpenseJudge(byNewestExpense[i].mood) !== "nec") fiveNeed = false;
      }
      if (fiveNeed) earnedIds.push("catcsm");
    }

    if (badgeSnackWeekUnder10k(all)) earnedIds.push("manhpy");

    if (badgeWeekendNoExpense(all)) earnedIds.push("stpgod");

    if (st && st.mode === "goal" && st.startAmount >= st.targetAmount * 0.5) {
      earnedIds.push("fstbtn");
    }

    var goalArchives = archives.filter(function (a) {
      return a.kind === "goal";
    });
    if (goalArchives.length >= 1) earnedIds.push("tgthnt");

    var freeArchives = archives.filter(function (a) {
      return a.kind === "free";
    });
    if (freeArchives.length >= 1) earnedIds.push("frsoul");

    if (totalIncomeRecorded(all) >= 50000) earnedIds.push("smlbig");

    if (maxConsecutiveVisitRecordStreak(all) >= 7) earnedIds.push("memcpt");

    for (var j = 0; j < all.length; j++) {
      if (all[j].type === "expense" && normalizeExpenseJudge(all[j].mood) === "des") {
        earnedIds.push("slfobj");
        break;
      }
    }

    if (archives.length >= 3) earnedIds.push("drwclt");

    for (var k = 0; k < all.length; k++) {
      if (all[k].type === "expense" && memoHasGiftOrDonation(all[k].memo)) {
        earnedIds.push("dntjoy");
        break;
      }
    }

    for (var n = 0; n < all.length; n++) {
      if (all[n].type === "income") {
        earnedIds.push("mnywzd");
        break;
      }
    }

    return earnedIds;
  }

  /** @return {number} 새로 추가된 뱃지 개수 */
  function syncBadges() {
    var before = loadEarnedBadges().length;
    var set = new Set(loadEarnedBadges());
    computeEligibleBadgeIds(state).forEach(function (id) {
      set.add(id);
    });
    var next = Array.from(set);
    saveEarnedBadges(next);
    return Math.max(0, next.length - before);
  }

  function countRecordingDays() {
    var seen = {};
    getAllLedgerEntriesForInsight().forEach(function (e) {
      if (e.dateStr) seen[e.dateStr] = true;
    });
    return Object.keys(seen).length;
  }

  function computeInsightText() {
    var all = getActiveLedgerEntriesForInsight();
    if (all.length === 0) {
      return "아직 기록이 없어요. 기록을 작성해봅시다.";
    }

    var expenses = all.filter(function (e) {
      return e.type === "expense";
    });
    var expenseWithMood = expenses.filter(function (e) {
      return isValidMood(e.mood);
    });

    // 2단계: 표본 수 보호 — 지출은 있으나 구매 판단 표본이 부족한 경우
    if (expenseWithMood.length < MIN_EXPENSE_JUDGE_SAMPLES) {
      return "기록이 조금씩 쌓이고 있어요! 더 많은 기록이 모이면 소비 습관을 알려줄게요.";
    }

    var nec = 0,
      des = 0;
    expenseWithMood.forEach(function (e) {
      var j = normalizeExpenseJudge(e.mood);
      if (j === "nec") nec++;
      else if (j === "des") des++;
    });
    var t = expenseWithMood.length;
    var rNec = nec / t;
    var rDes = des / t;

    // C
    if (rDes > 0.6) {
      return "욕구 소비가 조금 많았어요😅. 다음엔 갖고 싶은 것보다 필요한 것에 먼저 집중해볼까요?";
    }
    // D
    if (rNec > 0.7) {
      return "꼭 필요한 것에 잘 쓰고 있어요! 아주 똑똑한 소비 습관이에요👍";
    }
    // E
    if (rNec < 0.5 && rDes <= 0.6) {
      return "나쁘지 않아요! 다음엔 조금 더 고민해서 나를 더 행복하게 만드는 소비를 늘려볼까요?";
    }

    return "전체적으로 균형 잡힌 소비를 했어요. 이런 흐름을 유지하면서, 특히 만족스러웠던 소비를 더 늘려볼까요?";
  }

  function formatArchiveWhen(ts) {
    var d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return (
      d.getFullYear() +
      "." +
      String(d.getMonth() + 1).padStart(2, "0") +
      "." +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function formatWon(n) {
    if (!Number.isFinite(n)) return "0원";
    return n.toLocaleString("ko-KR") + "원";
  }

  function formatYYMMDD(d) {
    var y = String(d.getFullYear()).slice(-2);
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function todayDate() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {
      /* ignore */
    }
  }

  function moodEmoji(m) {
    var j = normalizeExpenseJudge(m);
    if (j === "nec") return "✅ 필요한 것";
    if (j === "des") return "✨ 갖고 싶던 것";
    return "—";
  }

  var els = {
    panels: {
      home: document.getElementById("panel-home"),
      goal: document.getElementById("panel-goal"),
      ledger: document.getElementById("panel-ledger"),
      drawer: document.getElementById("panel-drawer"),
    },
    tabs: document.querySelectorAll(".tab"),
    goalForm: document.getElementById("goal-form"),
    goalSetupIntro: document.getElementById("goal-setup-intro"),
    goalSetupDivider: document.getElementById("goal-setup-divider"),
    goalSetupHint: document.getElementById("goal-setup-hint"),
    goalName: document.getElementById("goal-name"),
    goalTarget: document.getElementById("goal-target"),
    goalStart: document.getElementById("goal-start"),
    btnFreeMode: document.getElementById("btn-free-mode"),
    activeGoal: document.getElementById("active-goal"),
    activeGoalName: document.getElementById("active-goal-name"),
    activeGoalNums: document.getElementById("active-goal-nums"),
    activeFree: document.getElementById("active-free"),
    btnGoalDone: document.getElementById("btn-goal-done"),
    homeArcFill: document.getElementById("home-arc-fill"),
    homeArcEmoji: document.getElementById("home-arc-emoji"),
    homeArcTitle: document.getElementById("home-arc-title"),
    homeArcLabel: document.getElementById("home-arc-label"),
    homeArcAmounts: document.getElementById("home-arc-amounts"),
    homeArcPct: document.getElementById("home-arc-pct"),
    homeTileProgress: document.getElementById("home-tile-progress"),
    homeOnelineText: document.getElementById("home-oneline-text"),
    homeMoodBar: document.getElementById("home-mood-bar"),
    homeMoodLegend: document.getElementById("home-mood-legend"),
    homeMoodEmpty: document.getElementById("home-mood-empty"),
    goalEmojiPickerForm: document.getElementById("goal-emoji-picker-form"),
    goalEmojiPickerActive: document.getElementById("goal-emoji-picker-active"),
    modalOverlap: document.getElementById("modal-overlap"),
    modalOverlapYes: document.getElementById("modal-overlap-yes"),
    modalOverlapNo: document.getElementById("modal-overlap-no"),
    modalRedirect: document.getElementById("modal-redirect"),
    modalRedirectOk: document.getElementById("modal-redirect-ok"),
    modalFree: document.getElementById("modal-free"),
    modalFreeBalance: document.getElementById("modal-free-balance"),
    modalFreeOk: document.getElementById("modal-free-ok"),
    modalFreeCancel: document.getElementById("modal-free-cancel"),
    activeFreeBalance: document.getElementById("active-free-balance"),
    btnHardReset: document.getElementById("btn-hard-reset"),
    modalHardReset1: document.getElementById("modal-hard-reset-1"),
    modalHardReset1Yes: document.getElementById("modal-hard-reset-1-yes"),
    modalHardReset1No: document.getElementById("modal-hard-reset-1-no"),
    modalHardReset2: document.getElementById("modal-hard-reset-2"),
    modalHardReset2Yes: document.getElementById("modal-hard-reset-2-yes"),
    modalHardReset2No: document.getElementById("modal-hard-reset-2-no"),
    ledgerBalanceLine: document.getElementById("ledger-balance-line"),
    ledgerTicket: document.getElementById("ledger-ticket"),
    ledgerDots: document.querySelectorAll(".ledger-dot"),
    ledgerTrack: document.getElementById("ledger-track"),
    ledgerViewport: document.getElementById("ledger-viewport"),
    ledgerDateBtn: document.getElementById("ledger-date-btn"),
    ledgerNext1: document.getElementById("ledger-next-1"),
    ledgerMemo: document.getElementById("ledger-memo"),
    ledgerStep2Hint: document.getElementById("ledger-step2-hint"),
    ledgerMoodBlock: document.getElementById("ledger-mood-block"),
    ledgerKeywords: document.getElementById("ledger-keywords"),
    ledgerNext2: document.getElementById("ledger-next-2"),
    ledgerBack2: document.getElementById("ledger-back-2"),
    ledgerAmountDisplay: document.getElementById("ledger-amount-display"),
    ledgerNumpad: document.getElementById("ledger-numpad"),
    ledgerBack3: document.getElementById("ledger-back-3"),
    ledgerSave: document.getElementById("ledger-save"),
    ledgerList: document.getElementById("ledger-list"),
    ledgerEmpty: document.getElementById("ledger-empty"),
    ledgerViewPanelList: document.getElementById("ledger-view-panel-list"),
    ledgerViewPanelTable: document.getElementById("ledger-view-panel-table"),
    ledgerViewPanelCalendar: document.getElementById("ledger-view-panel-calendar"),
    ledgerTableBody: document.getElementById("ledger-table-body"),
    ledgerCalGrid: document.getElementById("ledger-cal-grid"),
    ledgerCalMonthLabel: document.getElementById("ledger-cal-month-label"),
    ledgerCalPrev: document.getElementById("ledger-cal-prev"),
    ledgerCalNext: document.getElementById("ledger-cal-next"),
    ledgerTicketLabel: document.getElementById("ledger-ticket-label"),
    ledgerEditCancel: document.getElementById("ledger-edit-cancel"),
    ledgerTicketRemain: document.getElementById("ledger-ticket-remain"),
    modalCalendar: document.getElementById("modal-calendar"),
    calendarTitle: document.getElementById("calendar-title"),
    calendarGrid: document.getElementById("calendar-grid"),
    calendarPrev: document.getElementById("calendar-prev"),
    calendarNext: document.getElementById("calendar-next"),
    drawerDayTitle: document.getElementById("drawer-day-title"),
    drawerArchiveCount: document.getElementById("drawer-archive-count"),
    drawerBadgeCount: document.getElementById("drawer-badge-count"),
    drawerBadgeGrid: document.getElementById("drawer-badge-grid"),
    drawerArchives: document.getElementById("drawer-archives"),
    drawerArchivesEmpty: document.getElementById("drawer-archives-empty"),
    modalBadgeDetail: document.getElementById("modal-badge-detail"),
    badgeDetailImg: document.getElementById("badge-detail-img"),
    badgeDetailCategory: document.getElementById("badge-detail-category"),
    badgeDetailName: document.getElementById("badge-detail-name"),
    badgeDetailTrigger: document.getElementById("badge-detail-trigger"),
    badgeDetailInsight: document.getElementById("badge-detail-insight"),
    modalGoalCelebrate: document.getElementById("modal-goal-celebrate"),
    modalGoalCelebrateContinue: document.getElementById("modal-goal-celebrate-continue"),
    modalGoalCelebrateArchive: document.getElementById("modal-goal-celebrate-archive"),
    modalCelebrateBody: document.getElementById("modal-celebrate-body"),
    modalFreeArchive: document.getElementById("modal-free-archive"),
    modalFreeArchiveYes: document.getElementById("modal-free-archive-yes"),
    modalFreeArchiveNo: document.getElementById("modal-free-archive-no"),
    modalArchiveDetail: document.getElementById("modal-archive-detail"),
    archiveDetailTitle: document.getElementById("archive-detail-title"),
    archiveDetailMeta: document.getElementById("archive-detail-meta"),
    archiveDetailList: document.getElementById("archive-detail-list"),
    archiveDetailDelete: document.getElementById("archive-detail-delete"),
    modalArchiveDeleteConfirm: document.getElementById("modal-archive-delete-confirm"),
    modalArchiveDeleteNo: document.getElementById("modal-archive-delete-no"),
    modalArchiveDeleteYes: document.getElementById("modal-archive-delete-yes"),
    btnFreeDone: document.getElementById("btn-free-done"),
  };

  /** @type {SetupState | null} */
  var state = loadState();

  /** @type {null | { itemName: string, targetAmount: number, startAmount: number, goalEmoji: string }} */
  var pendingGoal = null;

  var goalDraftEmoji = DEFAULT_GOAL_EMOJI;

  /** @type {Date} */
  var ledgerSelectedDate = todayDate();
  /** @type {'income'|'expense'|null} */
  var ledgerType = null;
  var ledgerAmountDigits = "";
  /** @type {'nec'|'des'|null} */
  var ledgerMood = null;
  var ledgerStep = 0;
  /** @type {string | null} */
  var ledgerEditingId = null;
  /** @type {HTMLLIElement | null} */
  var ledgerRowSelectedEl = null;
  /** @type {Date} */
  var calendarView = todayDate();

  /** @type {'list'|'ledger'|'calendar'} */
  var ledgerRecentViewMode = "list";
  /** @type {Date | null} */
  var ledgerCalendarMonth = null;

  function loadLedgerRecentViewMode() {
    try {
      var raw = localStorage.getItem(LEDGER_RECENT_VIEW_KEY);
      if (raw === "list" || raw === "ledger" || raw === "calendar") return raw;
    } catch (e) {
      /* ignore */
    }
    return "list";
  }

  ledgerRecentViewMode = loadLedgerRecentViewMode();

  function ensureLedgerCalendarMonth() {
    if (!ledgerCalendarMonth) {
      var t = todayDate();
      ledgerCalendarMonth = new Date(t.getFullYear(), t.getMonth(), 1);
    }
    return ledgerCalendarMonth;
  }

  /** @param {number} n */
  function formatLedgerCompact(n) {
    if (!Number.isFinite(n)) return "—";
    var neg = n < 0;
    var v = Math.abs(n);
    var body;
    if (v >= 100000000) {
      var eok = v / 100000000;
      body = (eok % 1 === 0 ? String(Math.round(eok)) : eok.toFixed(1)) + "억";
    } else if (v >= 10000) {
      var man = v / 10000;
      body = (man >= 100 ? String(Math.round(man)) : man.toFixed(1).replace(/\.0$/, "")) + "만";
    } else {
      body = v.toLocaleString("ko-KR");
    }
    return (neg ? "−" : "") + body;
  }

  function formatCalendarMonthTitle(d) {
    return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월";
  }

  function clearLedgerRowSelection() {
    if (ledgerRowSelectedEl) {
      ledgerRowSelectedEl.classList.remove("ledger-row--active");
      ledgerRowSelectedEl = null;
    }
  }

  /** @param {HTMLLIElement} li */
  function activateLedgerRow(li) {
    if (ledgerRowSelectedEl === li) return;
    clearLedgerRowSelection();
    ledgerRowSelectedEl = li;
    li.classList.add("ledger-row--active");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getWallet() {
    if (!state) return 0;
    if (state.mode === "goal") return state.startAmount;
    return state.balance;
  }

  function setWallet(n) {
    if (!state) return;
    if (state.mode === "goal") state.startAmount = n;
    else state.balance = n;
    saveState(state);
  }

  /** @param {LedgerEntry} e */
  function walletDeltaForEntry(e) {
    return e.type === "income" ? e.amount : -e.amount;
  }

  /**
   * 현재 지갑과 기입장 목록으로, 각 티켓 저장 직후 잔액을 재구성합니다.
   * @param {LedgerEntry[]} list
   * @return {Record<string, number>}
   */
  function computeWalletAfterByEntryId(list) {
    var map = /** @type {Record<string, number>} */ ({});
    if (!list || !list.length) return map;
    var sorted = list.slice().sort(function (a, b) {
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return String(a.id).localeCompare(String(b.id));
    });
    var sumD = 0;
    for (var i = 0; i < sorted.length; i++) {
      sumD += walletDeltaForEntry(sorted[i]);
    }
    var w = getWallet() - sumD;
    for (var j = 0; j < sorted.length; j++) {
      var e = sorted[j];
      w += walletDeltaForEntry(e);
      map[e.id] = w;
    }
    return map;
  }

  function updateLedgerTicketChrome() {
    var isEdit = !!ledgerEditingId;
    if (els.ledgerTicketLabel) {
      els.ledgerTicketLabel.textContent = isEdit ? "✏️ 티켓 수정" : "🎫 새 티켓";
      els.ledgerTicketLabel.classList.toggle("ledger-ticket__label--edit", isEdit);
      els.ledgerTicketLabel.classList.toggle("ledger-ticket__label--new", !isEdit);
    }
    if (els.ledgerEditCancel) {
      els.ledgerEditCancel.hidden = !isEdit;
    }
    if (els.ledgerSave) {
      els.ledgerSave.textContent = ledgerEditingId ? "수정 저장" : "저장하기";
    }
  }

  function computeMoodRatios() {
    var all = getActiveLedgerEntriesForInsight();
    var nec = 0,
      des = 0;
    all.forEach(function (e) {
      if (e.type !== "expense" || !isValidMood(e.mood)) return;
      var j = normalizeExpenseJudge(e.mood);
      if (j === "nec") nec++;
      else if (j === "des") des++;
    });
    return { nec: nec, des: des, t: nec + des };
  }

  function setHomeArcProgress(pct) {
    var path = els.homeArcFill;
    if (!path) return;
    var len = typeof path.getTotalLength === "function" ? path.getTotalLength() : 955;
    if (!len || len <= 0) len = 955;
    var p = Math.max(0, Math.min(100, pct));
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len * (1 - p / 100));
  }

  function clearHomeArcStatLines() {
    if (els.homeArcLabel) els.homeArcLabel.textContent = "";
    if (els.homeArcAmounts) {
      els.homeArcAmounts.textContent = "";
      els.homeArcAmounts.classList.remove("home-arc-line--warn");
    }
    if (els.homeArcPct) {
      els.homeArcPct.textContent = "";
      els.homeArcPct.classList.remove("home-arc-line--warn");
    }
  }

  function renderHomeTiles() {
    if (!els.homeOnelineText) return;

    els.homeOnelineText.textContent = computeInsightText();

    var mood = computeMoodRatios();
    if (mood.t === 0) {
      if (els.homeMoodEmpty) els.homeMoodEmpty.hidden = false;
      if (els.homeMoodBar) els.homeMoodBar.innerHTML = "";
      if (els.homeMoodLegend) els.homeMoodLegend.innerHTML = "";
    } else {
      if (els.homeMoodEmpty) els.homeMoodEmpty.hidden = true;
      var pNec = Math.round((100 * mood.nec) / mood.t);
      var pDes = 100 - pNec;
      if (els.homeMoodBar) {
        els.homeMoodBar.innerHTML =
          '<div class="home-mood-bar__seg home-mood-bar__seg--happy" style="width:' +
          pNec +
          '%" title="필요 ' +
          pNec +
          '%"><span class="home-mood-bar__label">필요</span></div>' +
          '<div class="home-mood-bar__seg home-mood-bar__seg--sad" style="width:' +
          pDes +
          '%" title="욕구 ' +
          pDes +
          '%"><span class="home-mood-bar__label">욕구</span></div>';
      }
      if (els.homeMoodLegend) {
        els.homeMoodLegend.innerHTML =
          '<span class="home-mood-legend__item"><span class="home-mood-dot home-mood-dot--happy" aria-hidden="true"></span>필요 ' +
          pNec +
          "%</span>" +
          '<span class="home-mood-legend__item"><span class="home-mood-dot home-mood-dot--sad" aria-hidden="true"></span>욕구 ' +
          pDes +
          "%</span>";
      }
    }

    if (!state || !isSetupComplete(state)) {
      if (els.homeTileProgress) els.homeTileProgress.classList.add("home-tile--progress-placeholder");
      if (els.homeArcEmoji) els.homeArcEmoji.textContent = "🏠";
      if (els.homeArcTitle) els.homeArcTitle.textContent = "목표를 설정하면 여기에 표시돼요.";
      clearHomeArcStatLines();
      setHomeArcProgress(0);
      return;
    }

    if (els.homeTileProgress) els.homeTileProgress.classList.remove("home-tile--progress-placeholder");

    if (state.mode === "goal") {
      if (els.homeTileProgress) els.homeTileProgress.classList.remove("home-tile--progress-free");
      var pctG =
        state.targetAmount <= 0
          ? 100
          : Math.min(100, Math.round((state.startAmount / state.targetAmount) * 100));
      if (els.homeArcEmoji) els.homeArcEmoji.textContent = state.goalEmoji || DEFAULT_GOAL_EMOJI;
      if (els.homeArcTitle) els.homeArcTitle.textContent = state.itemName;
      if (els.homeArcLabel) els.homeArcLabel.textContent = "모은 돈/목표";
      if (els.homeArcAmounts) {
        els.homeArcAmounts.textContent =
          formatWon(state.startAmount) + " / " + formatWon(state.targetAmount);
        els.homeArcAmounts.classList.toggle("home-arc-line--warn", state.startAmount < 0);
      }
      if (els.homeArcPct) {
        els.homeArcPct.textContent = pctG + "%";
        els.homeArcPct.classList.toggle("home-arc-line--warn", state.startAmount < 0);
      }
      requestAnimationFrame(function () {
        setHomeArcProgress(pctG);
      });
    } else {
      if (els.homeTileProgress) els.homeTileProgress.classList.add("home-tile--progress-free");
      if (els.homeArcEmoji) els.homeArcEmoji.textContent = "📒";
      if (els.homeArcTitle) els.homeArcTitle.textContent = "자유 기록 모드";
      if (els.homeArcLabel) els.homeArcLabel.textContent = "지갑";
      if (els.homeArcAmounts) {
        els.homeArcAmounts.textContent = formatWon(state.balance);
        els.homeArcAmounts.classList.toggle("home-arc-line--warn", state.balance < 0);
      }
      if (els.homeArcPct) {
        els.homeArcPct.textContent = "";
        els.homeArcPct.classList.remove("home-arc-line--warn");
      }
      requestAnimationFrame(function () {
        setHomeArcProgress(0);
      });
    }
  }

  function renderGoalEmojiPickers() {
    function fill(container, selected, onPick) {
      if (!container) return;
      container.innerHTML = "";
      GOAL_EMOJI_OPTIONS.forEach(function (em) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "goal-emoji-btn" + (selected === em ? " goal-emoji-btn--on" : "");
        b.textContent = em;
        b.setAttribute("aria-pressed", selected === em ? "true" : "false");
        b.setAttribute("aria-label", "이모지 " + em);
        b.addEventListener("click", function () {
          onPick(em);
        });
        container.appendChild(b);
      });
    }

    var complete = isSetupComplete(state);
    if (!complete) {
      fill(els.goalEmojiPickerForm, goalDraftEmoji, function (em) {
        goalDraftEmoji = em;
        renderGoalEmojiPickers();
      });
    } else if (els.goalEmojiPickerForm) {
      els.goalEmojiPickerForm.innerHTML = "";
    }

    if (state && state.mode === "goal") {
      fill(els.goalEmojiPickerActive, state.goalEmoji || DEFAULT_GOAL_EMOJI, function (em) {
        state.goalEmoji = em;
        saveState(state);
        refreshGoalUI();
      });
    } else if (els.goalEmojiPickerActive) {
      els.goalEmojiPickerActive.innerHTML = "";
    }
  }

  function showPanel(name) {
    Object.keys(els.panels).forEach(function (key) {
      els.panels[key].hidden = key !== name;
    });
    els.tabs.forEach(function (tab) {
      var isActive = tab.getAttribute("data-tab") === name;
      tab.classList.toggle("tab--active", isActive);
      if (isActive) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    if (name === "ledger") {
      refreshLedgerChrome();
      refreshLedgerRecentSection();
    }
    if (name === "drawer") {
      renderDrawer();
    }
  }

  function refreshGoalUI() {
    var complete = isSetupComplete(state);
    var isGoal = state && state.mode === "goal";
    var isFree = state && state.mode === "free";

    var hideGoalSetup = complete;
    els.goalForm.hidden = hideGoalSetup;
    if (els.goalSetupIntro) els.goalSetupIntro.hidden = hideGoalSetup;
    if (els.goalSetupDivider) els.goalSetupDivider.hidden = hideGoalSetup;
    els.btnFreeMode.hidden = hideGoalSetup;
    if (els.goalSetupHint) els.goalSetupHint.hidden = hideGoalSetup;

    els.activeGoal.hidden = !isGoal;
    els.activeFree.hidden = !isFree;

    if (isGoal && state) {
      els.activeGoalName.textContent = state.itemName;
      els.activeGoalNums.textContent =
        "목표 " +
        formatWon(state.targetAmount) +
        " · 지금 " +
        formatWon(state.startAmount);
    }

    if (isFree && state && els.activeFreeBalance) {
      els.activeFreeBalance.textContent = "지금 " + formatWon(state.balance);
    }

    renderHomeTiles();
    renderGoalEmojiPickers();
  }

  function refreshLedgerChrome() {
    if (!els.ledgerBalanceLine) return;
    var w = getWallet();
    var debt = w < 0;
    var line = els.ledgerBalanceLine;
    line.textContent = "";
    line.appendChild(document.createTextNode("지금 지갑 "));
    var strong = document.createElement("strong");
    strong.textContent = formatWon(w);
    if (debt) strong.className = "ledger-balance-line--debt";
    line.appendChild(strong);
    updateDateButton();
    updateAmountPreview();
    updateSaveEnabled();
  }

  function updateDateButton() {
    els.ledgerDateBtn.textContent = formatYYMMDD(ledgerSelectedDate);
  }

  function syncLedgerWizUi() {
    if (els.ledgerTicket) {
      els.ledgerTicket.classList.remove("ledger-ticket--wiz-income", "ledger-ticket--wiz-expense");
      if (ledgerStep >= 1 && ledgerType === "income") {
        els.ledgerTicket.classList.add("ledger-ticket--wiz-income");
      } else if (ledgerStep >= 1 && ledgerType === "expense") {
        els.ledgerTicket.classList.add("ledger-ticket--wiz-expense");
      }
    }
    if (els.ledgerStep2Hint) {
      if (ledgerType === "income") els.ledgerStep2Hint.textContent = "어떻게 벌었나요?";
      else if (ledgerType === "expense") els.ledgerStep2Hint.textContent = "무엇에 썼나요?";
      else els.ledgerStep2Hint.textContent = "무엇에 썼나요 / 어떻게 벌었나요?";
    }
    if (els.ledgerMoodBlock) {
      els.ledgerMoodBlock.hidden = ledgerStep === 2 && ledgerType === "income";
    }
    updateSaveEnabled();
  }

  function goLedgerStep(n) {
    ledgerStep = Math.max(0, Math.min(2, n));
    if (ledgerStep === 2 && ledgerType === "income") {
      ledgerMood = null;
      document.querySelectorAll(".ledger-mood").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
    }
    if (els.ledgerTrack) {
      els.ledgerTrack.style.transform = "translate3d(-" + ledgerStep * 33.333333 + "%, 0, 0)";
    }
    els.ledgerDots.forEach(function (dot, i) {
      dot.classList.toggle("ledger-dot--active", i === ledgerStep);
    });
    if (ledgerStep === 1) {
      setTimeout(function () {
        els.ledgerMemo.focus();
      }, 320);
    }
    syncLedgerWizUi();
    updateAmountPreview();
  }

  function resetLedgerWizard() {
    ledgerEditingId = null;
    ledgerSelectedDate = todayDate();
    ledgerType = null;
    els.ledgerMemo.value = "";
    ledgerAmountDigits = "";
    ledgerMood = null;
    ledgerStep = 0;
    document.querySelectorAll(".ledger-type-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    document.querySelectorAll(".ledger-mood").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    if (els.ledgerTrack) els.ledgerTrack.style.transform = "translate3d(0, 0, 0)";
    els.ledgerDots.forEach(function (dot, i) {
      dot.classList.toggle("ledger-dot--active", i === 0);
    });
    updateDateButton();
    renderKeywordChips();
    updateAmountDisplay();
    updateAmountPreview();
    updateStep1Next();
    els.ledgerNext2.disabled = true;
    updateLedgerTicketChrome();
    syncLedgerWizUi();
  }

  /** @param {LedgerEntry} entry */
  function beginEditLedgerEntry(entry) {
    ledgerEditingId = entry.id;
    var d = parseEntryDateKey(entry.dateStr);
    ledgerSelectedDate = d || todayDate();
    ledgerType = entry.type;
    els.ledgerMemo.value = entry.memo || "";
    ledgerAmountDigits =
      entry.amount > 0 ? String(Math.floor(Number(entry.amount))) : "";
    ledgerMood = normalizeExpenseJudge(entry.mood);
    ledgerStep = 0;
    document.querySelectorAll(".ledger-type-btn").forEach(function (b) {
      var t = b.getAttribute("data-type");
      b.setAttribute("aria-pressed", t === entry.type ? "true" : "false");
    });
    document.querySelectorAll(".ledger-mood").forEach(function (b) {
      var m = b.getAttribute("data-mood");
      b.setAttribute("aria-pressed", ledgerMood !== null && m === ledgerMood ? "true" : "false");
    });
    if (els.ledgerTrack) els.ledgerTrack.style.transform = "translate3d(0, 0, 0)";
    els.ledgerDots.forEach(function (dot, i) {
      dot.classList.toggle("ledger-dot--active", i === 0);
    });
    updateDateButton();
    renderKeywordChips();
    updateMemoNext();
    updateAmountDisplay();
    updateAmountPreview();
    updateStep1Next();
    updateLedgerTicketChrome();
    syncLedgerWizUi();
  }

  /** @param {string} id */
  function openEditLedgerById(id) {
    clearLedgerRowSelection();
    var list = loadEntries();
    var entry = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        entry = list[i];
        break;
      }
    }
    if (!entry) return;
    vibrate(12);
    beginEditLedgerEntry(entry);
    if (els.ledgerTicket && typeof els.ledgerTicket.scrollIntoView === "function") {
      els.ledgerTicket.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function updateStep1Next() {
    els.ledgerNext1.disabled = ledgerType === null;
  }

  function updateMemoNext() {
    var ok = (els.ledgerMemo.value || "").trim().length > 0;
    els.ledgerNext2.disabled = !ok;
  }

  function parseAmountFromDigits() {
    if (!ledgerAmountDigits) return 0;
    var n = parseInt(ledgerAmountDigits, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function updateAmountDisplay() {
    var n = parseAmountFromDigits();
    els.ledgerAmountDisplay.textContent = formatWon(n);
    updateAmountPreview();
    updateSaveEnabled();
  }

  function updateAmountPreview() {
    var n = parseAmountFromDigits();
    var w = getWallet();
    var delta = ledgerType === "income" ? n : ledgerType === "expense" ? -n : 0;
    var next = w + delta;
    if (els.ledgerAmountDisplay) {
      els.ledgerAmountDisplay.classList.toggle("ledger-amount-display--debt-preview", next < 0 && n > 0);
    }
    if (els.ledgerTicketRemain) {
      var box = els.ledgerTicketRemain;
      box.textContent = "";
      var sub = document.createElement("span");
      sub.className = "ledger-ticket-remain__sub";
      var br = document.createElement("br");
      var amt = document.createElement("strong");
      amt.className = "ledger-ticket-remain__amt";
      if (ledgerStep === 2 && ledgerType && n > 0) {
        sub.textContent =
          ledgerType === "income" ? "이번 수입을 넣으면 남은 돈" : "이번 지출을 넣으면 남은 돈";
        if (next < 0) amt.classList.add("ledger-ticket-remain__amt--debt");
        amt.textContent = formatWon(next);
      } else {
        sub.textContent = "남은 돈";
        if (w < 0) amt.classList.add("ledger-ticket-remain__amt--debt");
        amt.textContent = formatWon(w);
      }
      box.appendChild(sub);
      box.appendChild(br);
      box.appendChild(amt);
    }
  }

  function updateSaveEnabled() {
    var n = parseAmountFromDigits();
    var needMood = ledgerType !== "income";
    var ok = n > 0 && (!needMood || ledgerMood !== null);
    els.ledgerSave.disabled = !ok;
  }

  function renderKeywordChips() {
    if (!els.ledgerKeywords) return;
    els.ledgerKeywords.innerHTML = "";
    if (!ledgerType) return;
    var top = getTopKeywordsForType(ledgerType);
    top.forEach(function (label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ledger-kw";
      btn.textContent = label;
      btn.addEventListener("click", function () {
        vibrate(12);
        els.ledgerMemo.value = label;
        updateMemoNext();
        els.ledgerMemo.focus();
      });
      els.ledgerKeywords.appendChild(btn);
    });
  }

  function buildNumpad() {
    var nums = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    nums.forEach(function (k) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ledger-numkey";
      btn.textContent = k;
      btn.addEventListener("click", function () {
        vibrate(8);
        if (ledgerAmountDigits.length >= 12) return;
        ledgerAmountDigits += k;
        updateAmountDisplay();
      });
      els.ledgerNumpad.appendChild(btn);
    });
    var back = document.createElement("button");
    back.type = "button";
    back.className = "ledger-numkey";
    back.textContent = "⌫";
    back.setAttribute("aria-label", "한 칸 지우기");
    back.addEventListener("click", function () {
      vibrate(8);
      ledgerAmountDigits = ledgerAmountDigits.slice(0, -1);
      updateAmountDisplay();
    });
    els.ledgerNumpad.appendChild(back);
    var zero = document.createElement("button");
    zero.type = "button";
    zero.className = "ledger-numkey";
    zero.textContent = "0";
    zero.addEventListener("click", function () {
      vibrate(8);
      if (ledgerAmountDigits.length >= 12) return;
      ledgerAmountDigits += "0";
      updateAmountDisplay();
    });
    els.ledgerNumpad.appendChild(zero);
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "ledger-numkey";
    clear.textContent = "C";
    clear.setAttribute("aria-label", "금액 지우기");
    clear.addEventListener("click", function () {
      vibrate(10);
      ledgerAmountDigits = "";
      updateAmountDisplay();
    });
    els.ledgerNumpad.appendChild(clear);
  }

  function updateLedgerViewToggleUi() {
    document.querySelectorAll("[data-ledger-view]").forEach(function (btn) {
      var v = btn.getAttribute("data-ledger-view");
      var on = v === ledgerRecentViewMode;
      btn.classList.toggle("ledger-view-btn--on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function syncLedgerViewPanels() {
    var list = loadEntries();
    var hasData = list.length > 0;
    if (els.ledgerViewPanelList)
      els.ledgerViewPanelList.hidden = !hasData || ledgerRecentViewMode !== "list";
    if (els.ledgerViewPanelTable)
      els.ledgerViewPanelTable.hidden = !hasData || ledgerRecentViewMode !== "ledger";
    if (els.ledgerViewPanelCalendar)
      els.ledgerViewPanelCalendar.hidden = !hasData || ledgerRecentViewMode !== "calendar";
  }

  /** @param {string} [highlightId] */
  function refreshLedgerRecentSection(highlightId) {
    clearLedgerRowSelection();
    var list = loadEntries();
    var hasData = list.length > 0;
    if (els.ledgerEmpty) els.ledgerEmpty.hidden = hasData;
    updateLedgerViewToggleUi();
    syncLedgerViewPanels();
    if (!hasData) {
      if (els.ledgerList) els.ledgerList.innerHTML = "";
      if (els.ledgerTableBody) els.ledgerTableBody.innerHTML = "";
      if (els.ledgerCalGrid) els.ledgerCalGrid.innerHTML = "";
      return;
    }
    if (ledgerRecentViewMode === "list") {
      renderLedgerList(highlightId);
    } else if (ledgerRecentViewMode === "ledger") {
      renderLedgerTableView();
    } else {
      ensureLedgerCalendarMonth();
      renderLedgerCalendarView();
    }
  }

  function renderLedgerTableView() {
    if (!els.ledgerTableBody) return;
    var list = loadEntries();
    var walletMap = computeWalletAfterByEntryId(list);
    var sorted = list.slice().sort(function (a, b) {
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return String(a.id).localeCompare(String(b.id));
    });
    els.ledgerTableBody.innerHTML = "";
    sorted.forEach(function (e) {
      var tr = document.createElement("tr");
      var after = walletMap[e.id];
      var afterNum = typeof after === "number" && Number.isFinite(after) ? after : null;
      var inc = e.type === "income" ? formatWon(e.amount) : "—";
      var exp = e.type === "expense" ? formatWon(e.amount) : "—";
      tr.innerHTML =
        "<td>" +
        escapeHtml(e.dateStr) +
        "</td>" +
        "<td>" +
        escapeHtml(e.memo) +
        "</td>" +
        '<td class="ledger-table__num ledger-table__in">' +
        inc +
        "</td>" +
        '<td class="ledger-table__num ledger-table__out">' +
        exp +
        "</td>" +
        '<td class="ledger-table__num' +
        (afterNum !== null && afterNum < 0 ? " ledger-table__debt" : "") +
        '">' +
        (afterNum !== null ? escapeHtml(formatWon(afterNum)) : "—") +
        "</td>";
      els.ledgerTableBody.appendChild(tr);
    });
  }

  function renderLedgerCalendarView() {
    if (!els.ledgerCalGrid) return;
    var mo = ensureLedgerCalendarMonth();
    if (els.ledgerCalMonthLabel) els.ledgerCalMonthLabel.textContent = formatCalendarMonthTitle(mo);

    var y = mo.getFullYear();
    var m = mo.getMonth();
    var firstDow = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var list = loadEntries();
    var walletAfterById = computeWalletAfterByEntryId(list);

    /** @type {Record<number, { income: number, expense: number, lastAt: number, lastId: string, lastWallet: number | null }>} */
    var byDay = {};
    list.forEach(function (e) {
      var d = parseEntryDateKey(e.dateStr);
      if (!d || d.getFullYear() !== y || d.getMonth() !== m) return;
      var dayNum = d.getDate();
      if (!byDay[dayNum])
        byDay[dayNum] = { income: 0, expense: 0, lastAt: -1, lastId: "", lastWallet: null };
      var slot = byDay[dayNum];
      if (e.type === "income") slot.income += e.amount;
      else slot.expense += e.amount;
      if (
        e.createdAt > slot.lastAt ||
        (e.createdAt === slot.lastAt && String(e.id).localeCompare(String(slot.lastId)) > 0)
      ) {
        slot.lastAt = e.createdAt;
        slot.lastId = e.id;
        var w = walletAfterById[e.id];
        slot.lastWallet = typeof w === "number" && Number.isFinite(w) ? w : null;
      }
    });

    els.ledgerCalGrid.innerHTML = "";
    for (var pad = 0; pad < firstDow; pad++) {
      var idle = document.createElement("div");
      idle.className = "ledger-cal-cell ledger-cal-cell--pad";
      els.ledgerCalGrid.appendChild(idle);
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var cell = document.createElement("div");
      cell.className = "ledger-cal-cell";
      var slot = byDay[day];
      var incS = slot && slot.income > 0 ? formatLedgerCompact(slot.income) : "—";
      var expS = slot && slot.expense > 0 ? formatLedgerCompact(slot.expense) : "—";
      var balS = slot && slot.lastWallet !== null ? formatLedgerCompact(slot.lastWallet) : "—";
      cell.innerHTML =
        '<div class="ledger-cal-day">' +
        day +
        "</div>" +
        '<div class="ledger-cal-lines">' +
        '<span class="ledger-cal-line ledger-cal-line--in">+' +
        escapeHtml(incS) +
        "</span>" +
        '<span class="ledger-cal-line ledger-cal-line--out">−' +
        escapeHtml(expS) +
        "</span>" +
        '<span class="ledger-cal-line ledger-cal-line--bal">' +
        escapeHtml(balS) +
        "</span>" +
        "</div>";
      els.ledgerCalGrid.appendChild(cell);
    }
  }

  /** @param {string} [highlightId] */
  function renderLedgerList(highlightId) {
    var list = loadEntries();
    var walletAfterById = computeWalletAfterByEntryId(list);
    els.ledgerList.innerHTML = "";
    list
      .slice()
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      })
      .forEach(function (e) {
        var li = document.createElement("li");
        li.className = "ledger-row" + (highlightId && e.id === highlightId ? " ledger-row--snap" : "");
        var icon = e.type === "income" ? "💰" : "💸";
        var sign = e.type === "income" ? "+" : "−";
        var amtClass = e.type === "income" ? "ledger-row__amount--income" : "ledger-row__amount--expense";
        var afterW = walletAfterById[e.id];
        var afterNum = typeof afterW === "number" && Number.isFinite(afterW) ? afterW : null;
        var afterBalHtml =
          afterNum !== null
            ? '<div class="ledger-row__after-balance' +
              (afterNum < 0 ? " ledger-row__after-balance--debt" : "") +
              '">' +
              escapeHtml(formatWon(afterNum)) +
              "</div>"
            : "";
        li.innerHTML =
          '<span class="ledger-row__icon" aria-hidden="true">' +
          icon +
          "</span>" +
          '<div class="ledger-row__main">' +
          '<p class="ledger-row__memo">' +
          escapeHtml(e.memo) +
          "</p>" +
          '<p class="ledger-row__meta">' +
          escapeHtml(e.dateStr) +
          " · " +
          (e.type === "income" ? "수입" : "지출") +
          "</p>" +
          "</div>" +
          '<div class="ledger-row__amt-col">' +
          '<div class="ledger-row__amount ' +
          amtClass +
          '">' +
          sign +
          " " +
          formatWon(e.amount).replace("원", "") +
          "원</div>" +
          afterBalHtml +
          "</div>" +
          '<div class="ledger-row__mood">' +
          escapeHtml(moodEmoji(e.mood)) +
          "</div>" +
          '<button type="button" class="ledger-row__edit">수정</button>';
        li.classList.add("ledger-row--clickable");
        li.tabIndex = 0;
        li.setAttribute(
          "aria-label",
          (e.memo || "").replace(/"/g, "'") +
            ", " +
            formatWon(e.amount) +
            (afterNum !== null ? ", 기록 후 " + formatWon(afterNum) : "") +
            ". 눌러 선택 후 수정 버튼을 누르세요."
        );
        (function (entryId, rowEl) {
          var editBtn = rowEl.querySelector(".ledger-row__edit");
          rowEl.addEventListener("click", function (ev) {
            var t = ev.target;
            if (t && t.closest && t.closest(".ledger-row__edit")) return;
            vibrate(10);
            activateLedgerRow(rowEl);
          });
          rowEl.addEventListener("keydown", function (ev) {
            if (ev.target !== rowEl) return;
            if (ev.key !== "Enter" && ev.key !== " ") return;
            ev.preventDefault();
            if (ledgerRowSelectedEl === rowEl && editBtn) {
              editBtn.focus();
              return;
            }
            activateLedgerRow(rowEl);
            if (editBtn) {
              setTimeout(function () {
                editBtn.focus();
              }, 0);
            }
          });
          if (editBtn) {
            editBtn.setAttribute("aria-label", "이 티켓 수정");
            editBtn.addEventListener("click", function (ev) {
              ev.stopPropagation();
              ev.preventDefault();
              vibrate(12);
              openEditLedgerById(entryId);
            });
          }
        })(e.id, li);
        els.ledgerList.appendChild(li);
      });
  }

  /** @param {string} bid */
  function badgeDefById(bid) {
    for (var i = 0; i < BADGE_DEFINITIONS.length; i++) {
      if (BADGE_DEFINITIONS[i].id === bid) return BADGE_DEFINITIONS[i];
    }
    return null;
  }

  /** @param {BadgeDef} def */
  function openBadgeDetail(def) {
    if (!els.modalBadgeDetail) return;
    if (els.badgeDetailImg) {
      els.badgeDetailImg.src = def.image;
      els.badgeDetailImg.alt = def.name;
    }
    els.badgeDetailCategory.textContent = def.category;
    els.badgeDetailName.textContent = def.name;
    els.badgeDetailTrigger.textContent = def.trigger;
    els.badgeDetailInsight.textContent = def.insight;
    openModal(els.modalBadgeDetail);
  }

  function renderBadgeGrid() {
    if (!els.drawerBadgeGrid) return;
    var earned = new Set(loadEarnedBadges());
    els.drawerBadgeGrid.innerHTML = "";
    els.drawerBadgeGrid.className = "drawer-badge-grid";

    BADGE_GRID_ORDER.forEach(function (bid) {
      var def = badgeDefById(bid);
      if (!def) return;
      var has = earned.has(bid);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "drawer-badge-tile" + (has ? " drawer-badge-tile--earned" : "");
      btn.disabled = !has;
      btn.setAttribute("aria-label", has ? def.name + " 뱃지 상세 보기" : def.name + " (미획득)");

      var imgEl = document.createElement("img");
      imgEl.className = "drawer-badge-tile__img";
      imgEl.src = def.image;
      imgEl.alt = "";
      imgEl.width = 56;
      imgEl.height = 56;
      imgEl.loading = "lazy";
      imgEl.decoding = "async";

      var titleEl = document.createElement("span");
      titleEl.className = "drawer-badge-tile__title";
      titleEl.textContent = def.name;

      btn.appendChild(imgEl);
      btn.appendChild(titleEl);

      if (has) {
        btn.addEventListener("click", function () {
          vibrate(12);
          openBadgeDetail(def);
        });
      }

      els.drawerBadgeGrid.appendChild(btn);
    });
  }

  function renderDrawer() {
    if (!els.drawerDayTitle) return;
    var newBadges = syncBadges();
    if (newBadges > 0) {
      vibrate([25, 45, 25]);
    }

    var days = countRecordingDays();
    els.drawerDayTitle.textContent = days > 0 ? "기록 " + days + "일 차" : "기록을 시작해 볼까요?";

    var archives = loadArchives();
    els.drawerArchiveCount.textContent = String(archives.length);
    els.drawerBadgeCount.textContent = String(loadEarnedBadges().length);

    renderBadgeGrid();

    els.drawerArchives.innerHTML = "";
    els.drawerArchivesEmpty.hidden = archives.length > 0;

    archives.forEach(function (a) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "drawer-passbook";
      var spine = document.createElement("span");
      spine.className = "drawer-passbook__spine";
      spine.setAttribute("aria-hidden", "true");
      var body = document.createElement("span");
      body.className = "drawer-passbook__body";
      var kind = document.createElement("p");
      kind.className = "drawer-passbook__kind";
      kind.textContent = a.kind === "goal" ? "목표 기입장" : "자유 기록";
      var title = document.createElement("p");
      title.className = "drawer-passbook__title";
      title.textContent = a.title;
      var sub = document.createElement("p");
      sub.className = "drawer-passbook__sub";
      if (a.kind === "goal" && typeof a.targetAmount === "number") {
        sub.textContent =
          "목표 " + formatWon(a.targetAmount) + " · 티켓 " + a.entries.length + "장 · " + formatArchiveWhen(a.closedAt);
      } else {
        sub.textContent = "티켓 " + a.entries.length + "장 · " + formatArchiveWhen(a.closedAt);
      }
      body.appendChild(kind);
      body.appendChild(title);
      body.appendChild(sub);
      var chev = document.createElement("span");
      chev.className = "drawer-passbook__chev";
      chev.setAttribute("aria-hidden", "true");
      chev.textContent = "›";
      btn.appendChild(spine);
      btn.appendChild(body);
      btn.appendChild(chev);
      btn.addEventListener("click", function () {
        vibrate(10);
        openArchiveDetail(a.id);
      });
      els.drawerArchives.appendChild(btn);
    });
  }

  /** @param {string} archiveId */
  function openArchiveDetail(archiveId) {
    var book = null;
    loadArchives().forEach(function (a) {
      if (a.id === archiveId) book = a;
    });
    if (!book) {
      archiveDetailOpenId = null;
      return;
    }

    els.archiveDetailTitle.textContent = book.kind === "goal" ? "목표 통장" : "자유 기록 통장";
    var meta = "";
    if (book.kind === "goal" && typeof book.targetAmount === "number") {
      meta =
        "「" +
        book.title +
        "」 · 목표 " +
        formatWon(book.targetAmount) +
        " · 마감 지갑 " +
        formatWon(book.walletAtClose);
    } else {
      meta = "마감 지갑 " + formatWon(book.walletAtClose);
    }
    meta += " · 보관일 " + formatArchiveWhen(book.closedAt);
    els.archiveDetailMeta.textContent = meta;

    els.archiveDetailList.innerHTML = "";
    book.entries
      .slice()
      .sort(function (x, y) {
        return y.createdAt - x.createdAt;
      })
      .forEach(function (e) {
        var li = document.createElement("li");
        li.className = "archive-detail__item";
        var icon = e.type === "income" ? "💰" : "💸";
        var sign = e.type === "income" ? "+" : "−";
        li.innerHTML =
          "<strong>" +
          icon +
          " " +
          escapeHtml(e.memo) +
          "</strong>" +
          escapeHtml(e.dateStr) +
          " · " +
          (e.type === "income" ? "수입" : "지출") +
          " · " +
          sign +
          " " +
          formatWon(e.amount) +
          "<br/>" +
          escapeHtml(moodEmoji(e.mood));
        els.archiveDetailList.appendChild(li);
      });

    archiveDetailOpenId = archiveId;
    openModal(els.modalArchiveDetail);
  }

  function archiveGoalAfterCelebrate() {
    vibrate([25, 50, 25]);
    if (!state || state.mode !== "goal") {
      closeModal(els.modalGoalCelebrate);
      return;
    }
    var entries = loadEntries().slice();
    var book = /** @type {ArchiveBook} */ ({
      id: "arch-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
      kind: "goal",
      closedAt: Date.now(),
      title: state.itemName,
      targetAmount: state.targetAmount,
      walletAtClose: state.startAmount,
      entries: entries,
    });
    pushArchive(book);
    saveEntries([]);
    state = null;
    saveState(null);
    closeModal(els.modalGoalCelebrate);
    refreshGoalUI();
    resetLedgerWizard();
    refreshLedgerRecentSection();
    if (syncBadges() > 0) {
      vibrate([25, 45, 25]);
    }
    showPanel("drawer");
  }

  /** 목표 다시 정하기: 진행 중인 목표 기입장을 서랍에 넣고 목표 설정 화면으로 */
  function archiveCurrentGoalAndStartNew() {
    if (!state || state.mode !== "goal") return;
    vibrate([20, 40, 20]);
    var entries = loadEntries().slice();
    var book = /** @type {ArchiveBook} */ ({
      id: "arch-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
      kind: "goal",
      closedAt: Date.now(),
      title: state.itemName,
      targetAmount: state.targetAmount,
      walletAtClose: state.startAmount,
      entries: entries,
    });
    pushArchive(book);
    saveEntries([]);
    pendingGoal = null;
    state = null;
    saveState(null);
    els.goalName.value = "";
    els.goalTarget.value = "";
    els.goalStart.value = "";
    goalDraftEmoji = DEFAULT_GOAL_EMOJI;
    showPanel("goal");
    refreshGoalUI();
    resetLedgerWizard();
    refreshLedgerRecentSection();
    if (syncBadges() > 0) {
      vibrate([25, 45, 25]);
    }
  }

  function archiveFreeSession() {
    vibrate([25, 50, 25]);
    if (!state || state.mode !== "free") {
      closeModal(els.modalFreeArchive);
      return;
    }
    var entries = loadEntries().slice();
    var book = /** @type {ArchiveBook} */ ({
      id: "arch-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
      kind: "free",
      closedAt: Date.now(),
      title: "자유 기록",
      walletAtClose: state.balance,
      entries: entries,
    });
    pushArchive(book);
    saveEntries([]);
    state = null;
    saveState(null);
    closeModal(els.modalFreeArchive);
    refreshGoalUI();
    resetLedgerWizard();
    refreshLedgerRecentSection();
    if (syncBadges() > 0) {
      vibrate([25, 45, 25]);
    }
    showPanel("drawer");
  }

  function openModal(el) {
    el.hidden = false;
  }

  function closeModal(el) {
    el.hidden = true;
  }

  function openCalendar() {
    calendarView = new Date(ledgerSelectedDate.getTime());
    renderCalendarGrid();
    openModal(els.modalCalendar);
  }

  function renderCalendarGrid() {
    var y = calendarView.getFullYear();
    var m = calendarView.getMonth();
    els.calendarTitle.textContent = y + "년 " + (m + 1) + "월";
    els.calendarGrid.innerHTML = "";
    var first = new Date(y, m, 1);
    var startPad = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var t = todayDate();
    var sel = ledgerSelectedDate;

    for (var i = 0; i < startPad; i++) {
      var d = prevDays - startPad + i + 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day calendar-day--muted";
      btn.textContent = String(d);
      btn.disabled = true;
      els.calendarGrid.appendChild(btn);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      (function (dayNum) {
        var dt = new Date(y, m, dayNum);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "calendar-day";
        btn.textContent = String(dayNum);
        if (
          dt.getFullYear() === t.getFullYear() &&
          dt.getMonth() === t.getMonth() &&
          dt.getDate() === t.getDate()
        ) {
          btn.classList.add("calendar-day--today");
        }
        if (
          dt.getFullYear() === sel.getFullYear() &&
          dt.getMonth() === sel.getMonth() &&
          dt.getDate() === sel.getDate()
        ) {
          btn.classList.add("calendar-day--selected");
        }
        btn.addEventListener("click", function () {
          vibrate(12);
          ledgerSelectedDate = dt;
          updateDateButton();
          closeModal(els.modalCalendar);
        });
        els.calendarGrid.appendChild(btn);
      })(day);
    }

    var cells = startPad + daysInMonth;
    var rest = cells % 7 === 0 ? 0 : 7 - (cells % 7);
    for (var j = 0; j < rest; j++) {
      var b2 = document.createElement("button");
      b2.type = "button";
      b2.className = "calendar-day calendar-day--muted";
      b2.textContent = String(j + 1);
      b2.disabled = true;
      els.calendarGrid.appendChild(b2);
    }
  }

  function trySwitchTab(tabName) {
    markVisitToday();
    if (tabName === "goal") {
      showPanel("goal");
      refreshGoalUI();
      return;
    }
    if (!isSetupComplete(state) && tabName !== "drawer") {
      openModal(els.modalRedirect);
      return;
    }
    showPanel(tabName);
    refreshGoalUI();
  }

  /** @return {boolean} 목표 달성 직후인지 */
  function persistEntry(entry) {
    markVisitToday();
    var list = loadEntries();
    list.push(entry);
    saveEntries(list);
    bumpKeywordForType(entry.memo, entry.type);
    var amt = entry.amount;
    var w = getWallet();
    var wasBelowTarget = !!(state && state.mode === "goal" && state.startAmount < state.targetAmount);
    if (entry.type === "income") setWallet(w + amt);
    else setWallet(w - amt);
    var goalJustCompleted = !!(
      wasBelowTarget &&
      state &&
      state.mode === "goal" &&
      state.startAmount >= state.targetAmount
    );
    refreshGoalUI();
    refreshLedgerChrome();
    if (syncBadges() > 0) {
      vibrate([25, 45, 25]);
    }
    return goalJustCompleted;
  }

  /** @param {string} newEntryId @param {boolean} celebrateGoal */
  function runSaveAnimation(newEntryId, celebrateGoal) {
    vibrate([20, 40, 25]);
    els.ledgerTicket.classList.add("ledger-ticket--exit");
    var finished = false;
    function cleanup() {
      if (finished) return;
      finished = true;
      clearTimeout(fallbackTimer);
      els.ledgerTicket.removeEventListener("transitionend", onEnd);
      els.ledgerTicket.classList.remove("ledger-ticket--exit");
      resetLedgerWizard();
      goLedgerStep(0);
      refreshLedgerRecentSection(newEntryId);
      if (celebrateGoal) {
        if (els.modalCelebrateBody && state && state.mode === "goal") {
          els.modalCelebrateBody.textContent =
            "「" +
            state.itemName +
            "」 목표 금액을 달성했어요! 계속 기록하시겠어요, 아니면 성공으로 마무리하고 서랍에 보관할까요?";
        }
        openModal(els.modalGoalCelebrate);
      }
    }
    var onEnd = function (ev) {
      if (ev.target !== els.ledgerTicket) return;
      if (ev.propertyName !== "transform" && ev.propertyName !== "opacity") return;
      cleanup();
    };
    els.ledgerTicket.addEventListener("transitionend", onEnd);
    var fallbackTimer = setTimeout(cleanup, 500);
  }

  document.querySelectorAll(".ledger-type-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      vibrate(12);
      var t = /** @type {'income'|'expense'} */ (btn.getAttribute("data-type"));
      ledgerType = t;
      document.querySelectorAll(".ledger-type-btn").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      updateStep1Next();
      updateAmountPreview();
      syncLedgerWizUi();
    });
  });

  els.ledgerDateBtn.addEventListener("click", function () {
    vibrate(10);
    openCalendar();
  });

  els.ledgerNext1.addEventListener("click", function () {
    vibrate(12);
    goLedgerStep(1);
    renderKeywordChips();
    updateMemoNext();
  });

  els.ledgerBack2.addEventListener("click", function () {
    vibrate(10);
    goLedgerStep(0);
  });

  els.ledgerNext2.addEventListener("click", function () {
    vibrate(12);
    goLedgerStep(2);
    updateAmountDisplay();
  });

  els.ledgerBack3.addEventListener("click", function () {
    vibrate(10);
    goLedgerStep(1);
    setTimeout(function () {
      els.ledgerMemo.focus();
    }, 200);
  });

  els.ledgerMemo.addEventListener("input", updateMemoNext);

  document.querySelectorAll(".ledger-mood").forEach(function (btn) {
    btn.addEventListener("click", function () {
      vibrate(12);
      var m = /** @type {'nec'|'des'} */ (btn.getAttribute("data-mood"));
      ledgerMood = m;
      document.querySelectorAll(".ledger-mood").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      updateSaveEnabled();
    });
  });

  els.ledgerSave.addEventListener("click", function () {
    if (els.ledgerSave.disabled) return;
    var memo = (els.ledgerMemo.value || "").trim();
    var n = parseAmountFromDigits();
    if (!ledgerType || n <= 0 || !memo) return;
    if (ledgerType === "expense" && ledgerMood === null) return;

    if (ledgerEditingId) {
      var list = loadEntries();
      var idx = -1;
      for (var j = 0; j < list.length; j++) {
        if (list[j].id === ledgerEditingId) {
          idx = j;
          break;
        }
      }
      if (idx < 0) {
        resetLedgerWizard();
        return;
      }
      var old = list[idx];
      var updated = /** @type {LedgerEntry} */ ({
        id: old.id,
        createdAt: old.createdAt,
        dateStr: formatYYMMDD(ledgerSelectedDate),
        type: ledgerType,
        memo: memo,
        amount: n,
        mood: ledgerType === "income" ? null : ledgerMood,
      });
      var wasBelowTarget = !!(state && state.mode === "goal" && state.startAmount < state.targetAmount);
      var w = getWallet() - walletDeltaForEntry(old) + walletDeltaForEntry(updated);
      setWallet(w);
      list[idx] = updated;
      saveEntries(list);
      if (old.memo.trim() !== memo.trim() || old.type !== ledgerType) {
        bumpKeywordForType(memo, ledgerType);
      }
      markVisitToday();
      refreshGoalUI();
      refreshLedgerChrome();
      var goalJustCompleted = !!(
        wasBelowTarget &&
        state &&
        state.mode === "goal" &&
        state.startAmount >= state.targetAmount
      );
      if (syncBadges() > 0) {
        vibrate([25, 45, 25]);
      } else {
        vibrate([18, 32, 18]);
      }
      resetLedgerWizard();
      refreshLedgerRecentSection(updated.id);
      if (goalJustCompleted && els.modalCelebrateBody && state && state.mode === "goal") {
        els.modalCelebrateBody.textContent =
          "「" +
          state.itemName +
          "」 목표 금액을 달성했어요! 계속 기록하시겠어요, 아니면 성공으로 마무리하고 서랍에 보관할까요?";
        openModal(els.modalGoalCelebrate);
      }
      return;
    }

    var entry = /** @type {LedgerEntry} */ ({
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      dateStr: formatYYMMDD(ledgerSelectedDate),
      type: ledgerType,
      memo: memo,
      amount: n,
      mood: ledgerType === "income" ? null : ledgerMood,
      createdAt: Date.now(),
    });

    var celebrate = persistEntry(entry);
    runSaveAnimation(entry.id, celebrate);
  });

  if (els.ledgerEditCancel) {
    els.ledgerEditCancel.addEventListener("click", function () {
      vibrate(10);
      resetLedgerWizard();
    });
  }

  els.calendarPrev.addEventListener("click", function () {
    vibrate(8);
    calendarView.setMonth(calendarView.getMonth() - 1);
    renderCalendarGrid();
  });

  els.calendarNext.addEventListener("click", function () {
    vibrate(8);
    calendarView.setMonth(calendarView.getMonth() + 1);
    renderCalendarGrid();
  });

  document.querySelectorAll("[data-close-calendar]").forEach(function (node) {
    node.addEventListener("click", function () {
      closeModal(els.modalCalendar);
    });
  });

  if (els.modalGoalCelebrateContinue) {
    els.modalGoalCelebrateContinue.addEventListener("click", function () {
      vibrate(10);
      closeModal(els.modalGoalCelebrate);
    });
  }

  if (els.modalGoalCelebrateArchive) {
    els.modalGoalCelebrateArchive.addEventListener("click", function () {
      archiveGoalAfterCelebrate();
    });
  }

  /** @type {'goal' | 'free' | null} */
  var archiveToDrawerIntent = null;

  els.btnFreeDone.addEventListener("click", function () {
    vibrate(10);
    archiveToDrawerIntent = "free";
    openModal(els.modalFreeArchive);
  });

  if (els.btnGoalDone) {
    els.btnGoalDone.addEventListener("click", function () {
      vibrate(10);
      archiveToDrawerIntent = "goal";
      openModal(els.modalFreeArchive);
    });
  }

  els.modalFreeArchiveNo.addEventListener("click", function () {
    archiveToDrawerIntent = null;
    closeModal(els.modalFreeArchive);
  });

  els.modalFreeArchiveYes.addEventListener("click", function () {
    var intent = archiveToDrawerIntent;
    archiveToDrawerIntent = null;
    closeModal(els.modalFreeArchive);
    if (intent === "goal") {
      archiveCurrentGoalAndStartNew();
      return;
    }
    if (intent === "free") {
      archiveFreeSession();
    }
  });

  document.querySelectorAll("[data-close-archive-detail]").forEach(function (node) {
    node.addEventListener("click", function () {
      archiveDetailOpenId = null;
      closeModal(els.modalArchiveDetail);
    });
  });

  if (els.archiveDetailDelete) {
    els.archiveDetailDelete.addEventListener("click", function () {
      if (!archiveDetailOpenId) return;
      vibrate(10);
      openModal(els.modalArchiveDeleteConfirm);
    });
  }

  if (els.modalArchiveDeleteNo) {
    els.modalArchiveDeleteNo.addEventListener("click", function () {
      closeModal(els.modalArchiveDeleteConfirm);
    });
  }

  if (els.modalArchiveDeleteYes) {
    els.modalArchiveDeleteYes.addEventListener("click", function () {
      var id = archiveDetailOpenId;
      if (!id) {
        closeModal(els.modalArchiveDeleteConfirm);
        return;
      }
      vibrate(12);
      closeModal(els.modalArchiveDeleteConfirm);
      deleteArchiveById(id);
    });
  }

  document.querySelectorAll("[data-close-badge-detail]").forEach(function (node) {
    node.addEventListener("click", function () {
      closeModal(els.modalBadgeDetail);
    });
  });

  els.tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      trySwitchTab(tab.getAttribute("data-tab"));
    });
  });

  els.modalRedirectOk.addEventListener("click", function () {
    closeModal(els.modalRedirect);
    showPanel("goal");
    refreshGoalUI();
  });

  els.goalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (els.goalName.value || "").trim();
    var target = parseInt(String(els.goalTarget.value || "0"), 10);
    var start = parseInt(String(els.goalStart.value || "0"), 10);

    if (!name) {
      els.goalName.focus();
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      els.goalTarget.focus();
      return;
    }
    if (!Number.isFinite(start)) {
      els.goalStart.focus();
      return;
    }

    if (start > target) {
      pendingGoal = {
        itemName: name,
        targetAmount: target,
        startAmount: start,
        goalEmoji: goalDraftEmoji || DEFAULT_GOAL_EMOJI,
      };
      openModal(els.modalOverlap);
      return;
    }

    state = {
      mode: "goal",
      itemName: name,
      targetAmount: target,
      startAmount: start,
      goalEmoji: goalDraftEmoji || DEFAULT_GOAL_EMOJI,
    };
    saveState(state);
    refreshGoalUI();
    trySwitchTab("home");
  });

  els.modalOverlapYes.addEventListener("click", function () {
    closeModal(els.modalOverlap);
    if (pendingGoal) {
      pendingGoal.startAmount = 0;
      state = {
        mode: "goal",
        itemName: pendingGoal.itemName,
        targetAmount: pendingGoal.targetAmount,
        startAmount: 0,
        goalEmoji: pendingGoal.goalEmoji || DEFAULT_GOAL_EMOJI,
      };
      saveState(state);
      els.goalStart.value = "0";
      pendingGoal = null;
      refreshGoalUI();
      trySwitchTab("home");
    }
  });

  els.modalOverlapNo.addEventListener("click", function () {
    closeModal(els.modalOverlap);
    pendingGoal = null;
  });

  els.btnFreeMode.addEventListener("click", function () {
    vibrate(8);
    if (els.modalFreeBalance) els.modalFreeBalance.value = "";
    openModal(els.modalFree);
    requestAnimationFrame(function () {
      if (els.modalFreeBalance) els.modalFreeBalance.focus();
    });
  });

  els.modalFreeCancel.addEventListener("click", function () {
    closeModal(els.modalFree);
  });

  els.modalFreeOk.addEventListener("click", function () {
    var raw = String(els.modalFreeBalance ? els.modalFreeBalance.value : "").trim();
    var bal = raw === "" ? 0 : parseInt(raw, 10);
    if (!Number.isFinite(bal)) {
      vibrate(15);
      if (els.modalFreeBalance) els.modalFreeBalance.focus();
      return;
    }
    vibrate(10);
    closeModal(els.modalFree);
    state = { mode: "free", balance: bal };
    saveState(state);
    refreshGoalUI();
    trySwitchTab("home");
  });

  function performHardReset() {
    vibrate([25, 50, 25]);
    closeModal(els.modalHardReset2);
    closeModal(els.modalHardReset1);
    state = null;
    pendingGoal = null;
    saveState(null);
    try {
      localStorage.removeItem(ENTRIES_KEY);
      localStorage.removeItem(KEYWORDS_KEY);
      localStorage.removeItem(KEYWORDS_EXPENSE_KEY);
      localStorage.removeItem(KEYWORDS_INCOME_KEY);
      localStorage.removeItem(ARCHIVES_KEY);
      localStorage.removeItem(BADGES_KEY);
      localStorage.removeItem(VISIT_DAYS_KEY);
      localStorage.removeItem(LEDGER_RECENT_VIEW_KEY);
    } catch (e) {
      /* ignore */
    }
    ledgerRecentViewMode = "list";
    ledgerCalendarMonth = null;
    els.goalName.value = "";
    els.goalTarget.value = "";
    els.goalStart.value = "";
    goalDraftEmoji = DEFAULT_GOAL_EMOJI;
    showPanel("goal");
    refreshGoalUI();
    resetLedgerWizard();
    refreshLedgerRecentSection();
    updateLedgerViewToggleUi();
  }

  if (els.btnHardReset) {
    els.btnHardReset.addEventListener("click", function () {
      vibrate(10);
      openModal(els.modalHardReset1);
    });
  }
  if (els.modalHardReset1No) {
    els.modalHardReset1No.addEventListener("click", function () {
      closeModal(els.modalHardReset1);
    });
  }
  if (els.modalHardReset1Yes) {
    els.modalHardReset1Yes.addEventListener("click", function () {
      vibrate(12);
      closeModal(els.modalHardReset1);
      openModal(els.modalHardReset2);
    });
  }
  if (els.modalHardReset2No) {
    els.modalHardReset2No.addEventListener("click", function () {
      closeModal(els.modalHardReset2);
    });
  }
  if (els.modalHardReset2Yes) {
    els.modalHardReset2Yes.addEventListener("click", function () {
      performHardReset();
    });
  }

  document.querySelectorAll("[data-close-modal]").forEach(function (node) {
    node.addEventListener("click", function (e) {
      var root = e.target.closest(".modal-root");
      if (root && root.id !== "modal-calendar") root.hidden = true;
    });
  });

  buildNumpad();
  resetLedgerWizard();

  document.querySelectorAll("[data-ledger-view]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var v = btn.getAttribute("data-ledger-view");
      if (v !== "list" && v !== "ledger" && v !== "calendar") return;
      if (v === ledgerRecentViewMode) return;
      vibrate(6);
      ledgerRecentViewMode = v;
      try {
        localStorage.setItem(LEDGER_RECENT_VIEW_KEY, v);
      } catch (e) {
        /* ignore */
      }
      refreshLedgerRecentSection();
    });
  });
  if (els.ledgerCalPrev) {
    els.ledgerCalPrev.addEventListener("click", function () {
      vibrate(6);
      ensureLedgerCalendarMonth();
      ledgerCalendarMonth.setMonth(ledgerCalendarMonth.getMonth() - 1);
      refreshLedgerRecentSection();
    });
  }
  if (els.ledgerCalNext) {
    els.ledgerCalNext.addEventListener("click", function () {
      vibrate(6);
      ensureLedgerCalendarMonth();
      ledgerCalendarMonth.setMonth(ledgerCalendarMonth.getMonth() + 1);
      refreshLedgerRecentSection();
    });
  }

  updateLedgerViewToggleUi();

  if (isSetupComplete(state)) {
    showPanel("home");
  } else {
    showPanel("goal");
  }
  refreshGoalUI();
  markVisitToday();
  syncBadges();
})();
