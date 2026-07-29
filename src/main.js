import "./style.css";

const STORAGE_KEY = "cat-attendance-records-v1";
const SETTINGS_KEY = "cat-attendance-settings-by-month-v2";
const PREVIOUS_SETTINGS_KEY = "cat-attendance-settings-v2";
const LEGACY_SETTINGS_KEY = "cat-attendance-settings-v1";
const WEEKLY_RANGE_KEY = "cat-attendance-52-hour-range-v1";
const ANNUAL_LEAVE_KEY = "cat-attendance-annual-leave-by-year-v1";
const ANNUAL_LEAVE_REASON_KEY = "cat-attendance-annual-leave-reasons-v1";
const YEAR_MIN = 2000;
const YEAR_MAX = 2100;

const APP_PAGE_TITLES = {
  attendance: "근태관리",
  salary: "급여내역",
  "hours-leave": "52h / 연차",
};

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

const CUSTOM_WORK_TYPE = {
  id: "custom",
  label: "직접 입력",
  totals: {},
};

const WORK_TYPE_PICKER_ORDER = [
  "day",
  "dayOvertime",
  "dayHoliday",
  "dayHolidayOvertime",
  "annualLeave",
  "night",
  "nightOvertime",
  "nightHoliday",
  "nightHolidayOvertime",
];

const SUMMARY_WORK_TYPES = [
  ...WORK_TYPES,
  CUSTOM_WORK_TYPE,
];

let currentMonth = new Date();

currentMonth = new Date(
  currentMonth.getFullYear(),
  currentMonth.getMonth(),
  1,
);

let currentAppPage = "attendance";
let salarySelectedYear = currentMonth.getFullYear();
let salarySelectedMonth = currentMonth.getMonth();
let annualLeaveSelectedYear = new Date().getFullYear();
let monthPickerSelectedYear = currentMonth.getFullYear();

let selectedDateKey = null;
let summarySlideIndex = 0;
let mobilePageIndex = 0;
let mobilePageAnimating = false;
let mobilePageAnimations = [];
let exitBackReady = false;
let exitToastTimer = null;
let backExitGuardInitialized = false;
let backExitPopstateAttached = false;
let backExitGuardArmedThisSession = false;
let appCloseWatcher = null;
let allowAppExitNavigation = false;
let datePickerTargetInput = null;
let datePickerVisibleMonth = new Date();
let datePickerPreviousFocus = null;
let monthPickerTarget = null;
let monthPickerPreviousFocus = null;
let mainCalendarMonthAnimating = false;
let datePickerMonthAnimating = false;
let records = loadRecords();
let settingsByMonth = loadSettingsByMonth();
let weeklyDateRange = loadWeeklyDateRange();
let annualLeaveByYear = loadAnnualLeaveByYear();
let annualLeaveReasons = loadAnnualLeaveReasons();
let holidays = {};

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <button
        id="menuButton"
        class="menu-button"
        type="button"
        aria-label="페이지 메뉴 열기"
        aria-controls="navigationDrawer"
        aria-expanded="false"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <h1 id="appPageTitle">근태관리</h1>

      <div class="made-by" aria-label="Made by 제민">
        Made by 제민
      </div>
    </header>

    <div
      id="navigationDrawer"
      class="navigation-drawer"
      aria-hidden="true"
    >
      <button
        class="navigation-backdrop"
        type="button"
        data-close-navigation
        aria-label="메뉴 닫기"
      ></button>

      <aside
        class="navigation-panel"
        aria-label="페이지 목록"
      >
        <div class="navigation-heading">
          <strong>CATERPILLAR PRECISION SEAL KOREA</strong>
          <button
            id="closeNavigationButton"
            class="navigation-close-button"
            type="button"
            aria-label="메뉴 닫기"
          >×</button>
        </div>

        <nav class="navigation-list">
          <button
            class="navigation-item active"
            type="button"
            data-app-navigation="attendance"
            aria-current="page"
          >
            <span class="navigation-icon">▦</span>
            <span>근태관리</span>
          </button>
          <button
            class="navigation-item"
            type="button"
            data-app-navigation="salary"
          >
            <span class="navigation-icon">₩</span>
            <span>급여내역</span>
          </button>
          <button
            class="navigation-item"
            type="button"
            data-app-navigation="hours-leave"
          >
            <span class="navigation-icon">52</span>
            <span>52h / 연차</span>
          </button>
        </nav>
      </aside>
    </div>

    <main class="main-content app-main">
      <section
        class="app-page active"
        data-app-page="attendance"
        aria-label="근태관리"
      >
        <div id="mobilePager" class="attendance-layout attendance-pager">
          <div id="mobilePageTrack" class="mobile-page-track">
          <section
            class="calendar-card mobile-page mobile-page-active"
            data-mobile-page="0"
            aria-label="달력"
          >
            <div class="calendar-toolbar">
              <button
                id="previousMonth"
                class="month-button"
                type="button"
                aria-label="이전 달"
              >
                ‹
              </button>

              <button
                id="monthTitle"
                class="calendar-month-title"
                type="button"
                aria-label="연도와 월 선택"
              ></button>

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
            class="summary-card mobile-page"
            data-mobile-page="1"
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
                      0&thinsp;일
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
            </div>

            <p class="summary-swipe-hint">옆으로 넘겨 확인</p>
          </section>
          </div>

          <nav
            class="mobile-page-pagination"
            aria-label="근태관리 화면 선택"
          >
            <button
              class="mobile-page-dot active"
              type="button"
              data-mobile-page-button="0"
              aria-label="달력 화면 보기"
              aria-current="true"
            ></button>
            <button
              class="mobile-page-dot"
              type="button"
              data-mobile-page-button="1"
              aria-label="근무 기록 요약 화면 보기"
              aria-current="false"
            ></button>
          </nav>
        </div>
      </section>

      <section
        class="app-page"
        data-app-page="salary"
        aria-label="급여내역"
        hidden
      >
        <div class="salary-page-layout">
          <section class="salary-overview-card">
            <div class="salary-year-toolbar">
              <button
                id="salaryPreviousYear"
                class="salary-year-arrow"
                type="button"
                aria-label="이전 연도"
              >‹</button>

              <button
                id="salaryYearButton"
                class="salary-year-button"
                type="button"
                aria-expanded="false"
                aria-controls="salaryYearPicker"
              ></button>

              <button
                id="salaryNextYear"
                class="salary-year-arrow"
                type="button"
                aria-label="다음 연도"
              >›</button>
            </div>

            <div
              id="salaryYearPicker"
              class="salary-year-picker"
              hidden
            >
              <p class="year-scroll-picker-label">연도 선택</p>
              <div
                id="salaryYearScroller"
                class="year-scroll-picker"
                role="listbox"
                aria-label="급여내역 연도 선택"
              ></div>
            </div>

            <div
              id="salaryYearGrid"
              class="salary-year-grid"
              aria-label="월별 예상 총급여"
            ></div>

            <div class="annual-salary-row">
              <span>예상 연봉</span>
              <strong id="annualSalaryTotal">0&thinsp;원</strong>
            </div>
          </section>

          <section
            id="salaryDetailCard"
            class="salary-card"
            aria-label="선택한 달의 예상 급여와 지급내역"
          >
            <div class="salary-heading">
              <h2 id="salaryMonthTitle">이번 달 예상 급여</h2>
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

                <div class="salary-input-row salary-output-row">
                  <span>통상시급</span>

                  <div
                    class="salary-inline-output"
                    aria-label="자동 계산된 통상시급"
                  >
                    <output id="ordinaryHourlyWageOutput">0</output>
                    <span>원</span>
                  </div>
                </div>

                <p class="formula-note">
                  통상시급 = 기본시급 + (안전수당 + 근속수당) ÷ 243
                </p>
              </section>

              <section class="salary-panel payment-panel">
                <h3>지급내역</h3>

                <div id="payBreakdown" class="pay-breakdown"></div>

                <div class="total-pay-row">
                  <span>예상 총급여</span>
                  <strong id="totalPayOutput">0&thinsp;원</strong>
                </div>
              </section>
            </div>
          </section>
        </div>
      </section>

      <section
        class="app-page"
        data-app-page="hours-leave"
        aria-label="52시간 계산기와 연차"
        hidden
      >
        <section class="hours-leave-card summary-card">
          <div class="section-title-row summary-part-heading">
            <div>
              <p class="section-caption">근무시간 확인</p>
              <h2 id="weeklyCalculatorTitle">52시간 계산기</h2>
            </div>
          </div>

          <section
            class="weekly-calculator"
            aria-labelledby="weeklyCalculatorTitle"
          >
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
                    <svg viewBox="0 0 24 24" aria-hidden="true">
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
                    <svg viewBox="0 0 24 24" aria-hidden="true">
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
          </section>

          <section
            class="annual-leave-section"
            aria-labelledby="annualLeaveTitle"
          >
            <div class="section-title-row annual-leave-section-heading">
              <h2 id="annualLeaveTitle">잔여 연차</h2>
              <div class="annual-leave-year-selector">
                <button
                  id="annualLeaveYearButton"
                  class="annual-leave-year-button"
                  type="button"
                  aria-expanded="false"
                  aria-controls="annualLeaveYearPicker"
                ></button>
                <div
                  id="annualLeaveYearPicker"
                  class="annual-leave-year-picker"
                  hidden
                >
                  <p class="year-scroll-picker-label">연도 선택</p>
                  <div
                    id="annualLeaveYearScroller"
                    class="year-scroll-picker"
                    role="listbox"
                    aria-label="연차 연도 선택"
                  ></div>
                </div>
              </div>
            </div>

            <div class="annual-leave-card">
              <div class="annual-leave-grid">
                <label class="annual-leave-item annual-leave-input-item">
                  <span>발생 연차</span>

                  <span class="annual-leave-input-control">
                    <input
                      id="accruedAnnualLeave"
                      type="text"
                      inputmode="decimal"
                      pattern="[0-9]*[.]?[0-9]?"
                      autocomplete="off"
                      aria-label="발생 연차"
                    />
                    <span>일</span>
                  </span>
                </label>

                <div class="annual-leave-item">
                  <span>사용 연차</span>
                  <strong id="usedAnnualLeave">0&thinsp;일</strong>
                </div>

                <div class="annual-leave-item">
                  <span>잔여 연차</span>
                  <strong id="remainingAnnualLeave">0&thinsp;일</strong>
                </div>
              </div>
            </div>

            <section
              class="annual-leave-history"
              aria-labelledby="annualLeaveHistoryTitle"
            >
              <h3 id="annualLeaveHistoryTitle">연차 사용 내역</h3>

              <div class="annual-leave-history-table" role="table">
                <div class="annual-leave-history-head" role="row">
                  <span role="columnheader">시작</span>
                  <span role="columnheader">종료</span>
                  <span role="columnheader">사용 연차</span>
                  <span role="columnheader">사유</span>
                </div>
                <div id="annualLeaveHistoryBody"></div>
              </div>
            </section>
          </section>
        </section>
      </section>
    </main>
  </div>

  <div
    id="exitToast"
    class="exit-toast"
    role="status"
    aria-live="polite"
    aria-hidden="true"
  >
    한 번 더 뒤로가기를 누르면 앱이 종료됩니다.
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

      <div
        id="customWorkTypeEditor"
        class="custom-work-type-editor"
        hidden
      >
        <label for="customWorkTypeInput">근무 내용 직접 입력</label>

        <div class="custom-work-type-control">
          <input
            id="customWorkTypeInput"
            type="text"
            inputmode="text"
            maxlength="20"
            autocomplete="off"
            placeholder="예: 교육, 출장, 휴무"
          />

          <button
            id="saveCustomWorkTypeButton"
            type="button"
          >
            저장
          </button>
        </div>

        <p
          id="customWorkTypeMessage"
          class="custom-work-type-message"
          aria-live="polite"
        >
          직접 입력한 기록은 근무시간 0&thinsp;시간으로 계산됩니다.
        </p>
      </div>

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

        <button
          id="datePickerTitle"
          class="date-picker-title-button"
          type="button"
          aria-label="연도와 월 선택"
        ></button>

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

  <div
    id="monthPickerModal"
    class="modal month-picker-modal"
    aria-hidden="true"
  >
    <div
      class="modal-backdrop"
      data-close-month-picker
    ></div>

    <section
      class="modal-sheet month-picker-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monthPickerHeading"
    >
      <div class="month-picker-heading-row">
        <div>
          <p class="section-caption">빠른 이동</p>
          <h2 id="monthPickerHeading">연도·월 선택</h2>
        </div>

        <button
          id="closeMonthPickerButton"
          class="close-button"
          type="button"
          aria-label="연도와 월 선택 닫기"
        >
          ×
        </button>
      </div>

      <div class="month-picker-year-row">
        <button
          id="monthPickerPreviousYear"
          class="month-picker-year-button"
          type="button"
          aria-label="이전 연도"
        >
          ‹
        </button>

        <button
          id="monthPickerYearButton"
          class="month-picker-year-display"
          type="button"
          aria-expanded="false"
          aria-controls="monthPickerYearScroller"
        ></button>

        <button
          id="monthPickerNextYear"
          class="month-picker-year-button"
          type="button"
          aria-label="다음 연도"
        >
          ›
        </button>
      </div>

      <div
        id="monthPickerYearScroller"
        class="year-scroll-picker month-picker-year-scroller"
        role="listbox"
        aria-label="달력 연도 선택"
        hidden
      ></div>

      <div
        id="monthPickerMonths"
        class="month-picker-months"
        aria-label="이동할 월"
      >
        ${Array.from(
          { length: 12 },
          (_, monthIndex) => `
            <button
              class="month-picker-month"
              type="button"
              data-month-picker-month="${monthIndex}"
            >
              ${monthIndex + 1}월
            </button>
          `,
        ).join("")}
      </div>
    </section>
  </div>
`;

const monthTitle = document.querySelector("#monthTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const mobilePager = document.querySelector("#mobilePager");
const mobilePages = [
  ...document.querySelectorAll("[data-mobile-page]"),
];
const mobilePageButtons = [
  ...document.querySelectorAll("[data-mobile-page-button]"),
];
const mobilePagerMedia = window.matchMedia("(max-width: 620px)");
const mobilePagerTestMode =
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).get(
    "mobilePagerTest",
  ) === "1";
const appPages = [
  ...document.querySelectorAll("[data-app-page]"),
];
const appNavigationButtons = [
  ...document.querySelectorAll("[data-app-navigation]"),
];
const appPageTitle = document.querySelector("#appPageTitle");
const menuButton = document.querySelector("#menuButton");
const navigationDrawer = document.querySelector(
  "#navigationDrawer",
);
const closeNavigationButton = document.querySelector(
  "#closeNavigationButton",
);
const salaryYearButton = document.querySelector(
  "#salaryYearButton",
);
const salaryYearPicker = document.querySelector(
  "#salaryYearPicker",
);
const salaryYearScroller = document.querySelector(
  "#salaryYearScroller",
);
const salaryYearGrid = document.querySelector(
  "#salaryYearGrid",
);
const annualSalaryTotal = document.querySelector(
  "#annualSalaryTotal",
);
const salaryDetailCard = document.querySelector(
  "#salaryDetailCard",
);
const exitToast = document.querySelector("#exitToast");
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
const annualLeaveYearButton = document.querySelector(
  "#annualLeaveYearButton",
);
const annualLeaveYearPicker = document.querySelector(
  "#annualLeaveYearPicker",
);
const annualLeaveYearScroller = document.querySelector(
  "#annualLeaveYearScroller",
);
const accruedAnnualLeaveInput = document.querySelector(
  "#accruedAnnualLeave",
);
const usedAnnualLeaveOutput = document.querySelector(
  "#usedAnnualLeave",
);
const remainingAnnualLeaveOutput = document.querySelector(
  "#remainingAnnualLeave",
);
const annualLeaveHistoryBody = document.querySelector(
  "#annualLeaveHistoryBody",
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
const monthPickerModal = document.querySelector(
  "#monthPickerModal",
);
const monthPickerYearButton = document.querySelector(
  "#monthPickerYearButton",
);
const monthPickerYearScroller = document.querySelector(
  "#monthPickerYearScroller",
);
const monthPickerMonths = [
  ...document.querySelectorAll("[data-month-picker-month]"),
];
const closeMonthPickerButton = document.querySelector(
  "#closeMonthPickerButton",
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
const customWorkTypeEditor = document.querySelector(
  "#customWorkTypeEditor",
);
const customWorkTypeInput = document.querySelector(
  "#customWorkTypeInput",
);
const customWorkTypeMessage = document.querySelector(
  "#customWorkTypeMessage",
);
const saveCustomWorkTypeButton = document.querySelector(
  "#saveCustomWorkTypeButton",
);

const deleteRecordButton = document.querySelector(
  "#deleteRecordButton",
);

menuButton.addEventListener("click", openNavigationDrawer);
closeNavigationButton.addEventListener(
  "click",
  closeNavigationDrawer,
);
document
  .querySelector("[data-close-navigation]")
  .addEventListener("click", closeNavigationDrawer);

appNavigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setAppPage(button.dataset.appNavigation);
  });
});

salaryYearButton.addEventListener("click", () => {
  if (salaryYearPicker.hidden) {
    openSalaryYearPicker();
  } else {
    closeSalaryYearPicker();
  }
});

document
  .querySelector("#salaryPreviousYear")
  .addEventListener("click", () => {
    setSalaryYear(salarySelectedYear - 1);
  });

document
  .querySelector("#salaryNextYear")
  .addEventListener("click", () => {
    setSalaryYear(salarySelectedYear + 1);
  });



salaryYearScroller.addEventListener("click", (event) => {
  const yearButton = event.target.closest("[data-year-option]");

  if (!yearButton) {
    return;
  }

  setSalaryYear(Number(yearButton.dataset.yearOption));
  closeSalaryYearPicker();
});

salaryYearGrid.addEventListener("click", (event) => {
  const monthButton = event.target.closest(
    "[data-salary-month]",
  );

  if (!monthButton) {
    return;
  }

  salarySelectedMonth = Number(
    monthButton.dataset.salaryMonth,
  );
  syncSalaryInputs();
  renderSalary();
});

let mobileTouchStartX = 0;
let mobileTouchStartY = 0;
let mobileTouchCanMoveNext = false;
let mobileTouchCanMovePrevious = false;
let mobileWheelLocked = false;

mobilePageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMobilePage(Number(button.dataset.mobilePageButton));
  });
});

mobilePager.addEventListener(
  "touchstart",
  (event) => {
    if (!isMobilePagerMode() || mobilePageAnimating) {
      return;
    }

    const [touch] = event.changedTouches;
    const activePage = mobilePages[mobilePageIndex];

    mobileTouchStartX = touch.clientX;
    mobileTouchStartY = touch.clientY;
    mobileTouchCanMovePrevious = isMobilePageAtTop(activePage);
    mobileTouchCanMoveNext = isMobilePageAtBottom(activePage);
  },
  { passive: true },
);

mobilePager.addEventListener(
  "touchend",
  (event) => {
    if (!isMobilePagerMode() || mobilePageAnimating) {
      return;
    }

    const [touch] = event.changedTouches;
    const deltaX = touch.clientX - mobileTouchStartX;
    const deltaY = touch.clientY - mobileTouchStartY;

    if (
      Math.abs(deltaY) < 55 ||
      Math.abs(deltaY) <= Math.abs(deltaX)
    ) {
      return;
    }

    if (deltaY < 0 && mobileTouchCanMoveNext) {
      changeMobilePage(1);
    }

    if (deltaY > 0 && mobileTouchCanMovePrevious) {
      changeMobilePage(-1);
    }
  },
  { passive: true },
);

mobilePager.addEventListener(
  "wheel",
  (event) => {
    if (
      !isMobilePagerMode() ||
      mobilePageAnimating ||
      mobileWheelLocked ||
      Math.abs(event.deltaY) <= Math.abs(event.deltaX)
    ) {
      return;
    }

    const activePage = mobilePages[mobilePageIndex];
    const direction = event.deltaY > 0 ? 1 : -1;
    const canMove =
      direction > 0
        ? isMobilePageAtBottom(activePage)
        : isMobilePageAtTop(activePage);

    if (!canMove) {
      return;
    }

    event.preventDefault();
    mobileWheelLocked = true;
    changeMobilePage(direction);

    window.setTimeout(() => {
      mobileWheelLocked = false;
    }, 520);
  },
  { passive: false },
);

mobilePager.addEventListener("keydown", (event) => {
  if (
    !isMobilePagerMode() ||
    event.target.matches("input, textarea, select")
  ) {
    return;
  }

  if (event.key === "PageDown") {
    event.preventDefault();
    changeMobilePage(1);
  }

  if (event.key === "PageUp") {
    event.preventDefault();
    changeMobilePage(-1);
  }
});

if (typeof mobilePagerMedia.addEventListener === "function") {
  mobilePagerMedia.addEventListener("change", syncMobilePagerMode);
} else {
  mobilePagerMedia.addListener(syncMobilePagerMode);
}

document
  .querySelector("#previousMonth")
  .addEventListener("click", () => {
    changeMainCalendarMonth(-1);
  });

document
  .querySelector("#nextMonth")
  .addEventListener("click", () => {
    changeMainCalendarMonth(1);
  });

monthTitle.addEventListener("click", () => {
  openMonthPicker("main");
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

saveCustomWorkTypeButton.addEventListener(
  "click",
  saveCustomWorkType,
);

customWorkTypeInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  saveCustomWorkType();
});

customWorkTypeInput.addEventListener("input", () => {
  customWorkTypeMessage.textContent =
    "직접 입력한 기록은 근무시간 0\u2009시간으로 계산됩니다.";
  customWorkTypeMessage.classList.remove("error");
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

annualLeaveYearButton.addEventListener("click", () => {
  if (annualLeaveYearPicker.hidden) {
    openAnnualLeaveYearPicker();
  } else {
    closeAnnualLeaveYearPicker();
  }
});

annualLeaveYearScroller.addEventListener("click", (event) => {
  const yearButton = event.target.closest("[data-year-option]");

  if (!yearButton) {
    return;
  }

  annualLeaveSelectedYear = Number(yearButton.dataset.yearOption);
  closeAnnualLeaveYearPicker();
  renderAnnualLeaveSummary();
});

accruedAnnualLeaveInput.addEventListener("input", () => {
  const sanitizedValue = sanitizeAnnualLeaveInput(
    accruedAnnualLeaveInput.value,
  );

  if (sanitizedValue !== accruedAnnualLeaveInput.value) {
    accruedAnnualLeaveInput.value = sanitizedValue;
  }

  const yearKey = String(annualLeaveSelectedYear);

  annualLeaveByYear[yearKey] = getInputNumber(
    accruedAnnualLeaveInput,
  );

  saveAnnualLeaveByYear();
  renderAnnualLeaveSummary(false);
});

accruedAnnualLeaveInput.addEventListener("blur", () => {
  const value = getInputNumber(accruedAnnualLeaveInput);

  accruedAnnualLeaveInput.value =
    value === 0 ? "" : formatAnnualLeaveDays(value);
});

annualLeaveHistoryBody.addEventListener("input", (event) => {
  const reasonInput = event.target.closest("[data-annual-leave-reason]");

  if (!reasonInput) {
    return;
  }

  const rangeKey = reasonInput.dataset.annualLeaveReason;
  const reason = reasonInput.value.slice(0, 120);

  if (reason) {
    annualLeaveReasons[rangeKey] = reason;
  } else {
    delete annualLeaveReasons[rangeKey];
  }

  saveAnnualLeaveReasons();
});

document
  .querySelector("#datePickerPreviousMonth")
  .addEventListener("click", () => {
    changeDatePickerMonth(-1);
  });

document
  .querySelector("#datePickerNextMonth")
  .addEventListener("click", () => {
    changeDatePickerMonth(1);
  });

datePickerTitle.addEventListener("click", () => {
  openMonthPicker("datePicker");
});

attachHorizontalMonthSwipe(calendarGrid, (direction) => {
  changeMainCalendarMonth(direction);
});

attachHorizontalMonthSwipe(datePickerGrid, (direction) => {
  changeDatePickerMonth(direction);
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

closeMonthPickerButton.addEventListener(
  "click",
  closeMonthPicker,
);

document
  .querySelector("[data-close-month-picker]")
  .addEventListener("click", closeMonthPicker);

document
  .querySelector("#monthPickerPreviousYear")
  .addEventListener("click", () => {
    setMonthPickerYear(getMonthPickerYear() - 1);
  });

document
  .querySelector("#monthPickerNextYear")
  .addEventListener("click", () => {
    setMonthPickerYear(getMonthPickerYear() + 1);
  });

monthPickerYearButton.addEventListener("click", () => {
  const willOpen = monthPickerYearScroller.hidden;

  monthPickerYearScroller.hidden = !willOpen;
  monthPickerYearButton.setAttribute("aria-expanded", String(willOpen));

  if (willOpen) {
    renderYearScrollPicker(
      monthPickerYearScroller,
      monthPickerSelectedYear,
    );
    scrollYearPickerToSelected(monthPickerYearScroller);
  }
});

monthPickerYearScroller.addEventListener("click", (event) => {
  const yearButton = event.target.closest("[data-year-option]");

  if (!yearButton) {
    return;
  }

  setMonthPickerYear(Number(yearButton.dataset.yearOption));
  monthPickerYearScroller.hidden = true;
  monthPickerYearButton.setAttribute("aria-expanded", "false");
});

monthPickerMonths.forEach((button) => {
  button.addEventListener("click", () => {
    applyMonthPickerSelection(
      Number(button.dataset.monthPickerMonth),
    );
  });
});

[
  baseHourlyWageInput,
  safetyAllowanceInput,
  longevityAllowanceInput,
  otherAllowanceInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    const monthKey = getMonthKeyFromParts(
      salarySelectedYear,
      salarySelectedMonth,
    );

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

  if (navigationDrawer.classList.contains("open")) {
    closeNavigationDrawer();
    return;
  }

  if (!salaryYearPicker.hidden) {
    closeSalaryYearPicker();
    return;
  }

  if (monthPickerModal.classList.contains("open")) {
    closeMonthPicker();
    return;
  }

  if (datePickerModal.classList.contains("open")) {
    closeDatePicker();
    return;
  }

  closeModal();
});

function openNavigationDrawer() {
  navigationDrawer.classList.add("open");
  navigationDrawer.setAttribute("aria-hidden", "false");
  menuButton.setAttribute("aria-expanded", "true");
  document.body.classList.add("navigation-open");

  window.requestAnimationFrame(() => {
    navigationDrawer
      .querySelector(".navigation-item.active")
      ?.focus();
  });
}

function closeNavigationDrawer() {
  if (!navigationDrawer.classList.contains("open")) {
    return;
  }

  navigationDrawer.classList.remove("open");
  navigationDrawer.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("navigation-open");
  menuButton.focus({ preventScroll: true });
}

function setAppPage(pageId) {
  const targetPage = appPages.find(
    (page) => page.dataset.appPage === pageId,
  );

  if (!targetPage) {
    return;
  }

  currentAppPage = pageId;
  appPageTitle.textContent = APP_PAGE_TITLES[pageId] || "근태관리";

  appPages.forEach((page) => {
    const isActive = page === targetPage;

    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
    page.setAttribute("aria-hidden", String(!isActive));
  });

  appNavigationButtons.forEach((button) => {
    const isActive = button.dataset.appNavigation === pageId;

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  closeNavigationDrawer();
  closeSalaryYearPicker();
  closeAnnualLeaveYearPicker();

  if (pageId === "salary") {
    syncSalaryInputs();
    renderSalary();
  }

  if (pageId === "hours-leave") {
    syncWeeklyDateRangeInputs();
    render52HourCalculator();
    renderAnnualLeaveSummary();
  }

  syncMobilePagerMode();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSalaryYearPicker() {
  renderYearScrollPicker(salaryYearScroller, salarySelectedYear);
  salaryYearPicker.hidden = false;
  salaryYearButton.setAttribute("aria-expanded", "true");

  window.requestAnimationFrame(() => {
    scrollYearPickerToSelected(salaryYearScroller);
    salaryYearScroller
      .querySelector("[aria-selected=\"true\"]")
      ?.focus({ preventScroll: true });
  });
}

function closeSalaryYearPicker() {
  salaryYearPicker.hidden = true;
  salaryYearButton.setAttribute("aria-expanded", "false");
}

function setSalaryYear(year) {
  salarySelectedYear = clampYear(year);
  syncSalaryInputs();
  renderSalary();
}

function openAnnualLeaveYearPicker() {
  renderYearScrollPicker(
    annualLeaveYearScroller,
    annualLeaveSelectedYear,
  );
  annualLeaveYearPicker.hidden = false;
  annualLeaveYearButton.setAttribute("aria-expanded", "true");

  window.requestAnimationFrame(() => {
    scrollYearPickerToSelected(annualLeaveYearScroller);
  });
}

function closeAnnualLeaveYearPicker() {
  annualLeaveYearPicker.hidden = true;
  annualLeaveYearButton.setAttribute("aria-expanded", "false");
}

function clampYear(year) {
  const numericYear = Number(year);

  if (!Number.isFinite(numericYear)) {
    return new Date().getFullYear();
  }

  return Math.min(
    YEAR_MAX,
    Math.max(YEAR_MIN, Math.trunc(numericYear)),
  );
}

function renderYearScrollPicker(container, selectedYear) {
  container.innerHTML = Array.from(
    { length: YEAR_MAX - YEAR_MIN + 1 },
    (_, index) => {
      const year = YEAR_MIN + index;
      const isSelected = year === selectedYear;

      return `
        <button
          class="year-scroll-option${isSelected ? " selected" : ""}"
          type="button"
          role="option"
          data-year-option="${year}"
          aria-selected="${isSelected}"
        >
          ${year}년
        </button>
      `;
    },
  ).join("");
}

function scrollYearPickerToSelected(container) {
  const selectedOption = container.querySelector(
    "[aria-selected=\"true\"]",
  );

  selectedOption?.scrollIntoView({
    block: "center",
    behavior: "auto",
  });
}

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

function openMonthPicker(target) {
  monthPickerTarget = target;
  monthPickerPreviousFocus = document.activeElement;

  const sourceMonth =
    target === "datePicker"
      ? datePickerVisibleMonth
      : currentMonth;

  monthPickerSelectedYear = sourceMonth.getFullYear();
  monthPickerYearScroller.hidden = true;
  monthPickerYearButton.setAttribute("aria-expanded", "false");
  renderMonthPickerMonths();

  monthPickerModal.classList.add("open");
  monthPickerModal.setAttribute("aria-hidden", "false");

  window.requestAnimationFrame(() => {
    closeMonthPickerButton.focus({ preventScroll: true });
  });
}

function closeMonthPicker() {
  if (!monthPickerModal.classList.contains("open")) {
    return;
  }

  monthPickerModal.classList.remove("open");
  monthPickerModal.setAttribute("aria-hidden", "true");
  monthPickerYearScroller.hidden = true;
  monthPickerYearButton.setAttribute("aria-expanded", "false");

  const focusTarget = monthPickerPreviousFocus;

  monthPickerTarget = null;
  monthPickerPreviousFocus = null;
  focusTarget?.focus();
}

function getMonthPickerYear() {
  return monthPickerSelectedYear;
}

function setMonthPickerYear(year) {
  monthPickerSelectedYear = clampYear(year);
  renderMonthPickerMonths();

  if (!monthPickerYearScroller.hidden) {
    renderYearScrollPicker(
      monthPickerYearScroller,
      monthPickerSelectedYear,
    );
    scrollYearPickerToSelected(monthPickerYearScroller);
  }
}

function renderMonthPickerMonths() {
  const sourceMonth =
    monthPickerTarget === "datePicker"
      ? datePickerVisibleMonth
      : currentMonth;
  const selectedYear = getMonthPickerYear();

  monthPickerYearButton.textContent = `${selectedYear}년`;

  monthPickerMonths.forEach((button, monthIndex) => {
    const isActive =
      selectedYear === sourceMonth.getFullYear() &&
      monthIndex === sourceMonth.getMonth();

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "date");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function applyMonthPickerSelection(monthIndex) {
  const selectedYear = getMonthPickerYear();

  if (monthPickerTarget === "datePicker") {
    datePickerVisibleMonth = new Date(
      selectedYear,
      monthIndex,
      1,
    );
    renderDatePicker();
  } else {
    currentMonth = new Date(selectedYear, monthIndex, 1);
    render();
  }

  closeMonthPicker();
}

async function changeMainCalendarMonth(direction) {
  if (mainCalendarMonthAnimating) {
    return;
  }

  mainCalendarMonthAnimating = true;

  try {
    await animateMonthTransition(
      calendarGrid,
      direction,
      () => {
        currentMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + direction,
          1,
        );
        render();
      },
    );
  } finally {
    mainCalendarMonthAnimating = false;
  }
}

async function changeDatePickerMonth(direction) {
  if (datePickerMonthAnimating) {
    return;
  }

  datePickerMonthAnimating = true;

  try {
    await animateMonthTransition(
      datePickerGrid,
      direction,
      () => {
        datePickerVisibleMonth = new Date(
          datePickerVisibleMonth.getFullYear(),
          datePickerVisibleMonth.getMonth() + direction,
          1,
        );
        renderDatePicker();
      },
    );
  } finally {
    datePickerMonthAnimating = false;
  }
}

async function animateMonthTransition(
  grid,
  direction,
  updateMonth,
) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion || typeof grid.animate !== "function") {
    updateMonth();
    return;
  }

  const exitDistance = direction > 0 ? "-32%" : "32%";
  const enterDistance = direction > 0 ? "32%" : "-32%";

  const exitAnimation = grid.animate(
    [
      { transform: "translateX(0)", opacity: 1 },
      { transform: `translateX(${exitDistance})`, opacity: 0 },
    ],
    {
      duration: 130,
      easing: "ease-in",
      fill: "forwards",
    },
  );

  await exitAnimation.finished.catch(() => {});
  exitAnimation.cancel();

  updateMonth();

  const enterAnimation = grid.animate(
    [
      { transform: `translateX(${enterDistance})`, opacity: 0 },
      { transform: "translateX(0)", opacity: 1 },
    ],
    {
      duration: 190,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );

  await enterAnimation.finished.catch(() => {});
}

function attachHorizontalMonthSwipe(element, onSwipe) {
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let suppressClick = false;

  element.addEventListener("pointerdown", (event) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
  });

  element.addEventListener("pointerup", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    activePointerId = null;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (
      Math.abs(deltaX) < 48 ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    suppressClick = true;
    onSwipe(deltaX < 0 ? 1 : -1);

    window.setTimeout(() => {
      suppressClick = false;
    }, 420);
  });

  element.addEventListener("pointercancel", () => {
    activePointerId = null;
  });

  element.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
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
    const holidayName = getHolidayName(dateKey);
    const workType = getWorkType(records[dateKey]);
    const workTypeLabel = workType?.label || "";
    const dayButton = document.createElement("button");

    dayButton.type = "button";
    dayButton.className = "date-picker-day";
    dayButton.innerHTML = `
      <span class="date-picker-day-number">${dayNumber}</span>
      ${
        holidayName
          ? `<span class="date-picker-holiday-name">${escapeHtml(holidayName)}</span>`
          : ""
      }
      ${
        workType
          ? `<span class="date-picker-work-name type-${workType.id}">${escapeHtml(workTypeLabel)}</span>`
          : ""
      }
    `;
    dayButton.setAttribute(
      "aria-label",
      `${year}년 ${month + 1}월 ${dayNumber}일${holidayName ? ` ${holidayName}` : ""}${workTypeLabel ? ` ${workTypeLabel}` : ""} 선택`,
    );

    if (date.getDay() === 6) {
      dayButton.classList.add("saturday");
    }

    if (date.getDay() === 0) {
      dayButton.classList.add("sunday");
    }

    if (holidayName) {
      dayButton.classList.add("holiday");
      dayButton.title = holidayName;
    }

    if (workType) {
      dayButton.classList.add("has-work-record");
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
  saveWeeklyDateRangeFromInputs();
  render52HourCalculator();
  closeDatePicker();
}

function isMobilePagerMode() {
  return (
    (mobilePagerMedia.matches || mobilePagerTestMode) &&
    mobilePages.length > 0 &&
    currentAppPage === "attendance"
  );
}

function syncMobilePagerMode() {
  const isMobile = isMobilePagerMode();

  mobilePageAnimations.forEach((animation) => {
    animation.cancel();
  });

  mobilePageAnimations = [];
  mobilePageAnimating = false;

  document.documentElement.classList.toggle(
    "mobile-pager-enabled",
    isMobile,
  );

  mobilePages.forEach((page, index) => {
    const isActive = index === mobilePageIndex;

    page.classList.remove("mobile-page-transitioning");
    page.classList.toggle(
      "mobile-page-active",
      isMobile && isActive,
    );

    if (isMobile) {
      page.inert = !isActive;
      page.setAttribute("aria-hidden", String(!isActive));
    } else {
      page.inert = false;
      page.removeAttribute("aria-hidden");
    }
  });

  updateMobilePageButtons();

  if (isMobile) {
    initializeBackExitGuard();
  }
}

function setMobilePage(nextIndex, requestedDirection = 0) {
  if (!isMobilePagerMode() || mobilePageAnimating) {
    return;
  }

  const pageCount = mobilePages.length;
  const normalizedIndex =
    ((nextIndex % pageCount) + pageCount) % pageCount;

  if (normalizedIndex === mobilePageIndex) {
    return;
  }

  const forwardDistance =
    (normalizedIndex - mobilePageIndex + pageCount) % pageCount;
  const backwardDistance =
    (mobilePageIndex - normalizedIndex + pageCount) % pageCount;
  const direction =
    requestedDirection ||
    (forwardDistance <= backwardDistance ? 1 : -1);

  const currentPage = mobilePages[mobilePageIndex];
  const nextPage = mobilePages[normalizedIndex];
  const outgoingOffset = direction > 0 ? "-100%" : "100%";
  const incomingOffset = direction > 0 ? "100%" : "-100%";

  mobilePageAnimating = true;
  mobilePageIndex = normalizedIndex;

  nextPage.scrollTop = 0;
  nextPage.inert = false;
  nextPage.setAttribute("aria-hidden", "false");
  nextPage.classList.add("mobile-page-transitioning");

  currentPage.classList.add("mobile-page-transitioning");
  updateMobilePageButtons();

  if (typeof nextPage.animate !== "function") {
    finishMobilePageTransition(currentPage, nextPage);
    return;
  }

  const animationOptions = {
    duration: 330,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "both",
  };

  mobilePageAnimations = [
    currentPage.animate(
      [
        { transform: "translateY(0)" },
        { transform: `translateY(${outgoingOffset})` },
      ],
      animationOptions,
    ),
    nextPage.animate(
      [
        { transform: `translateY(${incomingOffset})` },
        { transform: "translateY(0)" },
      ],
      animationOptions,
    ),
  ];

  Promise.allSettled(
    mobilePageAnimations.map((animation) => animation.finished),
  ).then(() => {
    if (
      !isMobilePagerMode() ||
      mobilePageIndex !== normalizedIndex
    ) {
      return;
    }

    finishMobilePageTransition(currentPage, nextPage);
  });
}

function finishMobilePageTransition(currentPage, nextPage) {
  currentPage.classList.remove(
    "mobile-page-active",
    "mobile-page-transitioning",
  );
  currentPage.inert = true;
  currentPage.setAttribute("aria-hidden", "true");

  nextPage.classList.remove("mobile-page-transitioning");
  nextPage.classList.add("mobile-page-active");
  nextPage.inert = false;
  nextPage.setAttribute("aria-hidden", "false");

  mobilePageAnimations = [];
  mobilePageAnimating = false;
}

function changeMobilePage(direction) {
  setMobilePage(mobilePageIndex + direction, direction);
}

function updateMobilePageButtons() {
  mobilePageButtons.forEach((button, index) => {
    const isActive = index === mobilePageIndex;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", String(isActive));
  });
}

function isMobilePageAtTop(page) {
  return page.scrollTop <= 2;
}

function isMobilePageAtBottom(page) {
  return page.scrollTop + page.clientHeight >= page.scrollHeight - 2;
}

function initializeBackExitGuard() {
  if (!shouldUseBackExitGuard()) {
    return;
  }

  if (!backExitGuardInitialized) {
    backExitGuardInitialized = true;
    window.addEventListener("pageshow", resetBackExitState);
    window.addEventListener("focus", resetBackExitState);
    window.addEventListener("pagehide", prepareBackExitForNextLaunch);
    document.addEventListener(
      "visibilitychange",
      handleAppVisibilityChange,
    );
  }

  ensureBackExitPopstateListener();
  ensureAppCloseWatcher();
  resetBackExitState();
}

function ensureAppCloseWatcher() {
  if (!shouldUseBackExitGuard() || appCloseWatcher) {
    return;
  }

  if (!supportsAppCloseWatcher()) {
    document.documentElement.dataset.backExitGuard = "history";
    return;
  }

  appCloseWatcher = new window.CloseWatcher();
  appCloseWatcher.addEventListener(
    "close",
    handleAppCloseRequest,
    { once: true },
  );
  document.documentElement.dataset.backExitGuard = "close-watcher";
}

function supportsAppCloseWatcher() {
  return typeof window.CloseWatcher === "function";
}

function installBackExitTestHook() {
  if (!mobilePagerTestMode || document.querySelector("#backExitTestButton")) {
    return;
  }

  const testButton = document.createElement("button");
  testButton.id = "backExitTestButton";
  testButton.type = "button";
  testButton.textContent = "back exit test";
  testButton.style.cssText =
    "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.001;z-index:9999;";
  testButton.addEventListener("click", () => {
    if (appCloseWatcher) {
      appCloseWatcher.requestClose();
    } else {
      handleAppBackNavigation();
    }
  });
  document.body.appendChild(testButton);
}

function handleAppCloseRequest() {
  appCloseWatcher = null;

  if (navigationDrawer.classList.contains("open")) {
    closeNavigationDrawer();
    resetBackExitState();
    return;
  }

  if (!salaryYearPicker.hidden) {
    closeSalaryYearPicker();
    resetBackExitState();
    return;
  }

  if (!annualLeaveYearPicker.hidden) {
    closeAnnualLeaveYearPicker();
    resetBackExitState();
    return;
  }

  if (workModal.classList.contains("open")) {
    closeModal();
    resetBackExitState();
    return;
  }

  if (monthPickerModal.classList.contains("open")) {
    closeMonthPicker();
    resetBackExitState();
    return;
  }

  if (datePickerModal.classList.contains("open")) {
    closeDatePicker();
    resetBackExitState();
    return;
  }

  if (!exitBackReady) {
    // 첫 번째 Android 뒤로가기는 CloseWatcher가 소비한다.
    // 안내가 보이는 동안에는 watcher를 만들지 않아 두 번째 요청을
    // Android의 기본 종료 동작으로 그대로 전달한다.
    showExitToast();
    return;
  }

  completeAppExit(true);
}

function ensureBackExitPopstateListener() {
  if (backExitPopstateAttached) {
    return;
  }

  window.addEventListener("popstate", handleAppBackNavigation);
  backExitPopstateAttached = true;
}

function shouldUseBackExitGuard() {
  return (
    isMobilePagerMode() ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function handleAppVisibilityChange() {
  if (document.visibilityState === "hidden") {
    prepareBackExitForNextLaunch();
    return;
  }

  resetBackExitState();
}

function prepareBackExitForNextLaunch() {
  if (!shouldUseBackExitGuard()) {
    return;
  }

  allowAppExitNavigation = false;
  exitBackReady = false;
  window.clearTimeout(exitToastTimer);
  hideExitToast();
  ensureBackExitPopstateListener();
  ensureAppCloseWatcher();
}

function resetBackExitState() {
  if (!shouldUseBackExitGuard()) {
    return;
  }

  allowAppExitNavigation = false;
  exitBackReady = false;
  window.clearTimeout(exitToastTimer);
  hideExitToast();
  ensureBackExitPopstateListener();
  ensureAppCloseWatcher();

  if (supportsAppCloseWatcher()) {
    const currentState =
      window.history.state &&
      typeof window.history.state === "object"
        ? { ...window.history.state }
        : {};

    delete currentState.catAttendanceAppBase;
    delete currentState.catAttendanceExitGuard;
    window.history.replaceState(
      currentState,
      "",
      window.location.href,
    );
    return;
  }

  const currentState =
    window.history.state &&
    typeof window.history.state === "object"
      ? window.history.state
      : {};

  // 설치형 앱을 다시 실행하면 이전 실행의 history.state만 복원되고
  // 실제 이전 항목은 없는 경우가 있다. 새 실행에서는 현재 항목을
  // 기준점으로 다시 만들고 보호 항목을 하나 추가해야 첫 뒤로가기를
  // 항상 안내 문구로 받을 수 있다.
  if (!backExitGuardArmedThisSession) {
    window.history.replaceState(
      {
        ...currentState,
        catAttendanceAppBase: true,
        catAttendanceExitGuard: false,
      },
      "",
      window.location.href,
    );

    backExitGuardArmedThisSession = true;
    restoreBackExitGuard();
    return;
  }

  if (currentState.catAttendanceExitGuard) {
    return;
  }

  if (!currentState.catAttendanceAppBase) {
    window.history.replaceState(
      {
        ...currentState,
        catAttendanceAppBase: true,
      },
      "",
      window.location.href,
    );
  }

  restoreBackExitGuard();
}

function handleAppBackNavigation() {
  if (allowAppExitNavigation) {
    return;
  }

  if (navigationDrawer.classList.contains("open")) {
    closeNavigationDrawer();
    resetBackExitState();
    return;
  }

  if (!salaryYearPicker.hidden) {
    closeSalaryYearPicker();
    resetBackExitState();
    return;
  }

  if (!annualLeaveYearPicker.hidden) {
    closeAnnualLeaveYearPicker();
    resetBackExitState();
    return;
  }

  if (workModal.classList.contains("open")) {
    closeModal();
    resetBackExitState();
    return;
  }

  if (monthPickerModal.classList.contains("open")) {
    closeMonthPicker();
    resetBackExitState();
    return;
  }

  if (datePickerModal.classList.contains("open")) {
    closeDatePicker();
    resetBackExitState();
    return;
  }

  if (!exitBackReady) {
    if (supportsAppCloseWatcher() && appCloseWatcher) {
      appCloseWatcher.destroy();
      appCloseWatcher = null;
    }

    showExitToast();

    if (!supportsAppCloseWatcher()) {
      restoreBackExitGuard();
    }
    return;
  }

  completeAppExit(false);
}

function completeAppExit(fromCloseWatcher) {
  exitBackReady = false;
  allowAppExitNavigation = true;
  window.clearTimeout(exitToastTimer);
  hideExitToast();

  if (appCloseWatcher) {
    appCloseWatcher.destroy();
    appCloseWatcher = null;
  }

  window.removeEventListener("popstate", handleAppBackNavigation);
  backExitPopstateAttached = false;

  if (mobilePagerTestMode) {
    resetBackExitState();
    return;
  }

  window.setTimeout(() => {
    if (fromCloseWatcher) {
      window.history.go(-2);
    } else {
      window.history.back();
    }

    window.setTimeout(() => {
      window.close();

      window.setTimeout(() => {
        prepareBackExitForNextLaunch();
      }, 250);
    }, 120);
  }, 0);
}

function restoreBackExitGuard() {
  const currentState = window.history.state;

  if (currentState?.catAttendanceExitGuard) {
    return;
  }

  window.history.pushState(
    { catAttendanceExitGuard: true },
    "",
    window.location.href,
  );
}

function showExitToast() {
  exitBackReady = true;
  window.clearTimeout(exitToastTimer);

  exitToast.classList.add("show");
  exitToast.setAttribute("aria-hidden", "false");

  exitToastTimer = window.setTimeout(() => {
    exitBackReady = false;
    hideExitToast();
    ensureAppCloseWatcher();
  }, 2200);
}

function hideExitToast() {
  exitToast.classList.remove("show");
  exitToast.setAttribute("aria-hidden", "true");
}

function resetExitPromptAfterUserAction(event) {
  if (!exitBackReady || allowAppExitNavigation) {
    return;
  }

  if (
    event?.type === "keydown" &&
    (event.key === "BrowserBack" ||
      (event.altKey && event.key === "ArrowLeft"))
  ) {
    return;
  }

  resetBackExitState();
}

["pointerdown", "input", "change"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    resetExitPromptAfterUserAction,
    true,
  );
});

document.addEventListener(
  "keydown",
  resetExitPromptAfterUserAction,
  true,
);

window.addEventListener(
  "scroll",
  resetExitPromptAfterUserAction,
  { passive: true, capture: true },
);

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
  syncWeeklyDateRangeInputs();
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

    const workRecord = records[dateKey];
    const workType = getWorkType(workRecord);

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
      dayButton.title = holidayName;
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
          ? `<span class="work-badge">${escapeHtml(workType.label)}</span>`
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

  recordedDays.textContent = formatUnit(stats.recordedDays, "일");

  summaryGrid.innerHTML = SUMMARY_WORK_TYPES.map(
    (workType) => `
      <div class="summary-item">
        <span class="summary-dot type-${workType.id}"></span>

        <span class="summary-label">
          ${workType.label}
        </span>

        <strong>${formatUnit(stats.counts[workType.id], "일")}</strong>
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

  const workTotals = [
    [
      "근무기록 일수",
      formatUnit(formatNumber(stats.regularDays), "일"),
    ],
    ["기본급 적용일수", formatUnit(basePayDays, "일")],
    ["일요일 수", formatUnit(sundayCount, "일")],
    ["기본급 시간", formatUnit(basePayHours, "시간")],
    [
      "연장시간",
      formatUnit(formatNumber(stats.overtimeHours), "시간"),
    ],
    [
      "심야시간",
      formatUnit(formatNumber(stats.nightHours), "시간"),
    ],
    [
      "철야시간",
      formatUnit(formatNumber(stats.overnightHours), "시간"),
    ],
    [
      "휴일시간",
      formatUnit(formatNumber(stats.holidayHours), "시간"),
    ],
    [
      "휴연시간",
      formatUnit(
        formatNumber(stats.holidayOvertimeHours),
        "시간",
      ),
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

  render52HourCalculator();
  renderAnnualLeaveSummary();
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
      <div class="weekly-result-grid">
        <div class="weekly-result-item weekly-duration">
          <strong>${formatUnit(fullWeeks, "주")} ${formatUnit(remainingDays, "일")}</strong>
          <span>동안</span>
        </div>

        <div class="weekly-result-item">
          <span>총 근무시간</span>
          <strong>${formatUnit(formatTotalWorkHours(totalWorkHours), "시간")}</strong>
        </div>

        <div class="weekly-result-item">
          <span>평균 근무시간</span>
          <strong>${formatUnit(formatAverageHours(averageHours), "시간")}</strong>
        </div>
      </div>
    </div>
  `;
  weeklyAverageResult.classList.remove("error");
  weeklyAverageResult.classList.add("has-result");
}

function renderAnnualLeaveSummary(syncInput = true) {
  const year = annualLeaveSelectedYear;
  const accruedLeave = getAnnualLeaveForYear(year);
  const usedLeave = countUsedAnnualLeave(year);
  const remainingLeave = accruedLeave - usedLeave;

  annualLeaveYearButton.textContent = `${year}년`;

  if (syncInput) {
    accruedAnnualLeaveInput.value =
      accruedLeave === 0 ? "" : String(accruedLeave);
  }

  usedAnnualLeaveOutput.textContent =
    formatUnit(formatAnnualLeaveDays(usedLeave), "일");
  remainingAnnualLeaveOutput.textContent =
    formatUnit(formatAnnualLeaveDays(remainingLeave), "일");
  remainingAnnualLeaveOutput.classList.toggle(
    "negative",
    remainingLeave < 0,
  );

  renderAnnualLeaveHistory(year);
}

function renderAnnualLeaveHistory(year) {
  const ranges = getAnnualLeaveRanges(year);

  if (ranges.length === 0) {
    annualLeaveHistoryBody.innerHTML = `
      <div class="annual-leave-history-empty">
        이 연도에 사용한 연차가 없습니다.
      </div>
    `;
    return;
  }

  annualLeaveHistoryBody.innerHTML = ranges
    .map((range) => {
      const endText = range.days === 1
        ? ""
        : formatAnnualLeaveHistoryDate(range.end);
      const rangeKey = getAnnualLeaveReasonKey(year, range.start);
      const reason = annualLeaveReasons[rangeKey] || "";

      return `
        <div class="annual-leave-history-row" role="row">
          <span role="cell">${formatAnnualLeaveHistoryDate(range.start)}</span>
          <span role="cell">${endText}</span>
          <span role="cell">${range.days}일</span>
          <label class="annual-leave-reason-cell" role="cell">
            <span class="sr-only">${formatAnnualLeaveHistoryDate(range.start)} 연차 사유</span>
            <input
              type="text"
              maxlength="120"
              autocomplete="off"
              placeholder="사유 입력"
              data-annual-leave-reason="${rangeKey}"
              value="${escapeHtml(reason)}"
            />
          </label>
        </div>
      `;
    })
    .join("");
}

function getAnnualLeaveRanges(year) {
  const yearPrefix = `${year}-`;
  const oneDay = 24 * 60 * 60 * 1000;

  const leaveDates = Object.entries(records)
    .filter(([dateKey, workRecord]) =>
      dateKey.startsWith(yearPrefix) &&
      getWorkType(workRecord)?.id === "annualLeave"
    )
    .map(([dateKey]) => {
      const [dateYear, month, day] = dateKey.split("-").map(Number);
      return {
        dateKey,
        time: Date.UTC(dateYear, month - 1, day),
        month,
        day,
      };
    })
    .sort((left, right) => left.time - right.time);

  return leaveDates.reduce((ranges, date) => {
    const currentRange = ranges[ranges.length - 1];

    if (!currentRange || date.time - currentRange.end.time !== oneDay) {
      ranges.push({ start: date, end: date, days: 1 });
      return ranges;
    }

    currentRange.end = date;
    currentRange.days += 1;
    return ranges;
  }, []);
}

function formatAnnualLeaveHistoryDate(date) {
  return `${date.month}월 ${date.day}일`;
}

function getAnnualLeaveReasonKey(year, startDate) {
  return `${year}:${startDate.dateKey}`;
}

function getAnnualLeaveForYear(year) {
  const value = Number(annualLeaveByYear[String(year)]);

  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function countUsedAnnualLeave(year) {
  const yearPrefix = `${year}-`;

  return Object.entries(records).reduce(
    (count, [dateKey, workRecord]) => {
      if (!dateKey.startsWith(yearPrefix)) {
        return count;
      }

      return getWorkType(workRecord)?.id === "annualLeave"
        ? count + 1
        : count;
    },
    0,
  );
}

function formatAnnualLeaveDays(value) {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function sanitizeAnnualLeaveInput(value) {
  const normalizedValue = String(value)
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const [integerPart = "", ...fractionParts] =
    normalizedValue.split(".");

  if (fractionParts.length === 0) {
    return integerPart;
  }

  const fractionPart = fractionParts.join("").slice(0, 1);
  const safeIntegerPart = integerPart || "0";

  return `${safeIntegerPart}.${fractionPart}`;
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

function get52HourWorkHours(workRecord) {
  const workType = getWorkType(workRecord);

  if (
    !workType ||
    workType.id === "annualLeave" ||
    workType.id === CUSTOM_WORK_TYPE.id
  ) {
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
  salaryYearButton.textContent = `${salarySelectedYear}년 ▾`;

  let annualTotalPay = 0;

  salaryYearGrid.innerHTML = Array.from(
    { length: 12 },
    (_, monthIndex) => {
      const salary = calculateSalaryForMonth(
        salarySelectedYear,
        monthIndex,
      );
      const isSelected = monthIndex === salarySelectedMonth;

      annualTotalPay += salary.totalPay;

      return `
        <button
          class="salary-month-card${isSelected ? " selected" : ""}"
          type="button"
          data-salary-month="${monthIndex}"
          aria-current="${isSelected ? "true" : "false"}"
          aria-label="${salarySelectedYear}년 ${monthIndex + 1}월 예상 총급여 ${formatMoney(salary.totalPay)}"
        >
          <span>${monthIndex + 1}월</span>
          <strong>${formatMoneyValue(salary.totalPay)}</strong>
        </button>
      `;
    },
  ).join("");

  annualSalaryTotal.textContent = formatMoney(annualTotalPay);

  const salary = calculateSalaryForMonth(
    salarySelectedYear,
    salarySelectedMonth,
  );

  salaryMonthTitle.textContent =
    `${salarySelectedYear}년 ${salarySelectedMonth + 1}월 예상 급여`;

  ordinaryHourlyWageOutput.textContent =
    formatMoneyValue(salary.ordinaryHourlyWage);

  totalPayOutput.textContent = formatMoney(salary.totalPay);

  const paymentRows = [
    ["기본급", salary.payments.basePay],
    ["주차수당", salary.payments.weeklyAllowance],
    ["연장수당", salary.payments.overtimePay],
    ["심야수당", salary.payments.nightPay],
    ["철야수당", salary.payments.overnightPay],
    ["휴일수당", salary.payments.holidayPay],
    ["휴연수당", salary.payments.holidayOvertimePay],
    ["안전수당", salary.safetyAllowance],
    ["근속수당", salary.longevityAllowance],
    ["기타수당", salary.otherAllowance],
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

function calculateSalaryForMonth(year, month) {
  const stats = calculateMonthStats(year, month);
  const settings = getSettingsForMonth(year, month);

  const baseHourlyWage = Number(settings.baseHourlyWage) || 0;
  const safetyAllowance = Number(settings.safetyAllowance) || 0;
  const longevityAllowance =
    Number(settings.longevityAllowance) || 0;
  const otherAllowance = Number(settings.otherAllowance) || 0;

  const ordinaryHourlyWage =
    baseHourlyWage +
    (safetyAllowance + longevityAllowance) / 243;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const sundayCount = countSundaysInMonth(year, month);
  const basePayDays = daysInMonth - sundayCount;
  const basePayHours = basePayDays * 8;

  const payments = {
    basePay: basePayHours * baseHourlyWage,
    weeklyAllowance: sundayCount * 8 * baseHourlyWage,
    overtimePay:
      ordinaryHourlyWage * stats.overtimeHours * 1.5,
    nightPay:
      ordinaryHourlyWage * stats.nightHours * 0.5,
    overnightPay:
      ordinaryHourlyWage * stats.overnightHours * 2,
    holidayPay:
      ordinaryHourlyWage * stats.holidayHours * 1.5,
    holidayOvertimePay:
      ordinaryHourlyWage * stats.holidayOvertimeHours * 2,
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

  return {
    stats,
    settings,
    payments,
    totalPay,
    ordinaryHourlyWage,
    baseHourlyWage,
    safetyAllowance,
    longevityAllowance,
    otherAllowance,
    basePayDays,
    basePayHours,
    sundayCount,
  };
}

function calculateMonthStats(
  year = currentMonth.getFullYear(),
  month = currentMonth.getMonth(),
) {

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

  SUMMARY_WORK_TYPES.forEach((workType) => {
    stats.counts[workType.id] = 0;
  });

  for (const [dateKey, workRecord] of Object.entries(records)) {
    const recordDate = parseDateKey(dateKey);

    if (
      recordDate.year !== year ||
      recordDate.month !== month
    ) {
      continue;
    }

    const workType = getWorkType(workRecord);

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

  const selectedWorkRecord = records[dateKey];
  const selectedWorkType = getWorkType(selectedWorkRecord);
  const selectedWorkTypeId = selectedWorkType?.id || "";

  workTypeList.innerHTML = `
    ${WORK_TYPE_PICKER_ORDER.map((workTypeId) =>
      WORK_TYPES.find((workType) => workType.id === workTypeId),
    ).map(
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
    ).join("")}

    <button
      type="button"
      class="work-type-button type-custom
        ${selectedWorkTypeId === CUSTOM_WORK_TYPE.id ? "selected" : ""}"
      data-custom-work-type
    >
      <span class="work-type-color"></span>
      <span>직접 입력</span>
    </button>
  `;

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

  const customWorkTypeButton = workTypeList.querySelector(
    "[data-custom-work-type]",
  );

  customWorkTypeButton.addEventListener("click", () => {
    const initialValue =
      selectedWorkTypeId === CUSTOM_WORK_TYPE.id
        ? selectedWorkType.label
        : "";

    showCustomWorkTypeEditor(initialValue);
  });

  if (selectedWorkTypeId === CUSTOM_WORK_TYPE.id) {
    showCustomWorkTypeEditor(selectedWorkType.label);
  } else {
    hideCustomWorkTypeEditor();
  }

  deleteRecordButton.hidden = !selectedWorkRecord;

  workModal.classList.add("open");
  workModal.setAttribute("aria-hidden", "false");
}

function showCustomWorkTypeEditor(initialValue = "") {
  customWorkTypeEditor.hidden = false;
  customWorkTypeInput.value = initialValue;
  customWorkTypeMessage.textContent =
    "직접 입력한 기록은 근무시간 0\u2009시간으로 계산됩니다.";
  customWorkTypeMessage.classList.remove("error");

  customWorkTypeInput.focus();
  customWorkTypeInput.select();

  window.requestAnimationFrame(() => {
    customWorkTypeInput.focus();
    customWorkTypeInput.select();
  });
}

function hideCustomWorkTypeEditor() {
  customWorkTypeEditor.hidden = true;
  customWorkTypeInput.value = "";
  customWorkTypeMessage.textContent =
    "직접 입력한 기록은 근무시간 0\u2009시간으로 계산됩니다.";
  customWorkTypeMessage.classList.remove("error");
}

function saveCustomWorkType() {
  if (!selectedDateKey) {
    return;
  }

  const label = normalizeCustomLabel(customWorkTypeInput.value);

  if (!label) {
    customWorkTypeMessage.textContent = "내용을 입력해 주세요.";
    customWorkTypeMessage.classList.add("error");
    customWorkTypeInput.focus();
    return;
  }

  records[selectedDateKey] = {
    type: CUSTOM_WORK_TYPE.id,
    label,
  };

  saveRecords();
  closeModal();
  render();
}

function closeModal() {
  workModal.classList.remove("open");
  workModal.setAttribute("aria-hidden", "true");

  hideCustomWorkTypeEditor();
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

function getWorkType(workRecord) {
  if (isCustomWorkRecord(workRecord)) {
    const label = normalizeCustomLabel(workRecord.label);

    if (!label) {
      return null;
    }

    return {
      ...CUSTOM_WORK_TYPE,
      label,
    };
  }

  if (typeof workRecord !== "string") {
    return null;
  }

  return WORK_TYPES.find(
    (workType) => workType.id === workRecord,
  );
}

function isCustomWorkRecord(workRecord) {
  return Boolean(
    workRecord &&
      typeof workRecord === "object" &&
      workRecord.type === CUSTOM_WORK_TYPE.id &&
      typeof workRecord.label === "string",
  );
}

function normalizeCustomLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 20);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  return formatUnit(formatMoneyValue(value), "원");
}

function formatUnit(value, unit) {
  return `${value}\u2009${unit}`;
}

function formatMoneyValue(value) {
  const safeValue = Number.isFinite(value)
    ? value
    : 0;

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(Math.round(safeValue));
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

function loadWeeklyDateRange() {
  try {
    const savedRange = localStorage.getItem(WEEKLY_RANGE_KEY);

    if (!savedRange) {
      return {
        startDate: "",
        endDate: "",
      };
    }

    const parsedRange = JSON.parse(savedRange);
    const startDate = parseDateInputValue(
      parsedRange?.startDate,
    )
      ? parsedRange.startDate
      : "";
    const endDate = parseDateInputValue(parsedRange?.endDate)
      ? parsedRange.endDate
      : "";

    return {
      startDate,
      endDate,
    };
  } catch (error) {
    console.error(
      "52시간 계산기 날짜를 불러오지 못했습니다.",
      error,
    );

    return {
      startDate: "",
      endDate: "",
    };
  }
}

function saveWeeklyDateRangeFromInputs() {
  weeklyDateRange = {
    startDate: weeklyStartDateInput.value,
    endDate: weeklyEndDateInput.value,
  };

  localStorage.setItem(
    WEEKLY_RANGE_KEY,
    JSON.stringify(weeklyDateRange),
  );
}

function syncWeeklyDateRangeInputs() {
  weeklyStartDateInput.value = weeklyDateRange.startDate || "";
  weeklyEndDateInput.value = weeklyDateRange.endDate || "";
}

function loadAnnualLeaveByYear() {
  try {
    const savedAnnualLeave = localStorage.getItem(
      ANNUAL_LEAVE_KEY,
    );

    if (!savedAnnualLeave) {
      return {};
    }

    const parsedAnnualLeave = JSON.parse(savedAnnualLeave);

    if (
      !parsedAnnualLeave ||
      typeof parsedAnnualLeave !== "object" ||
      Array.isArray(parsedAnnualLeave)
    ) {
      return {};
    }

    return parsedAnnualLeave;
  } catch (error) {
    console.error(
      "연도별 발생 연차를 불러오지 못했습니다.",
      error,
    );

    return {};
  }
}

function saveAnnualLeaveByYear() {
  localStorage.setItem(
    ANNUAL_LEAVE_KEY,
    JSON.stringify(annualLeaveByYear),
  );
}

function loadAnnualLeaveReasons() {
  try {
    const savedReasons = localStorage.getItem(ANNUAL_LEAVE_REASON_KEY);

    if (!savedReasons) {
      return {};
    }

    const parsedReasons = JSON.parse(savedReasons);

    return parsedReasons &&
      typeof parsedReasons === "object" &&
      !Array.isArray(parsedReasons)
      ? parsedReasons
      : {};
  } catch (error) {
    console.error("연차 사용 사유를 불러오지 못했습니다.", error);
    return {};
  }
}

function saveAnnualLeaveReasons() {
  localStorage.setItem(
    ANNUAL_LEAVE_REASON_KEY,
    JSON.stringify(annualLeaveReasons),
  );
}

function getMonthKey(date) {
  return getMonthKeyFromParts(
    date.getFullYear(),
    date.getMonth(),
  );
}

function getMonthKeyFromParts(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getSettingsForMonth(year, month) {
  const monthKey = getMonthKeyFromParts(year, month);

  return {
    ...DEFAULT_SETTINGS,
    ...(settingsByMonth[monthKey] || {}),
  };
}

function getCurrentMonthSettings() {
  return getSettingsForMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );
}

function syncSalaryInputs() {
  const settings = getSettingsForMonth(
    salarySelectedYear,
    salarySelectedMonth,
  );

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

syncMobilePagerMode();
initializeBackExitGuard();
installBackExitTestHook();
render();
loadHolidays();
