import "./attendance-status-v218.css";

const RECORDS_STORAGE_KEY = "cat-attendance-records-v1";
const STATUS_PAGE_ID = "status";
const STATUS_TITLE = "근태현황";

const STATUS_ROWS = [
  { key: "clockIn", label: "출근" },
  { key: "clockOut", label: "퇴근" },
  { key: "late", label: "지각", total: true },
  { key: "earlyLeave", label: "조퇴", total: true },
  { key: "outing", label: "외출", total: true },
  { key: "absence", label: "결근", total: true },
  { key: "normal", label: "정상", total: true },
  { key: "overtime1", label: "연장1", total: true },
  { key: "overtime2", label: "연장2", total: true },
  { key: "night", label: "심야", total: true },
  { key: "overnight", label: "철야", total: true },
  { key: "holiday", label: "휴일", total: true },
  { key: "shutdown", label: "휴업" },
];

const TYPE_STATUS = {
  day: {
    clockIn: "0800",
    clockOut: "1700",
    normal: 8,
  },
  dayOvertime: {
    clockIn: "0800",
    clockOut: "2000",
    normal: 8,
    overtime2: 2.5,
  },
  night: {
    clockIn: "2000",
    clockOut: "0500",
    normal: 8,
    night: 6,
  },
  nightOvertime: {
    clockIn: "2000",
    clockOut: "0800",
    normal: 8,
    overtime2: 2,
    night: 7,
    overnight: 1,
  },
  dayHoliday: {
    clockIn: "0800",
    clockOut: "1700",
    normal: 8,
    holiday: 8,
  },
  dayHolidayOvertime: {
    clockIn: "0800",
    clockOut: "2000",
    normal: 8,
    overtime2: 2.5,
    holiday: 8,
  },
  nightHoliday: {
    clockIn: "2000",
    clockOut: "0500",
    normal: 8,
    night: 6,
    holiday: 8,
  },
  nightHolidayOvertime: {
    clockIn: "2000",
    clockOut: "0800",
    normal: 8,
    overtime2: 2,
    night: 6,
    overnight: 1,
    holiday: 8,
  },
  earlyLeave: {
    earlyLeave: 4,
  },
  halfAnnualLeave: {
    shutdown: "반차",
  },
  annualLeave: {
    shutdown: "연차",
  },
};

let selectedMonth = firstDayOfMonth(new Date());
let statusPage = null;
let statusButton = null;
let titleElement = null;
let calendarObserver = null;
let titleObserver = null;
let statusVisible = false;

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (error) {
    console.warn("근태현황 기록을 불러오지 못했습니다.", error);
    return {};
  }
}

function getRecordType(record) {
  if (typeof record === "string") {
    return record;
  }

  if (record && typeof record === "object" && record.type === "custom") {
    return "custom";
  }

  return "";
}

function getStatusValues(record) {
  const type = getRecordType(record);
  if (type === "custom") {
    return {
      shutdown: String(record?.label || "직접 입력").trim() || "직접 입력",
    };
  }

  return TYPE_STATUS[type] ? { ...TYPE_STATUS[type] } : {};
}

function createDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTotal(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

function countSundays(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  let count = 0;

  for (let day = 1; day <= days; day += 1) {
    if (new Date(year, month, day).getDay() === 0) {
      count += 1;
    }
  }

  return count;
}

function getMonthAttendanceSummary(year, month, records) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const monthRecords = Object.entries(records).filter(([dateKey, record]) => {
    return dateKey.startsWith(prefix) && Boolean(getRecordType(record));
  });

  const hasEarlyLeave = monthRecords.some(([, record]) => {
    return getRecordType(record) === "earlyLeave";
  });

  return {
    recordedDays: monthRecords.length,
    perfect: monthRecords.length > 0 && !hasEarlyLeave ? "Y" : "N",
  };
}

function readAttendanceMonth() {
  const monthTitle = document.querySelector("#monthTitle");
  const match = monthTitle?.textContent?.match(/(\d{4})년\s*(\d{1,2})월/);

  if (!match) {
    return firstDayOfMonth(new Date());
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function renderStatus() {
  if (!statusPage) {
    return;
  }

  const records = parseRecords();
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const valuesByDay = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    if (day > daysInMonth) {
      return {};
    }

    return getStatusValues(records[createDateKey(year, month, day)]);
  });

  const monthLabel = `${year}년 ${String(month + 1).padStart(2, "0")}월`;
  const title = statusPage.querySelector("#attendanceStatusMonthLabel");
  const monthPickerButton = statusPage.querySelector(
    "#attendanceStatusMonthPickerButton",
  );
  const monthInput = statusPage.querySelector(
    "#attendanceStatusMonthInput",
  );
  const tableWrap = statusPage.querySelector("#attendanceStatusTableWrap");
  const footer = statusPage.querySelector("#attendanceStatusFooter");

  title.textContent = `( ${monthLabel} )`;
  if (monthPickerButton) {
    monthPickerButton.textContent = `${year}년 ${month + 1}월`;
  }
  if (monthInput) {
    monthInput.value = `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  const dayHead = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const outside = day > daysInMonth;
    return `<th class="${outside ? "is-outside" : ""}">${day}</th>`;
  }).join("");

  const weekdayHead = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    if (day > daysInMonth) {
      return '<th class="is-outside"></th>';
    }

    const weekday = new Date(year, month, day).getDay();
    const label = ["일", "월", "화", "수", "목", "금", "토"][weekday];
    const className = weekday === 0
      ? "is-sunday"
      : weekday === 6
        ? "is-saturday"
        : "";

    return `<th class="${className}">${label}</th>`;
  }).join("");

  const bodyRows = STATUS_ROWS.map((row) => {
    const numericValues = valuesByDay
      .map((value) => value[row.key])
      .filter((value) => typeof value === "number" && Number.isFinite(value));
    const total = row.total && numericValues.length > 0
      ? numericValues.reduce((sum, value) => sum + value, 0)
      : null;

    const cells = valuesByDay.map((value, index) => {
      const day = index + 1;
      if (day > daysInMonth) {
        return '<td class="is-outside"></td>';
      }

      const cellValue = value[row.key];
      const text = cellValue === undefined ? "" : escapeHtml(cellValue);
      return `<td>${text}</td>`;
    }).join("");

    return `
      <tr>
        <th class="attendance-status-row-label">${row.label}</th>
        <td class="attendance-status-total">${total === null ? "" : formatTotal(total)}</td>
        ${cells}
      </tr>
    `;
  }).join("");

  tableWrap.innerHTML = `
    <table class="attendance-status-table">
      <thead>
        <tr>
          <th rowspan="2" class="attendance-status-corner">구분</th>
          <th rowspan="2" class="attendance-status-sum-head">합계</th>
          ${dayHead}
        </tr>
        <tr>${weekdayHead}</tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;

  const currentSummary = getMonthAttendanceSummary(year, month, records);
  const previousMonth = new Date(year, month - 1, 1);
  const previousSummary = getMonthAttendanceSummary(
    previousMonth.getFullYear(),
    previousMonth.getMonth(),
    records,
  );

  footer.innerHTML = `
    <span>주차수: <strong>${countSundays(year, month)}</strong></span>
    <span>근무일수: <strong>${currentSummary.recordedDays}</strong></span>
    <span>만근: <strong>${currentSummary.perfect}</strong></span>
    <span>전월만근: <strong>${previousSummary.perfect}</strong></span>
  `;
}


function changeSelectedMonth(offset) {
  selectedMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + offset,
    1,
  );
  renderStatus();
}

function enterStatusLandscapeMode() {
  document.documentElement.classList.add(
    "attendance-status-landscape-active",
  );

  try {
    const orientation = window.screen?.orientation;
    if (orientation?.lock) {
      Promise.resolve(orientation.lock("landscape")).catch(() => {});
    }
  } catch {
    // Some browsers only allow orientation lock in installed/fullscreen PWAs.
  }
}

function exitStatusLandscapeMode() {
  document.documentElement.classList.remove(
    "attendance-status-landscape-active",
  );

  try {
    window.screen?.orientation?.unlock?.();
  } catch {
    // Ignore browsers without orientation unlock support.
  }
}

function normalizeStatusRootClasses() {
  if (!statusVisible) {
    return;
  }

  document.documentElement.classList.remove(
    "hours-leave-page-active",
    "mobile-pager-enabled",
    "salary-mobile-pager-enabled",
  );
}

function activateStatusNavigation() {
  const navigationButtons = document.querySelectorAll("[data-app-navigation]");
  navigationButtons.forEach((button) => {
    const active = button === statusButton;
    button.classList.toggle("active", active);
    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function hideStatusPage() {
  if (!statusPage || !statusVisible) {
    return;
  }

  statusVisible = false;
  exitStatusLandscapeMode();
  statusPage.hidden = true;
  statusPage.classList.remove("active");
  statusPage.setAttribute("aria-hidden", "true");
  statusButton?.classList.remove("active");
  statusButton?.removeAttribute("aria-current");
}

function showStatusPage() {
  enterStatusLandscapeMode();

  const salaryNavigation = document.querySelector('[data-app-navigation="salary"]');
  salaryNavigation?.click();

  selectedMonth = readAttendanceMonth();
  statusVisible = true;

  document.querySelectorAll(".app-main > .app-page").forEach((page) => {
    if (page === statusPage) {
      return;
    }

    page.hidden = true;
    page.classList.remove("active");
    page.setAttribute("aria-hidden", "true");
  });

  statusPage.hidden = false;
  statusPage.classList.add("active");
  statusPage.setAttribute("aria-hidden", "false");

  if (titleElement) {
    titleElement.textContent = STATUS_TITLE;
    titleElement.classList.remove("hours-leave-title");
  }

  activateStatusNavigation();
  normalizeStatusRootClasses();
  renderStatus();
  window.scrollTo(0, 0);

  requestAnimationFrame(() => {
    normalizeStatusRootClasses();
    requestAnimationFrame(normalizeStatusRootClasses);
  });
}

function buildStatusPage() {
  const page = document.createElement("section");
  page.className = "app-page attendance-status-page";
  page.dataset.appPage = STATUS_PAGE_ID;
  page.setAttribute("aria-label", "근태현황");
  page.setAttribute("aria-hidden", "true");
  page.hidden = true;
  page.innerHTML = `
    <section class="attendance-status-card">
      <div class="attendance-status-report-title">
        <strong>개인별 월간 근태 현황</strong>
        <span id="attendanceStatusMonthLabel"></span>
      </div>

      <div class="attendance-status-toolbar" aria-label="근태현황 연월 선택">
        <button
          id="attendanceStatusMonthPickerButton"
          class="attendance-status-month-picker-button"
          type="button"
          aria-label="연월 선택"
        ></button>
        <input
          id="attendanceStatusMonthInput"
          class="attendance-status-month-input"
          type="month"
          aria-label="근태현황 연월 선택"
          tabindex="-1"
        />
      </div>

      <div
        id="attendanceStatusTableWrap"
        class="attendance-status-table-wrap"
        aria-label="개인별 월간 근태 현황 표"
      ></div>

      <div id="attendanceStatusFooter" class="attendance-status-footer"></div>
    </section>
  `;

  const monthPickerButton = page.querySelector(
    "#attendanceStatusMonthPickerButton",
  );
  const monthInput = page.querySelector("#attendanceStatusMonthInput");

  monthPickerButton?.addEventListener("click", () => {
    try {
      if (typeof monthInput?.showPicker === "function") {
        monthInput.showPicker();
      } else {
        monthInput?.click();
      }
    } catch {
      monthInput?.click();
    }
  });

  monthInput?.addEventListener("change", () => {
    const match = monthInput.value.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      return;
    }

    selectedMonth = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      1,
    );
    renderStatus();
  });

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeTracking = false;

  page.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) {
        swipeTracking = false;
        return;
      }

      swipeTracking = true;
      swipeStartX = event.touches[0].clientX;
      swipeStartY = event.touches[0].clientY;
    },
    { passive: true },
  );

  page.addEventListener(
    "touchend",
    (event) => {
      if (!swipeTracking || event.changedTouches.length !== 1) {
        swipeTracking = false;
        return;
      }

      swipeTracking = false;
      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const deltaX = endX - swipeStartX;
      const deltaY = endY - swipeStartY;

      if (Math.abs(deltaX) < 54 || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      changeSelectedMonth(deltaX < 0 ? 1 : -1);
    },
    { passive: true },
  );

  return page;
}

function buildStatusButton() {
  const button = document.createElement("button");
  button.className = "navigation-item";
  button.type = "button";
  button.dataset.appNavigation = STATUS_PAGE_ID;
  button.innerHTML = `
    <span class="navigation-icon attendance-status-nav-icon">▤</span>
    <span>근태현황</span>
  `;
  button.addEventListener("click", () => {
    showStatusPage();
    statusPage?.dispatchEvent(new Event("attendance-status-shown"));
  });
  return button;
}

function watchExistingNavigation() {
  document.querySelectorAll("[data-app-navigation]").forEach((button) => {
    if (button === statusButton) {
      return;
    }

    button.addEventListener("click", () => {
      hideStatusPage();
    });
  });
}

function setupObservers() {
  const calendarGrid = document.querySelector("#calendarGrid");
  if (calendarGrid) {
    calendarObserver = new MutationObserver(() => {
      if (statusVisible) {
        renderStatus();
      }
    });
    calendarObserver.observe(calendarGrid, {
      childList: true,
      subtree: true,
    });
  }

  if (titleElement) {
    titleObserver = new MutationObserver(() => {
      if (!statusVisible) {
        return;
      }

      if (titleElement.textContent?.trim() !== STATUS_TITLE) {
        hideStatusPage();
      }
    });
    titleObserver.observe(titleElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === RECORDS_STORAGE_KEY && statusVisible) {
      renderStatus();
    }
  });

  window.addEventListener("focus", () => {
    if (statusVisible) {
      renderStatus();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && statusVisible) {
      renderStatus();
    }
  });

  window.addEventListener("pagehide", () => {
    if (statusVisible) {
      exitStatusLandscapeMode();
    }
  });
}

function initializeAttendanceStatus() {
  const navigationList = document.querySelector(".navigation-list");
  const attendanceNavigation = navigationList?.querySelector(
    '[data-app-navigation="attendance"]',
  );
  const appMain = document.querySelector(".app-main");
  const salaryPage = appMain?.querySelector('[data-app-page="salary"]');
  titleElement = document.querySelector("#appPageTitle");

  if (!navigationList || !attendanceNavigation || !appMain || !titleElement) {
    requestAnimationFrame(initializeAttendanceStatus);
    return;
  }

  if (document.querySelector('[data-app-navigation="status"]')) {
    return;
  }

  statusButton = buildStatusButton();
  attendanceNavigation.insertAdjacentElement("afterend", statusButton);

  statusPage = buildStatusPage();
  if (salaryPage) {
    appMain.insertBefore(statusPage, salaryPage);
  } else {
    appMain.appendChild(statusPage);
  }

  watchExistingNavigation();
  setupObservers();
  renderStatus();
}

initializeAttendanceStatus();
