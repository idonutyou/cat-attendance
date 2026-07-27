import "./style.css";

const STORAGE_KEY = "cat-attendance-records-v1";
const SETTINGS_KEY = "cat-attendance-settings-by-month-v2";
const PREVIOUS_SETTINGS_KEY = "cat-attendance-settings-v2";
const LEGACY_SETTINGS_KEY = "cat-attendance-settings-v1";

const DEFAULT_SETTINGS = {
  baseHourlyWage: 0,
  safetyAllowance: 0,
  longevityAllowance: 0,
  otherAllowance: 0,
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
let summarySlideIndex = 0;
let datePickerTargetInput = null;
let datePickerVisibleMonth = new Date();
let datePickerPreviousFocus = null;
let records = loadRecords();
let settingsByMonth = loadSettingsByMonth();
let holidays = {};

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="header-caption">근무 기록과 급여 관리</p>
        <h1>CAT 근태관리</h1>
      </div>

      <div class="made-by" aria-label="Made by 제민">
        Made by 제민
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

      <section
        id="summaryCard"
        class="summary-card"
        tabindex="0"
        aria-label="월간 근무 현황"
        aria-roledescription="carousel"
      >
        <div id="summaryCarousel" class="summary-carousel">
          <div id="summaryTrack" class="summary-track">
            <article
              class="summary-slide"
              data-summary-slide="0"
              aria-label="근무 기록 요약"
            >
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
            </article>

            <article
              class="summary-slide"
              data-summary-slide="1"
              aria-label="근무시간 집계"
            >
              <div class="section-title-row">
                <div>
                  <p class="section-caption">월간 현황</p>
                  <h2>근무시간 집계</h2>
                </div>
              </div>

              <div id="workTotalsGrid" class="work-totals-grid"></div>
            </article>

            <article
              class="summary-slide"
              data-summary-slide="2"
              aria-label="52시간 계산기"
            >
              <div class="section-title-row">
                <div>
                  <p class="section-caption">기간별 현황</p>
                  <h2>52시간 계산기</h2>
                </div>
              </div>

              <div class="weekly-calculator">
                <div class="weekly-date-range">
                  <div class="weekly-date-field">
                    <label for="weeklyStartDate">언제부터</label>

                    <div class="weekly-date-control">
                      <input
                        id="weeklyStartDate"
                        type="text"
                        placeholder="날짜 선택"
                        aria-label="52시간 계산 시작 날짜"
                        aria-haspopup="dialog"
                        readonly
                      />

                      <button
                        class="weekly-date-open-button"
                        type="button"
                        data-date-picker-target="weeklyStartDate"
                        aria-label="시작 날짜 달력 열기"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M7 2v3M17 2v3M3.5 9h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="weekly-date-field">
                    <label for="weeklyEndDate">언제까지</label>

                    <div class="weekly-date-control">
                      <input
                        id="weeklyEndDate"
                        type="text"
                        placeholder="날짜 선택"
                        aria-label="52시간 계산 종료 날짜"
                        aria-haspopup="dialog"
                        readonly
                      />

                      <button
                        class="weekly-date-open-button"
                        type="button"
                        data-date-picker-target="weeklyEndDate"
                        aria-label="종료 날짜 달력 열기"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M7 2v3M17 2v3M3.5 9h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  id="weeklyAverageResult"
                  class="weekly-average-result"
                  aria-live="polite"
                >
                  시작일과 종료일을 선택해 주세요.
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="summary-pagination" aria-label="요약 페이지 선택">
          <button
            class="carousel-dot active"
            type="button"
            data-summary-page="0"
            aria-label="근무 기록 요약 보기"
            aria-current="true"
          ></button>
          <button
            class="carousel-dot"
            type="button"
            data-summary-page="1"
            aria-label="근무시간 집계 보기"
            aria-current="false"
          ></button>
          <button
            class="carousel-dot"
            type="button"
            data-summary-page="2"
            aria-label="52시간 계산기 보기"
            aria-current="false"
          ></button>
        </div>

        <p class="summary-swipe-hint">옆으로 넘겨 확인</p>
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

            <label class="salary-input-row">
              <span>기타수당</span>

              <div class="input-with-unit">
                <input
                  id="otherAllowance"
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

  <div
    id="datePickerModal"
    class="modal date-picker-modal"
    aria-hidden="true"
  >
    <div
      class="modal-backdrop"
      data-close-date-picker
    ></div>

    <section
      class="modal-sheet date-picker-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="datePickerTitle"
    >
      <div class="date-picker-header">
        <button
          id="datePickerPreviousMonth"
          class="date-picker-month-button"
          type="button"
          aria-label="달력 이전 달"
        >
          ‹
        </button>

        <h2 id="datePickerTitle"></h2>

        <button
          id="datePickerNextMonth"
          class="date-picker-month-button"
          type="button"
          aria-label="달력 다음 달"
        >
          ›
        </button>
      </div>

      <div
        class="date-picker-weekdays"
        aria-hidden="true"
      >
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span class="saturday">토</span>
        <span class="sunday">일</span>
      </div>

      <div
        id="datePickerGrid"
        class="date-picker-grid"
      ></div>

      <div class="date-picker-actions">
        <button
          id="datePickerTodayButton"
          class="date-picker-today-button"
          type="button"
        >
          오늘 선택
        </button>

        <button
          id="closeDatePickerButton"
          class="date-picker-close-button"
          type="button"
        >
          닫기
        </button>
      </div>
    </section>
  </div>
`;

const monthTitle = document.querySelector("#monthTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const summaryCard = document.querySelector("#summaryCard");
const summaryCarousel = document.querySelector("#summaryCarousel");
const summaryTrack = document.querySelector("#summaryTrack");
const summarySlides = [
  ...document.querySelectorAll("[data-summary-slide]"),
];
const summaryPageButtons = [
  ...document.querySelectorAll("[data-summary-page]"),
];
const summaryGrid = document.querySelector("#summaryGrid");
const recordedDays = document.querySelector("#recordedDays");
const weeklyStartDateInput = document.querySelector(
  "#weeklyStartDate",
);
const weeklyEndDateInput = document.querySelector(
  "#weeklyEndDate",
);
const weeklyAverageResult = document.querySelector(
  "#weeklyAverageResult",
);
const datePickerModal = document.querySelector(
  "#datePickerModal",
);
const datePickerTitle = document.querySelector(
  "#datePickerTitle",
);
const datePickerGrid = document.querySelector(
  "#datePickerGrid",
);
const closeDatePickerButton = document.querySelector(
  "#closeDatePickerButton",
);

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

const otherAllowanceInput = document.querySelector(
  "#otherAllowance",
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

summaryPageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSummarySlide(Number(button.dataset.summaryPage));
  });
});

let summaryTouchStartX = 0;
let summaryTouchStartY = 0;

summaryCarousel.addEventListener(
  "touchstart",
  (event) => {
    const [touch] = event.changedTouches;

    summaryTouchStartX = touch.clientX;
    summaryTouchStartY = touch.clientY;
  },
  { passive: true },
);

summaryCarousel.addEventListener(
  "touchend",
  (event) => {
    const [touch] = event.changedTouches;
    const deltaX = touch.clientX - summaryTouchStartX;
    const deltaY = touch.clientY - summaryTouchStartY;

    if (
      Math.abs(deltaX) < 45 ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    changeSummarySlide(deltaX < 0 ? 1 : -1);
  },
  { passive: true },
);

summaryCard.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    changeSummarySlide(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    changeSummarySlide(1);
  }
});

[
  weeklyStartDateInput,
  weeklyEndDateInput,
].forEach((input) => {
  input.addEventListener("click", () => {
    openDatePicker(input);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDatePicker(input);
    }
  });
});

document
  .querySelectorAll("[data-date-picker-target]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector(
        `#${button.dataset.datePickerTarget}`,
      );

      if (input) {
        openDatePicker(input);
      }
    });
  });

document
  .querySelector("#datePickerPreviousMonth")
  .addEventListener("click", () => {
    datePickerVisibleMonth = new Date(
      datePickerVisibleMonth.getFullYear(),
      datePickerVisibleMonth.getMonth() - 1,
      1,
    );

    renderDatePicker();
  });

document
  .querySelector("#datePickerNextMonth")
  .addEventListener("click", () => {
    datePickerVisibleMonth = new Date(
      datePickerVisibleMonth.getFullYear(),
      datePickerVisibleMonth.getMonth() + 1,
      1,
    );

    renderDatePicker();
  });

document
  .querySelector("#datePickerTodayButton")
  .addEventListener("click", () => {
    const today = new Date();

    selectDatePickerDate(
      createDateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ),
    );
  });

closeDatePickerButton.addEventListener(
  "click",
  closeDatePicker,
);

document
  .querySelector("[data-close-date-picker]")
  .addEventListener("click", closeDatePicker);

[
  baseHourlyWageInput,
  safetyAllowanceInput,
  longevityAllowanceInput,
  otherAllowanceInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    const monthKey = getMonthKey(currentMonth);

    settingsByMonth[monthKey] = {
      baseHourlyWage: getInputNumber(baseHourlyWageInput),
      safetyAllowance: getInputNumber(safetyAllowanceInput),
      longevityAllowance: getInputNumber(
        longevityAllowanceInput,
      ),
      otherAllowance: getInputNumber(otherAllowanceInput),
    };

    saveSettingsByMonth();
    renderSalary();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (datePickerModal.classList.contains("open")) {
    closeDatePicker();
    return;
  }

  closeModal();
});

function openDatePicker(input) {
  const selectedDate = parseDateInputValue(input.value);
  const today = new Date();

  datePickerTargetInput = input;
  datePickerPreviousFocus = document.activeElement;
  datePickerVisibleMonth = selectedDate
    ? new Date(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        1,
      )
    : new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );

  renderDatePicker();
  datePickerModal.classList.add("open");
  datePickerModal.setAttribute("aria-hidden", "false");

  window.requestAnimationFrame(() => {
    const focusTarget =
      datePickerGrid.querySelector(".selected") ||
      datePickerGrid.querySelector(".today") ||
      datePickerGrid.querySelector("button");

    focusTarget?.focus();
  });
}

function closeDatePicker() {
  if (!datePickerModal.classList.contains("open")) {
    return;
  }

  datePickerModal.classList.remove("open");
  datePickerModal.setAttribute("aria-hidden", "true");

  const focusTarget = datePickerPreviousFocus;

  datePickerTargetInput = null;
  datePickerPreviousFocus = null;
  focusTarget?.focus();
}

function renderDatePicker() {
  const year = datePickerVisibleMonth.getFullYear();
  const month = datePickerVisibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayPosition =
    (new Date(year, month, 1).getDay() + 6) % 7;
  const selectedDateKey = datePickerTargetInput?.value || "";
  const today = new Date();
  const todayDateKey = createDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  datePickerTitle.textContent = `${year}년 ${month + 1}월`;
  datePickerGrid.innerHTML = "";

  for (let cellIndex = 0; cellIndex < 42; cellIndex += 1) {
    const dayNumber = cellIndex - firstDayPosition + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const emptyCell = document.createElement("span");

      emptyCell.className = "date-picker-day empty";
      emptyCell.setAttribute("aria-hidden", "true");
      datePickerGrid.appendChild(emptyCell);
      continue;
    }

    const date = new Date(year, month, dayNumber);
    const dateKey = createDateKey(year, month, dayNumber);
    const dayButton = document.createElement("button");

    dayButton.type = "button";
    dayButton.className = "date-picker-day";
    dayButton.textContent = String(dayNumber);
    dayButton.setAttribute(
      "aria-label",
      `${year}년 ${month + 1}월 ${dayNumber}일 선택`,
    );

    if (date.getDay() === 6) {
      dayButton.classList.add("saturday");
    }

    if (date.getDay() === 0) {
      dayButton.classList.add("sunday");
    }

    if (dateKey === todayDateKey) {
      dayButton.classList.add("today");
    }

    if (dateKey === selectedDateKey) {
      dayButton.classList.add("selected");
      dayButton.setAttribute("aria-current", "date");
    }

    dayButton.addEventListener("click", () => {
      selectDatePickerDate(dateKey);
    });

    datePickerGrid.appendChild(dayButton);
  }
}

function selectDatePickerDate(dateKey) {
  if (!datePickerTargetInput) {
    return;
  }

  datePickerTargetInput.value = dateKey;
  render52HourCalculator();
  closeDatePicker();
}

function setSummarySlide(nextIndex) {
  const slideCount = summarySlides.length;

  summarySlideIndex =
    ((nextIndex % slideCount) + slideCount) % slideCount;

  summaryTrack.style.transform =
    `translateX(-${summarySlideIndex * 100}%)`;

  summarySlides.forEach((slide, index) => {
    slide.setAttribute(
      "aria-hidden",
      String(index !== summarySlideIndex),
    );
  });

  summaryPageButtons.forEach((button, index) => {
    const isActive = index === summarySlideIndex;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", String(isActive));
  });
}

function changeSummarySlide(direction) {
  setSummarySlide(summarySlideIndex + direction);
}

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
    const holidayName = getHolidayName(dateKey);

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

    if (holidayName) {
      dayButton.classList.add("holiday-cell");
      dayButton.setAttribute(
        "aria-label",
        `${year}년 ${month + 1}월 ${dayNumber}일 ${holidayName}`,
      );
    }

    if (workType) {
      dayButton.classList.add(`type-${workType.id}`);
    }

    dayButton.innerHTML = `
      <span class="day-number">${dayNumber}</span>

      ${
        holidayName
          ? `<span class="holiday-name">${holidayName}</span>`
          : ""
      }

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
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
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

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const sundayCount = countSundaysInMonth(year, month);
  const basePayDays = daysInMonth - sundayCount;
  const basePayHours = basePayDays * 8;

  render52HourCalculator();
  setSummarySlide(summarySlideIndex);
}

function render52HourCalculator() {
  const startDate = parseDateInputValue(
    weeklyStartDateInput.value,
  );
  const endDate = parseDateInputValue(
    weeklyEndDateInput.value,
  );

  if (!startDate || !endDate) {
    weeklyAverageResult.textContent =
      "시작일과 종료일을 선택해 주세요.";
    weeklyAverageResult.classList.remove("error");
    weeklyAverageResult.classList.remove("has-result");
    return;
  }

  if (startDate.getTime() > endDate.getTime()) {
    weeklyAverageResult.textContent =
      "종료일은 시작일보다 빠를 수 없습니다.";
    weeklyAverageResult.classList.add("error");
    weeklyAverageResult.classList.remove("has-result");
    return;
  }

  const {
    averageHours,
    dayCount,
    totalWorkHours,
  } = calculate52HourAverage(startDate, endDate);

  const fullWeeks = Math.floor(dayCount / 7);
  const remainingDays = dayCount % 7;

  weeklyAverageResult.innerHTML = `
    <div class="weekly-result-summary">
      <div class="weekly-duration">
        <strong>${fullWeeks}주 ${remainingDays}일</strong> 동안
      </div>

      <div class="weekly-result-grid">
        <div class="weekly-result-item">
          <span>총 근무시간</span>
          <strong>${formatTotalWorkHours(totalWorkHours)} 시간</strong>
        </div>

        <div class="weekly-result-item">
          <span>평균 근무시간</span>
          <strong>${formatAverageHours(averageHours)} 시간</strong>
        </div>
      </div>
    </div>
  `;
  weeklyAverageResult.classList.remove("error");
  weeklyAverageResult.classList.add("has-result");
}

function calculate52HourAverage(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const dayCount =
    Math.floor(
      (endDate.getTime() - startDate.getTime()) /
        millisecondsPerDay,
    ) + 1;

  let totalWorkHours = 0;

  for (
    let dateValue = startDate.getTime();
    dateValue <= endDate.getTime();
    dateValue += millisecondsPerDay
  ) {
    const date = new Date(dateValue);
    const dateKey = createDateKeyFromUtcDate(date);

    totalWorkHours += get52HourWorkHours(records[dateKey]);
  }

  const averageHours =
    totalWorkHours / (dayCount * 0.14285714285714);

  return {
    averageHours,
    dayCount,
    totalWorkHours,
  };
}

function get52HourWorkHours(workTypeId) {
  const workType = getWorkType(workTypeId);

  if (!workType || workType.id === "annualLeave") {
    return 0;
  }

  return workType.label.endsWith("잔업") ? 10.5 : 8;
}

function parseDateInputValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function createDateKeyFromUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatTotalWorkHours(value) {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatAverageHours(value) {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

  const otherAllowance =
    Number(settings.otherAllowance) || 0;

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
    longevityAllowance +
    otherAllowance;

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
    ["기타수당", otherAllowance],
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

function getHolidayName(dateKey) {
  return holidays[dateKey] || "";
}

async function loadHolidays() {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}holidays.json`,
      { cache: "no-cache" },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    holidays = await response.json();
    render();

  } catch (error) {
    console.error("공휴일 정보를 불러오지 못했습니다.", error);
  }
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
  otherAllowanceInput.value = settings.otherAllowance || "";
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
loadHolidays();
