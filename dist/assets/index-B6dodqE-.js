(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`cat-attendance-records-v1`,t=`cat-attendance-settings-by-month-v2`,n=`cat-attendance-settings-v1`,r={baseHourlyWage:0,safetyAllowance:0,longevityAllowance:0},i=[{id:`day`,label:`주간`,totals:{regularDays:1}},{id:`night`,label:`야간`,totals:{regularDays:1,nightHours:6}},{id:`dayOvertime`,label:`주간잔업`,totals:{regularDays:1,overtimeHours:2.5}},{id:`nightOvertime`,label:`야간잔업`,totals:{regularDays:1,overtimeHours:2,nightHours:7,overnightHours:1}},{id:`dayHoliday`,label:`주간특근`,totals:{holidayHours:8}},{id:`nightHoliday`,label:`야간특근`,totals:{holidayHours:8,nightHours:6}},{id:`dayHolidayOvertime`,label:`주간특근잔업`,totals:{holidayHours:8,holidayOvertimeHours:2.5}},{id:`nightHolidayOvertime`,label:`야간특근잔업`,totals:{holidayHours:8,holidayOvertimeHours:2,nightHours:6,overnightHours:1}},{id:`annualLeave`,label:`연차`,totals:{regularDays:1}}],a=new Date;a=new Date(a.getFullYear(),a.getMonth(),1);var o=null,s=B(),c=G(),l=document.querySelector(`#app`);l.innerHTML=`
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
`;var u=document.querySelector(`#monthTitle`),d=document.querySelector(`#calendarGrid`),f=document.querySelector(`#summaryGrid`),p=document.querySelector(`#recordedDays`),m=document.querySelector(`#salaryMonthTitle`),h=document.querySelector(`#workTotalsGrid`),g=document.querySelector(`#payBreakdown`),_=document.querySelector(`#ordinaryHourlyWageOutput`),v=document.querySelector(`#totalPayOutput`),y=document.querySelector(`#baseHourlyWage`),b=document.querySelector(`#safetyAllowance`),x=document.querySelector(`#longevityAllowance`),S=document.querySelector(`#workModal`),C=document.querySelector(`#modalTitle`),w=document.querySelector(`#workTypeList`),T=document.querySelector(`#deleteRecordButton`);document.querySelector(`#previousMonth`).addEventListener(`click`,()=>{a=new Date(a.getFullYear(),a.getMonth()-1,1),E()}),document.querySelector(`#nextMonth`).addEventListener(`click`,()=>{a=new Date(a.getFullYear(),a.getMonth()+1,1),E()}),document.querySelector(`#todayButton`).addEventListener(`click`,()=>{let e=new Date;a=new Date(e.getFullYear(),e.getMonth(),1),E()}),document.querySelector(`#resetMonthButton`).addEventListener(`click`,()=>{let e=a.getFullYear(),t=a.getMonth(),n=`${e}-${String(t+1).padStart(2,`0`)}-`;if(!Object.keys(s).some(e=>e.startsWith(n))){window.alert(`이 달에는 초기화할 근무기록이 없습니다.`);return}window.confirm(`${e}년 ${t+1}월 근무기록을 모두 삭제할까요?\n\n기본시급과 수당 설정은 유지됩니다.`)&&(Object.keys(s).forEach(e=>{e.startsWith(n)&&delete s[e]}),V(),E())}),document.querySelector(`#closeModalButton`).addEventListener(`click`,N),document.querySelector(`[data-close-modal]`).addEventListener(`click`,N),T.addEventListener(`click`,()=>{o&&(delete s[o],V(),N(),E())}),[y,b,x].forEach(e=>{e.addEventListener(`input`,()=>{let e=H(a);c[e]={baseHourlyWage:L(y),safetyAllowance:L(b),longevityAllowance:L(x)},K(),k()})}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&N()});function E(){D(),O(),W(),k()}function D(){let e=a.getFullYear(),t=a.getMonth();u.textContent=`${e}년 ${t+1}월`,d.innerHTML=``;let n=new Date(e,t,1),r=new Date(e,t+1,0).getDate(),i=(n.getDay()+6)%7,o=new Date;for(let n=0;n<42;n+=1){let a=n-i+1;if(a<1||a>r){let e=document.createElement(`div`);e.className=`day-cell empty`,d.appendChild(e);continue}let c=new Date(e,t,a),l=P(e,t,a),u=s[l],f=I(u),p=document.createElement(`button`);p.type=`button`,p.className=`day-cell`,o.getFullYear()===e&&o.getMonth()===t&&o.getDate()===a&&p.classList.add(`today`),c.getDay()===0&&p.classList.add(`sunday-cell`),c.getDay()===6&&p.classList.add(`saturday-cell`),f&&p.classList.add(`type-${f.id}`),p.innerHTML=`
      <span class="day-number">${a}</span>

      ${f?`<span class="work-badge">${f.label}</span>`:`<span class="empty-record">근무 선택</span>`}
    `,p.addEventListener(`click`,()=>{M(l,e,t,a)}),d.appendChild(p)}}function O(){let e=A();p.textContent=`${e.recordedDays}일`,f.innerHTML=i.map(t=>`
      <div class="summary-item">
        <span class="summary-dot type-${t.id}"></span>

        <span class="summary-label">
          ${t.label}
        </span>

        <strong>${e.counts[t.id]}일</strong>
      </div>
    `).join(``)}function k(){let e=a.getFullYear(),t=a.getMonth(),n=A(),r=U(),i=Number(r.baseHourlyWage)||0,o=Number(r.safetyAllowance)||0,s=Number(r.longevityAllowance)||0,c=i+(o+s)/243,l=new Date(e,t+1,0).getDate(),u=j(e,t),d=l-u,f=d*8,p={basePay:f*i,weeklyAllowance:u*8*i,overtimePay:c*n.overtimeHours*1.5,nightPay:c*n.nightHours*.5,overnightPay:c*n.overnightHours*2,holidayPay:c*n.holidayHours*1.5,holidayOvertimePay:c*n.holidayOvertimeHours*2},y=p.basePay+p.weeklyAllowance+p.overtimePay+p.nightPay+p.overnightPay+p.holidayPay+p.holidayOvertimePay+o+s;m.textContent=`${e}년 ${t+1}월 예상 급여`,_.textContent=R(c),v.textContent=R(y),h.innerHTML=[[`근무기록 일수`,`${z(n.regularDays)}일`],[`기본급 적용일수`,`${d}일`],[`일요일 수`,`${u}일`],[`기본급 시간`,`${f}시간`],[`연장시간`,`${z(n.overtimeHours)}시간`],[`심야시간`,`${z(n.nightHours)}시간`],[`철야시간`,`${z(n.overnightHours)}시간`],[`휴일시간`,`${z(n.holidayHours)}시간`],[`휴연시간`,`${z(n.holidayOvertimeHours)}시간`]].map(([e,t])=>`
        <div class="work-total-row">
          <span>${e}</span>
          <strong>${t}</strong>
        </div>
      `).join(``),g.innerHTML=[[`기본급`,p.basePay],[`주차수당`,p.weeklyAllowance],[`연장수당`,p.overtimePay],[`심야수당`,p.nightPay],[`철야수당`,p.overnightPay],[`휴일수당`,p.holidayPay],[`휴연수당`,p.holidayOvertimePay],[`안전수당`,o],[`근속수당`,s]].map(([e,t])=>`
        <div class="payment-row">
          <span>${e}</span>
          <strong>${R(t)}</strong>
        </div>
      `).join(``)}function A(){let e=a.getFullYear(),t=a.getMonth(),n={recordedDays:0,regularDays:0,overtimeHours:0,nightHours:0,overnightHours:0,holidayHours:0,holidayOvertimeHours:0,counts:{}};i.forEach(e=>{n.counts[e.id]=0});for(let[r,i]of Object.entries(s)){let a=F(r);if(a.year!==e||a.month!==t)continue;let o=I(i);o&&(n.recordedDays+=1,n.counts[o.id]+=1,Object.entries(o.totals).forEach(([e,t])=>{n[e]+=t}))}return n}function j(e,t){let n=new Date(e,t+1,0).getDate(),r=0;for(let i=1;i<=n;i+=1)new Date(e,t,i).getDay()===0&&(r+=1);return r}function M(e,t,n,r){o=e,C.textContent=`${t}년 ${n+1}월 ${r}일`;let a=s[e];w.innerHTML=i.map(e=>`
      <button
        type="button"
        class="work-type-button type-${e.id}
          ${a===e.id?`selected`:``}"
        data-work-type="${e.id}"
      >
        <span class="work-type-color"></span>
        <span>${e.label}</span>
      </button>
    `).join(``),w.querySelectorAll(`[data-work-type]`).forEach(e=>{e.addEventListener(`click`,()=>{s[o]=e.dataset.workType,V(),N(),E()})}),T.hidden=!a,S.classList.add(`open`),S.setAttribute(`aria-hidden`,`false`)}function N(){S.classList.remove(`open`),S.setAttribute(`aria-hidden`,`true`),o=null}function P(e,t,n){return`${e}-${String(t+1).padStart(2,`0`)}-${String(n).padStart(2,`0`)}`}function F(e){let[t,n,r]=e.split(`-`).map(Number);return{year:t,month:n-1,day:r}}function I(e){return i.find(t=>t.id===e)}function L(e){let t=Number(e.value);return!Number.isFinite(t)||t<0?0:t}function R(e){let t=Number.isFinite(e)?e:0;return`${new Intl.NumberFormat(`ko-KR`,{maximumFractionDigits:0}).format(Math.round(t))}원`}function z(e){return Number.isInteger(e)?String(e):e.toFixed(1).replace(/\.0$/,``)}function B(){try{let t=localStorage.getItem(e);return t?JSON.parse(t):{}}catch(e){return console.error(`저장된 근무기록을 불러오지 못했습니다.`,e),{}}}function V(){localStorage.setItem(e,JSON.stringify(s))}function H(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}`}function U(){let e=H(a);return{...r,...c[e]||{}}}function W(){let e=U();y.value=e.baseHourlyWage||``,b.value=e.safetyAllowance||``,x.value=e.longevityAllowance||``}function G(){try{let e=localStorage.getItem(t);if(e){let t=JSON.parse(e);if(t&&typeof t==`object`&&!Array.isArray(t))return t}let i=localStorage.getItem(n);if(!i)return{};let o={...r,...JSON.parse(i)},s={[H(a)]:o};return localStorage.setItem(t,JSON.stringify(s)),s}catch(e){return console.error(`월별 급여 설정을 불러오지 못했습니다.`,e),{}}}function K(){localStorage.setItem(t,JSON.stringify(c))}`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/cat-attendance/sw.js`).then(()=>{console.log(`CAT 근태관리 서비스 워커 등록 완료`)}).catch(e=>{console.error(`서비스 워커 등록 실패:`,e)})}),E();