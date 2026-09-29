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
  { key: "holidayOvertime", label: "휴연", total: true },
  { key: "attendance", label: "근태" },
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
    holiday: 8,
    holidayOvertime: 2.5,
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
    night: 6,
    overnight: 1,
    holiday: 8,
    holidayOvertime: 2,
  },
  earlyLeave: {
    earlyLeave: 4,
  },
  halfAnnualLeave: {
    normal: 4,
    attendance: "반차",
  },
  annualLeave: {
    normal: 8,
    attendance: "연차",
  },
};

let selectedMonth = firstDayOfMonth(new Date());
let statusPage = null;
let statusButton = null;
let titleElement = null;
let calendarObserver = null;
let titleObserver = null;
let statusVisible = false;
let statusFullscreenOwned = false;
let statusFallbackRotation = -90;
let statusHolidays = {};
let statusHolidayLoadPromise = null;
let paidLeaveDirectInputOverride = false;

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function ensureStatusHolidays() {
  if (statusHolidayLoadPromise) {
    return statusHolidayLoadPromise;
  }

  statusHolidayLoadPromise = fetch(
    `${import.meta.env.BASE_URL}holidays.json`,
    { cache: "no-cache" },
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      statusHolidays =
        data && typeof data === "object" && !Array.isArray(data)
          ? data
          : {};
      if (statusVisible) {
        renderStatus();
      }
      return statusHolidays;
    })
    .catch((error) => {
      console.warn("근태현황 공휴일 정보를 불러오지 못했습니다.", error);
      statusHolidays = {};
      return statusHolidays;
    });

  return statusHolidayLoadPromise;
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
    const label = String(record?.label || "").trim();

    if (label === "휴가") {
      return {
        normal: 8,
        attendance: "급휴",
      };
    }

    // 직접 입력한 메모/기타 문구 자체는 근태현황에 표시하지 않되,
    // 회사 근태표의 정상 근무시간은 8시간으로 반영합니다.
    return {
      normal: 8,
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

  return value.toFixed(1);
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

    const date = new Date(year, month, day);
    const dateKey = createDateKey(year, month, day);
    const values = getStatusValues(records[dateKey]);
    const isSaturday = date.getDay() === 6;
    const isSunday = date.getDay() === 0;
    const isRedHoliday = Boolean(statusHolidays[dateKey]) && !isSunday;

    // 회사 근태표 기준: 토요일과 공휴일(일요일 제외)은 정상 8시간.
    // 반차처럼 명시적으로 정상 시간이 있는 기록은 그 값을 우선합니다.
    if (values.normal === undefined && (isSaturday || isRedHoliday)) {
      values.normal = 8;
    }

    return values;
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

function syncStatusLandscapeFallback() {
  if (!statusVisible) {
    document.documentElement.classList.remove(
      "attendance-status-landscape-fallback",
    );
    return;
  }

  const isLandscape = window.innerWidth > window.innerHeight;
  document.documentElement.classList.toggle(
    "attendance-status-landscape-fallback",
    !isLandscape,
  );
  document.documentElement.style.setProperty(
    "--attendance-status-fallback-rotation",
    `${statusFallbackRotation}deg`,
  );
}

function updateStatusFallbackRotation(event) {
  if (
    !statusVisible ||
    !document.documentElement.classList.contains(
      "attendance-status-landscape-fallback",
    )
  ) {
    return;
  }

  const gamma = Number(event?.gamma);
  if (!Number.isFinite(gamma) || Math.abs(gamma) < 45) {
    return;
  }

  statusFallbackRotation = gamma < 0 ? 90 : -90;
  document.documentElement.style.setProperty(
    "--attendance-status-fallback-rotation",
    `${statusFallbackRotation}deg`,
  );
}

function enterStatusLandscapeMode() {
  document.documentElement.classList.add(
    "attendance-status-landscape-active",
  );

  // 시스템 상태바/내비게이션 버튼은 그대로 보이게 두고,
  // 화면 방향만 가로로 맞춥니다. 잠금이 막히면 CSS 회전으로 즉시 대체합니다.
  syncStatusLandscapeFallback();

  const lockLandscape = async () => {
    try {
      const orientation = window.screen?.orientation;
      if (orientation?.lock) {
        await orientation.lock("landscape");
      }
    } catch {
      // CSS fallback keeps the page landscape even when native lock is blocked.
    }

    requestAnimationFrame(syncStatusLandscapeFallback);
  };

  void lockLandscape();
}

function exitStatusLandscapeMode() {
  document.documentElement.classList.remove(
    "attendance-status-landscape-active",
    "attendance-status-landscape-fallback",
  );
  document.documentElement.style.removeProperty(
    "--attendance-status-fallback-rotation",
  );

  try {
    window.screen?.orientation?.unlock?.();
  } catch {
    // Ignore browsers without orientation unlock support.
  }

  statusFullscreenOwned = false;
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

function restoreStatusAfterResume() {
  if (!statusVisible || !statusPage) {
    return;
  }

  document.documentElement.classList.add(
    "attendance-status-landscape-active",
  );

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
  syncStatusLandscapeFallback();

  requestAnimationFrame(() => {
    normalizeStatusRootClasses();
    syncStatusLandscapeFallback();
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
  const salaryNavigation = document.querySelector('[data-app-navigation="salary"]');
  salaryNavigation?.click();

  selectedMonth = readAttendanceMonth();
  statusVisible = true;
  enterStatusLandscapeMode();

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
      const fallbackRotated = document.documentElement.classList.contains(
        "attendance-status-landscape-fallback",
      );
      const rotation = statusFallbackRotation >= 0 ? 90 : -90;
      const visualDeltaX = fallbackRotated
        ? (rotation > 0 ? deltaY : -deltaY)
        : deltaX;
      const visualDeltaY = fallbackRotated
        ? deltaX
        : deltaY;

      if (
        Math.abs(visualDeltaX) < 54 ||
        Math.abs(visualDeltaX) <= Math.abs(visualDeltaY)
      ) {
        return;
      }

      changeSelectedMonth(visualDeltaX < 0 ? 1 : -1);
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
      restoreStatusAfterResume();
    }
  });

  window.addEventListener("resize", () => {
    if (statusVisible) {
      syncStatusLandscapeFallback();
    }
  });

  window.addEventListener("orientationchange", () => {
    if (statusVisible) {
      window.setTimeout(syncStatusLandscapeFallback, 80);
    }
  });

  window.addEventListener(
    "deviceorientation",
    updateStatusFallbackRotation,
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && statusVisible) {
      restoreStatusAfterResume();
    }
  });

  window.addEventListener("pageshow", () => {
    if (statusVisible) {
      restoreStatusAfterResume();
    }
  });

  // 다른 앱으로 전환할 때는 근태현황 상태를 해제하지 않습니다.
  // 다른 앱에서 돌아와도 시스템 UI를 유지한 채 가로모드를 즉시 복원합니다.
  window.addEventListener("pagehide", () => {
    statusFullscreenOwned = false;
  });
}

function updateLeavePickerLabel() {
  const annualLeaveButton = document.querySelector(
    '[data-work-type="annualLeave"]',
  );
  const label = annualLeaveButton?.querySelector("span:last-child");

  if (label && !label.textContent.includes("휴가")) {
    label.textContent = "연차 / 조퇴 / 휴가";
  }
}

function savePaidLeaveThroughExistingEditor() {
  const annualLeaveChoice = document.querySelector("#annualLeaveChoice");
  const workTypeList = document.querySelector("#workTypeList");
  const customButton = workTypeList?.querySelector(
    "[data-custom-work-type]",
  );
  const input = document.querySelector("#customWorkTypeInput");
  const saveButton = document.querySelector("#saveCustomWorkTypeButton");

  if (!customButton || !input || !saveButton) {
    return;
  }

  if (annualLeaveChoice) {
    annualLeaveChoice.hidden = true;
  }
  if (workTypeList) {
    workTypeList.hidden = false;
  }

  customButton.click();

  requestAnimationFrame(() => {
    input.value = "휴가";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    saveButton.click();
  });
}

function installPaidLeaveChoice() {
  const annualLeaveChoice = document.querySelector("#annualLeaveChoice");
  const workTypeList = document.querySelector("#workTypeList");

  if (!annualLeaveChoice || !workTypeList) {
    return false;
  }

  if (!annualLeaveChoice.querySelector("[data-paid-leave-choice]")) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.paidLeaveChoice = "true";
    button.textContent = "휴가";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      savePaidLeaveThroughExistingEditor();
    });
    annualLeaveChoice.appendChild(button);
  }

  updateLeavePickerLabel();

  const workTypeObserver = new MutationObserver(() => {
    updateLeavePickerLabel();
  });
  workTypeObserver.observe(workTypeList, {
    childList: true,
    subtree: true,
  });

  return true;
}

function ensurePaidLeaveChoice() {
  if (installPaidLeaveChoice()) {
    return;
  }

  requestAnimationFrame(ensurePaidLeaveChoice);
}

function getOpenWorkModalDateKey() {
  const title = document.querySelector("#modalTitle")?.textContent || "";
  const match = title.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!match) {
    return "";
  }

  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}-${String(
    Number(match[3]),
  ).padStart(2, "0")}`;
}

function syncPaidLeaveModalPresentation() {
  const workModal = document.querySelector("#workModal");
  if (!workModal?.classList.contains("open")) {
    paidLeaveDirectInputOverride = false;
    return;
  }

  const dateKey = getOpenWorkModalDateKey();
  if (!dateKey) {
    return;
  }

  const record = parseRecords()[dateKey];
  const isVacation = Boolean(
    record &&
      typeof record === "object" &&
      record.type === "custom" &&
      String(record.label || "").trim() === "휴가",
  );

  const workTypeList = document.querySelector("#workTypeList");
  const leaveTile = workTypeList?.querySelector('[data-work-type="annualLeave"]');
  const customTile = workTypeList?.querySelector("[data-custom-work-type]");
  const customEditor = document.querySelector("#customWorkTypeEditor");
  const customInput = document.querySelector("#customWorkTypeInput");

  if (customTile && customTile.dataset.vacationDirectInputFix !== "1") {
    customTile.dataset.vacationDirectInputFix = "1";
    customTile.addEventListener("click", (event) => {
      if (!event.isTrusted) {
        return;
      }

      const activeDateKey = getOpenWorkModalDateKey();
      const activeRecord = activeDateKey
        ? parseRecords()[activeDateKey]
        : null;
      const activeVacation = Boolean(
        activeRecord &&
          typeof activeRecord === "object" &&
          activeRecord.type === "custom" &&
          String(activeRecord.label || "").trim() === "휴가",
      );

      if (!activeVacation) {
        paidLeaveDirectInputOverride = false;
        return;
      }

      paidLeaveDirectInputOverride = true;

      requestAnimationFrame(() => {
        leaveTile?.classList.remove("selected");
        customTile.classList.add("selected");
        if (customEditor) {
          customEditor.hidden = false;
        }
        if (customInput) {
          customInput.value = "";
          customInput.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
          customInput.focus();
        }
      });
    });
  }

  if (!isVacation || paidLeaveDirectInputOverride) {
    return;
  }

  leaveTile?.classList.add("selected");
  customTile?.classList.remove("selected");
  if (customEditor) {
    customEditor.hidden = true;
  }
}

function watchPaidLeaveModalPresentation() {
  const workModal = document.querySelector("#workModal");
  if (!workModal) {
    requestAnimationFrame(watchPaidLeaveModalPresentation);
    return;
  }

  const observer = new MutationObserver(() => {
    requestAnimationFrame(syncPaidLeaveModalPresentation);
  });
  observer.observe(workModal, {
    attributes: true,
    attributeFilter: ["class", "aria-hidden"],
    childList: true,
    subtree: true,
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
  ensurePaidLeaveChoice();
  watchPaidLeaveModalPresentation();
  void ensureStatusHolidays();
  renderStatus();
}

initializeAttendanceStatus();
