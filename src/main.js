import "./style.css";

const STORAGE_KEY = "cat-attendance-records-v1";
const SETTINGS_KEY = "cat-attendance-settings-by-month-v2";
const PREVIOUS_SETTINGS_KEY = "cat-attendance-settings-v2";
const LEGACY_SETTINGS_KEY = "cat-attendance-settings-v1";

const DEFAULT_SETTINGS = {
  baseHourlyWage: 0,
  safetyAllowance: 0,
  longevityAllowance: 0,
};

const WORK_TYPES = [
  {
    id: "day",
    label: "주간",
    totals: {
      regularDays: 1,
    },
  },
  {
    id: "night",
    label: "야간",
    totals: {
      regularDays: 1,
      nightHours: 6,
    },
  },
  {
    id: "dayOvertime",
    label: "주간잔업",
    totals: {
      regularDays: 1,
      overtimeHours: 2.5,
    },
  },
  {
    id: "nightOvertime",
    label: "야간잔업",
    totals: {
      regularDays: 1,
      overtimeHours: 2,
      nightHours: 7,
      overnightHours: 1,
    },
  },
  {
    id: "dayHoliday",
    label: "주간특근",
    totals: {
      holidayHours: 8,
    },
  },
  {
    id: "nightHoliday",
    label: "야간특근",
    totals: {
      holidayHours: 8,
      nightHours: 6,
    },
  },
  {
    id: "dayHolidayOvertime",
    label: "주간특근잔업",
    totals: {
      holidayHours: 8,
      holidayOvertimeHours: 2.5,
    },
  },
  {
    id: "nightHolidayOvertime",
    label: "야간특근잔업",
    totals: {
      holidayHours: 8,
      holidayOvertimeHours: 2,
      nightHours: 6,
      overnightHours: 1,
    },
  },
  {
    id: "annualLeave",
    label: "연차",
    totals: {
      regularDays: 1,
    },
  },
];

let currentMonth = new Date();

currentMonth = new Date(
  currentMonth.getFullYear(),
  currentMonth.getMonth(),
  1,
);

let selectedDateKey = null;
let records = loadRecords();
let settingsByMonth = loadSettingsByMonth();

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="header-caption">근무 기록과 급여 관리</p>
        <h1>CAT 근태관리</h1>
      </div>

      <div class="header-icon" aria-hidden="true">
        ₩
      </div>
    </header>

    <main class="main-content">
      <section class="calendar-card">
        <div class="calendar-toolbar">
          <button
            id="previousMonth"
            class="month-button"
            type="button"
            aria-label="이전 달"
          >
            ‹
          </button>

          <h2 id="monthTitle"></h2>

          <button
            id="nextMonth"
            class="month-button"
            type="button"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        <div class="calendar-actions">
          <button
            id="todayButton"
            class="today-button"
            type="button"
          >
            이번 달로 이동
          </button>

          <button
            id="resetMonthButton"
            class="reset-month-button"
            type="button"
          >
            이번 달 기록 초기화
          </button>
        </div>

        <div class="weekdays" aria-hidden="true">
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div class="saturday">토</div>
          <div class="sunday">일</div>
        </div>

        <div id="calendarGrid" class="calendar-grid"></div>
      </section>

      <section class="summary-card">
        <div class="section-title-row">
          <div>
            <p class="section-caption">월간 현황</p>
            <h2>근무 기록 요약</h2>
          </div>

          <div id="recordedDays" class="recorded-days">
            0일
          </div>
        </div>

        <div id="summaryGrid" class="summary-grid"></div>
      </section>

      <section class="salary-card">
        <div class="salary-heading">
          <div>
            <p class="section-caption">자동 급여 계산</p>
            <h2 id="salaryMonthTitle">이번 달 예상 급여</h2>
          </div>

          <div class="ordinary-wage-box">
            <span>통상시급</span>
            <strong id="ordinaryHourlyWageOutput">0원</strong>
          </div>
        </div>

        <div class="salary-layout">
          <section class="salary-panel settings-panel">
            <h3>급여 설정</h3>

            <label class="salary-input-row">
              <span>기본시급</span>

              <div class="input-with-unit">
                <input
                  id="baseHourlyWage"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  placeholder="0"
                  value=""
                />
                <span>원</span>
              </div>
            </label>

            <label class="salary-input-row">
              <span>안전수당</span>

              <div class="input-with-unit">
                <input
                  id="safetyAllowance"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  placeholder="0"
                  value=""
                />
                <span>원</span>
              </div>
            </label>

            <label class="salary-input-row">
              <span>근속수당</span>

              <div class="input-with-unit">
                <input
                  id="longevityAllowance"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  placeholder="0"
                  value=""
                />
                <span>원</span>
              </div>
            </label>

            <p class="formula-note">
              통상시급 = 기본시급 + (안전수당 + 근속수당) ÷ 243
            </p>
          </section>

          <section class="salary-panel">
            <h3>근무시간 집계</h3>
            <div id="workTotalsGrid" class="work-totals-grid"></div>
          </section>

          <section class="salary-panel payment-panel">
            <h3>지급내역</h3>

            <div id="payBreakdown" class="pay-breakdown"></div>

            <div class="total-pay-row">
              <span>예상 총급여</span>
              <strong id="totalPayOutput">0원</strong>
            </div>
          </section>
        </div>
      </section>
    </main>
  </div>

  <div
    id="workModal"
    class="modal"
    aria-hidden="true"
  >
    <div class="modal-backdrop" data-close-modal></div>

    <section
      class="modal-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <div class="modal-header">
        <div>
          <p class="section-caption">근무 형태 선택</p>
          <h2 id="modalTitle">날짜</h2>
        </div>

        <button
          id="closeModalButton"
          class="close-button"
          type="button"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      <div id="workTypeList" class="work-type-list"></div>

      <button
        id="deleteRecordButton"
        class="delete-record-button"
        type="button"
      >
        이 날짜의 기록 삭제
      </button>
    </section>
  </div>
`;

const monthTitle = document.querySelector("#monthTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const summaryGrid = document.querySelector("#summaryGrid");
const recordedDays = document.querySelector("#recordedDays");

const salaryMonthTitle = document.querySelector("#salaryMonthTitle");
const workTotalsGrid = document.querySelector("#workTotalsGrid");
const payBreakdown = document.querySelector("#payBreakdown");

const ordinaryHourlyWageOutput = document.querySelector(
  "#ordinaryHourlyWageOutput",
);

const totalPayOutput = document.querySelector("#totalPayOutput");

const baseHourlyWageInput = document.querySelector(
  "#baseHourlyWage",
);

const safetyAllowanceInput = document.querySelector(
  "#safetyAllowance",
);

const longevityAllowanceInput = document.querySelector(
  "#longevityAllowance",
);

const workModal = document.querySelector("#workModal");
const modalTitle = document.querySelector("#modalTitle");
const workTypeList = document.querySelector("#workTypeList");

const deleteRecordButton = document.querySelector(
  "#deleteRecordButton",
);

document
  .querySelector("#previousMonth")
  .addEventListener("click", () => {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );

    render();
  });

document
  .querySelector("#nextMonth")
  .addEventListener("click", () => {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );

    render();
  });

document
  .querySelector("#todayButton")
  .addEventListener("click", () => {
    const today = new Date();

    currentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    render();
  });

document
  .querySelector("#resetMonthButton")
  .addEventListener("click", () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthText = String(month + 1).padStart(2, "0");
    const monthPrefix = `${year}-${monthText}-`;

    const hasMonthRecords = Object.keys(records).some(
      (dateKey) => dateKey.startsWith(monthPrefix),
    );

    if (!hasMonthRecords) {
      window.alert("이 달에는 초기화할 근무기록이 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      `${year}년 ${month + 1}월 근무기록을 모두 삭제할까요?\n\n기본시급과 수당 설정은 유지됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    Object.keys(records).forEach((dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        delete records[dateKey];
      }
    });

    saveRecords();
    render();
  });

document
  .querySelector("#closeModalButton")
  .addEventListener("click", closeModal);

document
  .querySelector("[data-close-modal]")
  .addEventListener("click", closeModal);

deleteRecordButton.addEventListener("click", () => {
  if (!selectedDateKey) {
    return;
  }

  delete records[selectedDateKey];

  saveRecords();
  closeModal();
  render();
});

[
  baseHourlyWageInput,
  safetyAllowanceInput,
  longevityAllowanceInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    const monthKey = getMonthKey(currentMonth);

    settingsByMonth[monthKey] = {
      baseHourlyWage: getInputNumber(baseHourlyWageInput),
      safetyAllowance: getInputNumber(safetyAllowanceInput),
      longevityAllowance: getInputNumber(
        longevityAllowanceInput,
      ),
    };

    saveSettingsByMonth();
    renderSalary();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

function render() {
  renderCalendar();
  renderSummary();
  syncSalaryInputs();
  renderSalary();
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  monthTitle.textContent = `${year}년 ${month + 1}월`;
  calendarGrid.innerHTML = "";

  const firstDate = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayPosition = (firstDate.getDay() + 6) % 7;
  const today = new Date();

  for (let cellIndex = 0; cellIndex < 42; cellIndex += 1) {
    const dayNumber = cellIndex - firstDayPosition + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const emptyCell = document.createElement("div");

      emptyCell.className = "day-cell empty";
      calendarGrid.appendChild(emptyCell);

      continue;
    }

    const date = new Date(year, month, dayNumber);
    const dateKey = createDateKey(year, month, dayNumber);

    const workTypeId = records[dateKey];
    const workType = getWorkType(workTypeId);

    const dayButton = document.createElement("button");

    dayButton.type = "button";
    dayButton.className = "day-cell";

    if (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNumber
    ) {
      dayButton.classList.add("today");
    }

    if (date.getDay() === 0) {
      dayButton.classList.add("sunday-cell");
    }

    if (date.getDay() === 6) {
      dayButton.classList.add("saturday-cell");
    }

    if (workType) {
      dayButton.classList.add(`type-${workType.id}`);
    }

    dayButton.innerHTML = `
      <span class="day-number">${dayNumber}</span>

      ${
        workType
          ? `<span class="work-badge">${workType.label}</span>`
          : `<span class="empty-record">근무 선택</span>`
      }
    `;

    dayButton.addEventListener("click", () => {
      openModal(dateKey, year, month, dayNumber);
    });

    calendarGrid.appendChild(dayButton);
  }
}

function renderSummary() {
  const stats = calculateMonthStats();

  recordedDays.textContent = `${stats.recordedDays}일`;

  summaryGrid.innerHTML = WORK_TYPES.map(
    (workType) => `
      <div class="summary-item">
        <span class="summary-dot type-${workType.id}"></span>

        <span class="summary-label">
          ${workType.label}
        </span>

        <strong>${stats.counts[workType.id]}일</strong>
      </div>
    `,
  ).join("");
}

function renderSalary() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const stats = calculateMonthStats();
  const settings = getCurrentMonthSettings();

  const baseHourlyWage = Number(settings.baseHourlyWage) || 0;
  const safetyAllowance = Number(settings.safetyAllowance) || 0;

  const longevityAllowance =
    Number(settings.longevityAllowance) || 0;

  const ordinaryHourlyWage =
    baseHourlyWage +
    (safetyAllowance + longevityAllowance) / 243;

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const sundayCount = countSundaysInMonth(year, month);

  const basePayDays = daysInMonth - sundayCount;
  const basePayHours = basePayDays * 8;

  const payments = {
    basePay:
      basePayHours * baseHourlyWage,

    weeklyAllowance:
      sundayCount * 8 * baseHourlyWage,

    overtimePay:
      ordinaryHourlyWage *
      stats.overtimeHours *
      1.5,

    nightPay:
      ordinaryHourlyWage *
      stats.nightHours *
      0.5,

    overnightPay:
      ordinaryHourlyWage *
      stats.overnightHours *
      2,

    holidayPay:
      ordinaryHourlyWage *
      stats.holidayHours *
      1.5,

    holidayOvertimePay:
      ordinaryHourlyWage *
      stats.holidayOvertimeHours *
      2,
  };

  const totalPay =
    payments.basePay +
    payments.weeklyAllowance +
    payments.overtimePay +
    payments.nightPay +
    payments.overnightPay +
    payments.holidayPay +
    payments.holidayOvertimePay +
    safetyAllowance +
    longevityAllowance;

  salaryMonthTitle.textContent =
    `${year}년 ${month + 1}월 예상 급여`;

  ordinaryHourlyWageOutput.textContent =
    formatMoney(ordinaryHourlyWage);

  totalPayOutput.textContent = formatMoney(totalPay);

  const workTotals = [
    [
      "근무기록 일수",
      `${formatNumber(stats.regularDays)}일`,
    ],
    [
      "기본급 적용일수",
      `${basePayDays}일`,
    ],
    [
      "일요일 수",
      `${sundayCount}일`,
    ],
    [
      "기본급 시간",
      `${basePayHours}시간`,
    ],
    [
      "연장시간",
      `${formatNumber(stats.overtimeHours)}시간`,
    ],
    [
      "심야시간",
      `${formatNumber(stats.nightHours)}시간`,
    ],
    [
      "철야시간",
      `${formatNumber(stats.overnightHours)}시간`,
    ],
    [
      "휴일시간",
      `${formatNumber(stats.holidayHours)}시간`,
    ],
    [
      "휴연시간",
      `${formatNumber(stats.holidayOvertimeHours)}시간`,
    ],
  ];

  workTotalsGrid.innerHTML = workTotals
    .map(
      ([label, value]) => `
        <div class="work-total-row">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");

  const paymentRows = [
    ["기본급", payments.basePay],
    ["주차수당", payments.weeklyAllowance],
    ["연장수당", payments.overtimePay],
    ["심야수당", payments.nightPay],
    ["철야수당", payments.overnightPay],
    ["휴일수당", payments.holidayPay],
    ["휴연수당", payments.holidayOvertimePay],
    ["안전수당", safetyAllowance],
    ["근속수당", longevityAllowance],
  ];

  payBreakdown.innerHTML = paymentRows
    .map(
      ([label, value]) => `
        <div class="payment-row">
          <span>${label}</span>
          <strong>${formatMoney(value)}</strong>
        </div>
      `,
    )
    .join("");
}

function calculateMonthStats() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const stats = {
    recordedDays: 0,
    regularDays: 0,
    overtimeHours: 0,
    nightHours: 0,
    overnightHours: 0,
    holidayHours: 0,
    holidayOvertimeHours: 0,
    counts: {},
  };

  WORK_TYPES.forEach((workType) => {
    stats.counts[workType.id] = 0;
  });

  for (const [dateKey, workTypeId] of Object.entries(records)) {
    const recordDate = parseDateKey(dateKey);

    if (
      recordDate.year !== year ||
      recordDate.month !== month
    ) {
      continue;
    }

    const workType = getWorkType(workTypeId);

    if (!workType) {
      continue;
    }

    stats.recordedDays += 1;
    stats.counts[workType.id] += 1;

    Object.entries(workType.totals).forEach(
      ([totalName, value]) => {
        stats[totalName] += value;
      },
    );
  }

  return stats;
}

function countSundaysInMonth(year, month) {
  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  let sundayCount = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);

    if (date.getDay() === 0) {
      sundayCount += 1;
    }
  }

  return sundayCount;
}

function openModal(dateKey, year, month, dayNumber) {
  selectedDateKey = dateKey;

  modalTitle.textContent =
    `${year}년 ${month + 1}월 ${dayNumber}일`;

  const selectedWorkTypeId = records[dateKey];

  workTypeList.innerHTML = WORK_TYPES.map(
    (workType) => `
      <button
        type="button"
        class="work-type-button type-${workType.id}
          ${selectedWorkTypeId === workType.id ? "selected" : ""}"
        data-work-type="${workType.id}"
      >
        <span class="work-type-color"></span>
        <span>${workType.label}</span>
      </button>
    `,
  ).join("");

  workTypeList
    .querySelectorAll("[data-work-type]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const workTypeId = button.dataset.workType;

        records[selectedDateKey] = workTypeId;

        saveRecords();
        closeModal();
        render();
      });
    });

  deleteRecordButton.hidden = !selectedWorkTypeId;

  workModal.classList.add("open");
  workModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  workModal.classList.remove("open");
  workModal.setAttribute("aria-hidden", "true");

  selectedDateKey = null;
}

function createDateKey(year, month, dayNumber) {
  const monthText = String(month + 1).padStart(2, "0");
  const dayText = String(dayNumber).padStart(2, "0");

  return `${year}-${monthText}-${dayText}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return {
    year,
    month: month - 1,
    day,
  };
}

function getWorkType(workTypeId) {
  return WORK_TYPES.find(
    (workType) => workType.id === workTypeId,
  );
}

function getInputNumber(input) {
  const value = Number(input.value);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function formatMoney(value) {
  const safeValue = Number.isFinite(value)
    ? value
    : 0;

  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(Math.round(safeValue))}원`;
}

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

function loadRecords() {
  try {
    const savedRecords = localStorage.getItem(STORAGE_KEY);

    if (!savedRecords) {
      return {};
    }

    return JSON.parse(savedRecords);
  } catch (error) {
    console.error(
      "저장된 근무기록을 불러오지 못했습니다.",
      error,
    );

    return {};
  }
}

function saveRecords() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records),
  );
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getCurrentMonthSettings() {
  const monthKey = getMonthKey(currentMonth);

  return {
    ...DEFAULT_SETTINGS,
    ...(settingsByMonth[monthKey] || {}),
  };
}

function syncSalaryInputs() {
  const settings = getCurrentMonthSettings();

  baseHourlyWageInput.value = settings.baseHourlyWage || "";
  safetyAllowanceInput.value = settings.safetyAllowance || "";
  longevityAllowanceInput.value = settings.longevityAllowance || "";
}

function loadSettingsByMonth() {
  try {
    const settingsKeys = [
      SETTINGS_KEY,
      PREVIOUS_SETTINGS_KEY,
    ];

    for (const settingsKey of settingsKeys) {
      const savedMonthlySettings =
        localStorage.getItem(settingsKey);

      if (!savedMonthlySettings) {
        continue;
      }

      const parsedSettings = JSON.parse(
        savedMonthlySettings,
      );

      if (
        parsedSettings &&
        typeof parsedSettings === "object" &&
        !Array.isArray(parsedSettings)
      ) {
        if (settingsKey !== SETTINGS_KEY) {
          localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(parsedSettings),
          );
        }

        return parsedSettings;
      }
    }

    const legacySettings = localStorage.getItem(
      LEGACY_SETTINGS_KEY,
    );

    if (!legacySettings) {
      return {};
    }

    const parsedLegacySettings = {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(legacySettings),
    };

    const migratedSettings = {
      [getMonthKey(currentMonth)]: parsedLegacySettings,
    };

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(migratedSettings),
    );

    return migratedSettings;
  } catch (error) {
    console.error(
      "월별 급여 설정을 불러오지 못했습니다.",
      error,
    );

    return {};
  }
}

function saveSettingsByMonth() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settingsByMonth),
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => {
        console.log("CAT 근태관리 서비스 워커 등록 완료");
      })
      .catch((error) => {
        console.error("서비스 워커 등록 실패:", error);
      });
  });
}

render();