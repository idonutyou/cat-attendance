(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`cat-attendance-records-v1`,t=`cat-attendance-settings-by-month-v2`,n=`cat-attendance-settings-v2`,r=`cat-attendance-settings-v1`,i={baseHourlyWage:0,safetyAllowance:0,longevityAllowance:0,otherAllowance:0},a=[{id:`day`,label:`주간`,totals:{regularDays:1}},{id:`night`,label:`야간`,totals:{regularDays:1,nightHours:6}},{id:`dayOvertime`,label:`주간잔업`,totals:{regularDays:1,overtimeHours:2.5}},{id:`nightOvertime`,label:`야간잔업`,totals:{regularDays:1,overtimeHours:2,nightHours:7,overnightHours:1}},{id:`dayHoliday`,label:`주간특근`,totals:{holidayHours:8}},{id:`nightHoliday`,label:`야간특근`,totals:{holidayHours:8,nightHours:6}},{id:`dayHolidayOvertime`,label:`주간특근잔업`,totals:{holidayHours:8,holidayOvertimeHours:2.5}},{id:`nightHolidayOvertime`,label:`야간특근잔업`,totals:{holidayHours:8,holidayOvertimeHours:2,nightHours:6,overnightHours:1}},{id:`annualLeave`,label:`연차`,totals:{regularDays:1}}],o=new Date;o=new Date(o.getFullYear(),o.getMonth(),1);var s=null,c=0,l=null,u=new Date,d=null,f=Te(),p=De(),m={},ee=document.querySelector(`#app`);ee.innerHTML=`
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
`;var te=document.querySelector(`#monthTitle`),h=document.querySelector(`#calendarGrid`),ne=document.querySelector(`#summaryCard`),g=document.querySelector(`#summaryCarousel`),re=document.querySelector(`#summaryTrack`),_=[...document.querySelectorAll(`[data-summary-slide]`)],v=[...document.querySelectorAll(`[data-summary-page]`)],ie=document.querySelector(`#summaryGrid`),ae=document.querySelector(`#recordedDays`),y=document.querySelector(`#weeklyStartDate`),b=document.querySelector(`#weeklyEndDate`),x=document.querySelector(`#weeklyAverageResult`),S=document.querySelector(`#datePickerModal`),oe=document.querySelector(`#datePickerTitle`),C=document.querySelector(`#datePickerGrid`),se=document.querySelector(`#closeDatePickerButton`),ce=document.querySelector(`#salaryMonthTitle`),le=document.querySelector(`#workTotalsGrid`),ue=document.querySelector(`#payBreakdown`),de=document.querySelector(`#ordinaryHourlyWageOutput`),fe=document.querySelector(`#totalPayOutput`),w=document.querySelector(`#baseHourlyWage`),T=document.querySelector(`#safetyAllowance`),E=document.querySelector(`#longevityAllowance`),D=document.querySelector(`#otherAllowance`),O=document.querySelector(`#workModal`),pe=document.querySelector(`#modalTitle`),k=document.querySelector(`#workTypeList`),A=document.querySelector(`#deleteRecordButton`);document.querySelector(`#previousMonth`).addEventListener(`click`,()=>{o=new Date(o.getFullYear(),o.getMonth()-1,1),z()}),document.querySelector(`#nextMonth`).addEventListener(`click`,()=>{o=new Date(o.getFullYear(),o.getMonth()+1,1),z()}),document.querySelector(`#todayButton`).addEventListener(`click`,()=>{let e=new Date;o=new Date(e.getFullYear(),e.getMonth(),1),z()}),document.querySelector(`#resetMonthButton`).addEventListener(`click`,()=>{let e=o.getFullYear(),t=o.getMonth(),n=`${e}-${String(t+1).padStart(2,`0`)}-`;if(!Object.keys(f).some(e=>e.startsWith(n))){window.alert(`이 달에는 초기화할 근무기록이 없습니다.`);return}window.confirm(`${e}년 ${t+1}월 근무기록을 모두 삭제할까요?\n\n기본시급과 수당 설정은 유지됩니다.`)&&(Object.keys(f).forEach(e=>{e.startsWith(n)&&delete f[e]}),Z(),z())}),document.querySelector(`#closeModalButton`).addEventListener(`click`,G),document.querySelector(`[data-close-modal]`).addEventListener(`click`,G),A.addEventListener(`click`,()=>{s&&(delete f[s],Z(),G(),z())}),v.forEach(e=>{e.addEventListener(`click`,()=>{L(Number(e.dataset.summaryPage))})});var j=0,M=0;g.addEventListener(`touchstart`,e=>{let[t]=e.changedTouches;j=t.clientX,M=t.clientY},{passive:!0}),g.addEventListener(`touchend`,e=>{let[t]=e.changedTouches,n=t.clientX-j,r=t.clientY-M;Math.abs(n)<45||Math.abs(n)<=Math.abs(r)||R(n<0?1:-1)},{passive:!0}),ne.addEventListener(`keydown`,e=>{e.key===`ArrowLeft`&&(e.preventDefault(),R(-1)),e.key===`ArrowRight`&&(e.preventDefault(),R(1))}),[y,b].forEach(e=>{e.addEventListener(`click`,()=>{N(e)}),e.addEventListener(`keydown`,t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),N(e))})}),document.querySelectorAll(`[data-date-picker-target]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=document.querySelector(`#${e.dataset.datePickerTarget}`);t&&N(t)})}),document.querySelector(`#datePickerPreviousMonth`).addEventListener(`click`,()=>{u=new Date(u.getFullYear(),u.getMonth()-1,1),F()}),document.querySelector(`#datePickerNextMonth`).addEventListener(`click`,()=>{u=new Date(u.getFullYear(),u.getMonth()+1,1),F()}),document.querySelector(`#datePickerTodayButton`).addEventListener(`click`,()=>{let e=new Date;I(K(e.getFullYear(),e.getMonth(),e.getDate()))}),se.addEventListener(`click`,P),document.querySelector(`[data-close-date-picker]`).addEventListener(`click`,P),[w,T,E,D].forEach(e=>{e.addEventListener(`input`,()=>{let e=Q(o);p[e]={baseHourlyWage:J(w),safetyAllowance:J(T),longevityAllowance:J(E),otherAllowance:J(D)},Oe(),H()})}),document.addEventListener(`keydown`,e=>{if(e.key===`Escape`){if(S.classList.contains(`open`)){P();return}G()}});function N(e){let t=V(e.value),n=new Date;l=e,d=document.activeElement,u=t?new Date(t.getUTCFullYear(),t.getUTCMonth(),1):new Date(n.getFullYear(),n.getMonth(),1),F(),S.classList.add(`open`),S.setAttribute(`aria-hidden`,`false`),window.requestAnimationFrame(()=>{(C.querySelector(`.selected`)||C.querySelector(`.today`)||C.querySelector(`button`))?.focus()})}function P(){if(!S.classList.contains(`open`))return;S.classList.remove(`open`),S.setAttribute(`aria-hidden`,`true`);let e=d;l=null,d=null,e?.focus()}function F(){let e=u.getFullYear(),t=u.getMonth(),n=new Date(e,t+1,0).getDate(),r=(new Date(e,t,1).getDay()+6)%7,i=l?.value||``,a=new Date,o=K(a.getFullYear(),a.getMonth(),a.getDate());oe.textContent=`${e}년 ${t+1}월`,C.innerHTML=``;for(let a=0;a<42;a+=1){let s=a-r+1;if(s<1||s>n){let e=document.createElement(`span`);e.className=`date-picker-day empty`,e.setAttribute(`aria-hidden`,`true`),C.appendChild(e);continue}let c=new Date(e,t,s),l=K(e,t,s),u=document.createElement(`button`);u.type=`button`,u.className=`date-picker-day`,u.textContent=String(s),u.setAttribute(`aria-label`,`${e}년 ${t+1}월 ${s}일 선택`),c.getDay()===6&&u.classList.add(`saturday`),c.getDay()===0&&u.classList.add(`sunday`),l===o&&u.classList.add(`today`),l===i&&(u.classList.add(`selected`),u.setAttribute(`aria-current`,`date`)),u.addEventListener(`click`,()=>{I(l)}),C.appendChild(u)}}function I(e){l&&(l.value=e,B(),P())}function L(e){let t=_.length;c=(e%t+t)%t,re.style.transform=`translateX(-${c*100}%)`,_.forEach((e,t)=>{e.setAttribute(`aria-hidden`,String(t!==c))}),v.forEach((e,t)=>{let n=t===c;e.classList.toggle(`active`,n),e.setAttribute(`aria-current`,String(n))})}function R(e){L(c+e)}function z(){me(),he(),Ee(),H()}function me(){let e=o.getFullYear(),t=o.getMonth();te.textContent=`${e}년 ${t+1}월`,h.innerHTML=``;let n=new Date(e,t,1),r=new Date(e,t+1,0).getDate(),i=(n.getDay()+6)%7,a=new Date;for(let n=0;n<42;n+=1){let o=n-i+1;if(o<1||o>r){let e=document.createElement(`div`);e.className=`day-cell empty`,h.appendChild(e);continue}let s=new Date(e,t,o),c=K(e,t,o),l=Ce(c),u=f[c],d=q(u),p=document.createElement(`button`);p.type=`button`,p.className=`day-cell`,a.getFullYear()===e&&a.getMonth()===t&&a.getDate()===o&&p.classList.add(`today`),s.getDay()===0&&p.classList.add(`sunday-cell`),s.getDay()===6&&p.classList.add(`saturday-cell`),l&&(p.classList.add(`holiday-cell`),p.setAttribute(`aria-label`,`${e}년 ${t+1}월 ${o}일 ${l}`)),d&&p.classList.add(`type-${d.id}`),p.innerHTML=`
      <span class="day-number">${o}</span>

      ${l?`<span class="holiday-name">${l}</span>`:``}

      ${d?`<span class="work-badge">${d.label}</span>`:`<span class="empty-record">근무 선택</span>`}
    `,p.addEventListener(`click`,()=>{xe(c,e,t,o)}),h.appendChild(p)}}function he(){let e=o.getFullYear(),t=o.getMonth(),n=U();ae.textContent=`${n.recordedDays}일`,ie.innerHTML=a.map(e=>`
      <div class="summary-item">
        <span class="summary-dot type-${e.id}"></span>

        <span class="summary-label">
          ${e.label}
        </span>

        <strong>${n.counts[e.id]}일</strong>
      </div>
    `).join(``),(new Date(e,t+1,0).getDate()-W(e,t))*8,B(),L(c)}function B(){let e=V(y.value),t=V(b.value);if(!e||!t){x.textContent=`시작일과 종료일을 선택해 주세요.`,x.classList.remove(`error`),x.classList.remove(`has-result`);return}if(e.getTime()>t.getTime()){x.textContent=`종료일은 시작일보다 빠를 수 없습니다.`,x.classList.add(`error`),x.classList.remove(`has-result`);return}let{averageHours:n,dayCount:r,totalWorkHours:i}=ge(e,t);x.innerHTML=`
    <div class="weekly-result-summary">
      <div class="weekly-duration">
        <strong>${Math.floor(r/7)}주 ${r%7}일</strong> 동안
      </div>

      <div class="weekly-result-grid">
        <div class="weekly-result-item">
          <span>총 근무시간</span>
          <strong>${ye(i)} 시간</strong>
        </div>

        <div class="weekly-result-item">
          <span>평균 근무시간</span>
          <strong>${be(n)} 시간</strong>
        </div>
      </div>
    </div>
  `,x.classList.remove(`error`),x.classList.add(`has-result`)}function ge(e,t){let n=1440*60*1e3,r=Math.floor((t.getTime()-e.getTime())/n)+1,i=0;for(let r=e.getTime();r<=t.getTime();r+=n){let e=ve(new Date(r));i+=_e(f[e])}return{averageHours:i/(r*.14285714285714),dayCount:r,totalWorkHours:i}}function _e(e){let t=q(e);return!t||t.id===`annualLeave`?0:t.label.endsWith(`잔업`)?10.5:8}function V(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(e))return null;let[t,n,r]=e.split(`-`).map(Number),i=new Date(Date.UTC(t,n-1,r));return i.getUTCFullYear()!==t||i.getUTCMonth()!==n-1||i.getUTCDate()!==r?null:i}function ve(e){return`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`}function ye(e){return new Intl.NumberFormat(`ko-KR`,{minimumFractionDigits:0,maximumFractionDigits:1}).format(e)}function be(e){return new Intl.NumberFormat(`ko-KR`,{minimumFractionDigits:2,maximumFractionDigits:2}).format(e)}function H(){let e=o.getFullYear(),t=o.getMonth(),n=U(),r=$(),i=Number(r.baseHourlyWage)||0,a=Number(r.safetyAllowance)||0,s=Number(r.longevityAllowance)||0,c=Number(r.otherAllowance)||0,l=i+(a+s)/243,u=new Date(e,t+1,0).getDate(),d=W(e,t),f=u-d,p=f*8,m={basePay:p*i,weeklyAllowance:d*8*i,overtimePay:l*n.overtimeHours*1.5,nightPay:l*n.nightHours*.5,overnightPay:l*n.overnightHours*2,holidayPay:l*n.holidayHours*1.5,holidayOvertimePay:l*n.holidayOvertimeHours*2},ee=m.basePay+m.weeklyAllowance+m.overtimePay+m.nightPay+m.overnightPay+m.holidayPay+m.holidayOvertimePay+a+s+c;ce.textContent=`${e}년 ${t+1}월 예상 급여`,de.textContent=Y(l),fe.textContent=Y(ee),le.innerHTML=[[`근무기록 일수`,`${X(n.regularDays)}일`],[`기본급 적용일수`,`${f}일`],[`일요일 수`,`${d}일`],[`기본급 시간`,`${p}시간`],[`연장시간`,`${X(n.overtimeHours)}시간`],[`심야시간`,`${X(n.nightHours)}시간`],[`철야시간`,`${X(n.overnightHours)}시간`],[`휴일시간`,`${X(n.holidayHours)}시간`],[`휴연시간`,`${X(n.holidayOvertimeHours)}시간`]].map(([e,t])=>`
        <div class="work-total-row">
          <span>${e}</span>
          <strong>${t}</strong>
        </div>
      `).join(``),ue.innerHTML=[[`기본급`,m.basePay],[`주차수당`,m.weeklyAllowance],[`연장수당`,m.overtimePay],[`심야수당`,m.nightPay],[`철야수당`,m.overnightPay],[`휴일수당`,m.holidayPay],[`휴연수당`,m.holidayOvertimePay],[`안전수당`,a],[`근속수당`,s],[`기타수당`,c]].map(([e,t])=>`
        <div class="payment-row">
          <span>${e}</span>
          <strong>${Y(t)}</strong>
        </div>
      `).join(``)}function U(){let e=o.getFullYear(),t=o.getMonth(),n={recordedDays:0,regularDays:0,overtimeHours:0,nightHours:0,overnightHours:0,holidayHours:0,holidayOvertimeHours:0,counts:{}};a.forEach(e=>{n.counts[e.id]=0});for(let[r,i]of Object.entries(f)){let a=Se(r);if(a.year!==e||a.month!==t)continue;let o=q(i);o&&(n.recordedDays+=1,n.counts[o.id]+=1,Object.entries(o.totals).forEach(([e,t])=>{n[e]+=t}))}return n}function W(e,t){let n=new Date(e,t+1,0).getDate(),r=0;for(let i=1;i<=n;i+=1)new Date(e,t,i).getDay()===0&&(r+=1);return r}function xe(e,t,n,r){s=e,pe.textContent=`${t}년 ${n+1}월 ${r}일`;let i=f[e];k.innerHTML=a.map(e=>`
      <button
        type="button"
        class="work-type-button type-${e.id}
          ${i===e.id?`selected`:``}"
        data-work-type="${e.id}"
      >
        <span class="work-type-color"></span>
        <span>${e.label}</span>
      </button>
    `).join(``),k.querySelectorAll(`[data-work-type]`).forEach(e=>{e.addEventListener(`click`,()=>{f[s]=e.dataset.workType,Z(),G(),z()})}),A.hidden=!i,O.classList.add(`open`),O.setAttribute(`aria-hidden`,`false`)}function G(){O.classList.remove(`open`),O.setAttribute(`aria-hidden`,`true`),s=null}function K(e,t,n){return`${e}-${String(t+1).padStart(2,`0`)}-${String(n).padStart(2,`0`)}`}function Se(e){let[t,n,r]=e.split(`-`).map(Number);return{year:t,month:n-1,day:r}}function q(e){return a.find(t=>t.id===e)}function Ce(e){return m[e]||``}async function we(){try{let e=await fetch(`/cat-attendance/holidays.json`,{cache:`no-cache`});if(!e.ok)throw Error(`HTTP ${e.status}`);m=await e.json(),z()}catch(e){console.error(`공휴일 정보를 불러오지 못했습니다.`,e)}}function J(e){let t=Number(e.value);return!Number.isFinite(t)||t<0?0:t}function Y(e){let t=Number.isFinite(e)?e:0;return`${new Intl.NumberFormat(`ko-KR`,{maximumFractionDigits:0}).format(Math.round(t))}원`}function X(e){return Number.isInteger(e)?String(e):e.toFixed(1).replace(/\.0$/,``)}function Te(){try{let t=localStorage.getItem(e);return t?JSON.parse(t):{}}catch(e){return console.error(`저장된 근무기록을 불러오지 못했습니다.`,e),{}}}function Z(){localStorage.setItem(e,JSON.stringify(f))}function Q(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}`}function $(){let e=Q(o);return{...i,...p[e]||{}}}function Ee(){let e=$();w.value=e.baseHourlyWage||``,T.value=e.safetyAllowance||``,E.value=e.longevityAllowance||``,D.value=e.otherAllowance||``}function De(){try{let e=[t,n];for(let n of e){let e=localStorage.getItem(n);if(!e)continue;let r=JSON.parse(e);if(r&&typeof r==`object`&&!Array.isArray(r))return n!==t&&localStorage.setItem(t,JSON.stringify(r)),r}let a=localStorage.getItem(r);if(!a)return{};let s={...i,...JSON.parse(a)},c={[Q(o)]:s};return localStorage.setItem(t,JSON.stringify(c)),c}catch(e){return console.error(`월별 급여 설정을 불러오지 못했습니다.`,e),{}}}function Oe(){localStorage.setItem(t,JSON.stringify(p))}`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/cat-attendance/sw.js`).then(()=>{console.log(`CAT 근태관리 서비스 워커 등록 완료`)}).catch(e=>{console.error(`서비스 워커 등록 실패:`,e)})}),z(),we();