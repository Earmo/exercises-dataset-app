const exercises = Array.isArray(window.EXERCISES_DATA) ? window.EXERCISES_DATA : [];
const pageSize = 40;
const mediaBaseUrl = "https://static.exercisedb.dev/media";

const labels = {
  waist: "腰腹",
  back: "背部",
  chest: "胸部",
  "upper arms": "上臂",
  "upper legs": "大腿",
  shoulders: "肩部",
  "lower arms": "前臂",
  "lower legs": "小腿",
  cardio: "有氧",
  neck: "颈部",
  "body weight": "自重",
  dumbbell: "哑铃",
  barbell: "杠铃",
  cable: "绳索",
  leverage: "器械",
  kettlebell: "壶铃",
  band: "弹力带",
  "medicine ball": "药球",
  "stability ball": "健身球",
  "ez barbell": "EZ 杠",
  "trap bar": "六角杠",
  "smith machine": "史密斯机",
  assisted: "辅助器械",
  "upper back": "上背",
  abs: "腹肌",
  biceps: "肱二头肌",
  triceps: "肱三头肌",
  glutes: "臀肌",
  quads: "股四头肌",
  hamstrings: "腘绳肌",
  calves: "小腿肌群",
  delts: "三角肌",
  lats: "背阔肌",
  pectorals: "胸肌",
  forearms: "前臂肌群",
  traps: "斜方肌",
  adductors: "内收肌",
  abductors: "外展肌",
};

const state = {
  query: "",
  category: "",
  equipment: "",
  target: "",
  visible: pageSize,
  filtered: exercises,
};

const el = {
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categorySelect"),
  equipment: document.querySelector("#equipmentSelect"),
  target: document.querySelector("#targetSelect"),
  quickFilter: document.querySelector("#quickFilter"),
  grid: document.querySelector("#exerciseGrid"),
  loadMore: document.querySelector("#loadMoreButton"),
  resultCount: document.querySelector("#resultCount"),
  bodyPartCount: document.querySelector("#bodyPartCount"),
  equipmentCount: document.querySelector("#equipmentCount"),
  random: document.querySelector("#randomButton"),
  sheet: document.querySelector("#detailSheet"),
  backdrop: document.querySelector("#sheetBackdrop"),
  close: document.querySelector("#closeDetail"),
  detailImage: document.querySelector("#detailImage"),
  detailMeta: document.querySelector("#detailMeta"),
  detailTitle: document.querySelector("#detailTitle"),
  detailTags: document.querySelector("#detailTags"),
  detailSteps: document.querySelector("#detailSteps"),
};

function zh(value) {
  return labels[value] || value || "未知";
}

function uniqueValues(key) {
  return [...new Set(exercises.map((item) => item[key]).filter(Boolean))].sort((a, b) =>
    zh(a).localeCompare(zh(b), "zh-Hans-CN"),
  );
}

function optionMarkup(label, value = "") {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = optionMarkup(allLabel) + values.map((value) => optionMarkup(zh(value), value)).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imagePath(item) {
  return item.media_id ? `${mediaBaseUrl}/${item.media_id}.gif` : "";
}

function matchesQuery(item, query) {
  if (!query) {
    return true;
  }
  const haystack = [
    item.name,
    item.category,
    zh(item.category),
    item.body_part,
    item.equipment,
    zh(item.equipment),
    item.target,
    zh(item.target),
    ...(item.secondary_muscles || []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function applyFilters() {
  const query = state.query.trim().toLowerCase();
  state.filtered = exercises.filter((item) => {
    return (
      matchesQuery(item, query) &&
      (!state.category || item.category === state.category) &&
      (!state.equipment || item.equipment === state.equipment) &&
      (!state.target || item.target === state.target)
    );
  });
  state.visible = pageSize;
  render();
}

function renderStats() {
  el.resultCount.textContent = state.filtered.length.toLocaleString("zh-CN");
  el.bodyPartCount.textContent = uniqueValues("category").length;
  el.equipmentCount.textContent = uniqueValues("equipment").length;
}

function renderQuickFilters() {
  const preferred = ["waist", "chest", "back", "shoulders", "upper arms", "upper legs", "lower legs", "cardio"];
  el.quickFilter.innerHTML = [
    `<button class="chip ${state.category ? "" : "active"}" data-category="" type="button">全部</button>`,
    ...preferred.map(
      (category) =>
        `<button class="chip ${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}" type="button">${escapeHtml(zh(category))}</button>`,
    ),
  ].join("");
}

function cardMarkup(item) {
  return `
    <button class="exercise-card" type="button" data-id="${escapeHtml(item.id)}">
      <div class="card-media">
        <img src="${escapeHtml(imagePath(item))}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
      </div>
      <div class="card-body">
        <strong class="card-title">${escapeHtml(item.name)}</strong>
        <div class="meta-row">
          <span class="meta-pill">${escapeHtml(zh(item.category))}</span>
          <span class="meta-pill">${escapeHtml(zh(item.equipment))}</span>
        </div>
      </div>
    </button>
  `;
}

function renderGrid() {
  const items = state.filtered.slice(0, state.visible);
  if (items.length === 0) {
    el.grid.innerHTML = `<div class="empty-state">没有找到匹配动作，换个关键词或筛选条件试试。</div>`;
  } else {
    el.grid.innerHTML = items.map(cardMarkup).join("");
  }
  el.loadMore.hidden = state.visible >= state.filtered.length;
}

function render() {
  renderStats();
  renderQuickFilters();
  renderGrid();
}

function openDetail(item) {
  el.detailImage.src = imagePath(item);
  el.detailImage.alt = item.name;
  el.detailMeta.textContent = `${zh(item.category)} / ${zh(item.target)}`;
  el.detailTitle.textContent = item.name;

  const tags = [zh(item.equipment), ...(item.secondary_muscles || []).map(zh)];
  el.detailTags.innerHTML = tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

  const steps = item.instruction_steps?.zh || item.instruction_steps?.en || [];
  el.detailSteps.innerHTML = steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");

  el.sheet.classList.add("open");
  el.sheet.setAttribute("aria-hidden", "false");
}

function closeDetail() {
  el.sheet.classList.remove("open");
  el.sheet.setAttribute("aria-hidden", "true");
  el.detailImage.removeAttribute("src");
}

window.handleAndroidBack = function handleAndroidBack() {
  if (el.sheet.classList.contains("open")) {
    closeDetail();
    return true;
  }
  return false;
};

fillSelect(el.category, uniqueValues("category"), "全部部位");
fillSelect(el.equipment, uniqueValues("equipment"), "全部器械");
fillSelect(el.target, uniqueValues("target"), "全部目标");
render();

el.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  applyFilters();
});

el.category.addEventListener("change", (event) => {
  state.category = event.target.value;
  applyFilters();
});

el.equipment.addEventListener("change", (event) => {
  state.equipment = event.target.value;
  applyFilters();
});

el.target.addEventListener("change", (event) => {
  state.target = event.target.value;
  applyFilters();
});

el.quickFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }
  state.category = button.dataset.category;
  el.category.value = state.category;
  applyFilters();
});

el.grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (!card) {
    return;
  }
  const item = exercises.find((entry) => entry.id === card.dataset.id);
  if (item) {
    openDetail(item);
  }
});

el.loadMore.addEventListener("click", () => {
  state.visible += pageSize;
  renderGrid();
});

el.random.addEventListener("click", () => {
  const pool = state.filtered.length > 0 ? state.filtered : exercises;
  const item = pool[Math.floor(Math.random() * pool.length)];
  if (item) {
    openDetail(item);
  }
});

el.close.addEventListener("click", closeDetail);
el.backdrop.addEventListener("click", closeDetail);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDetail();
  }
});
