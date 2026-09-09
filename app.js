import data from './schedule-data.js';
import { classify, summarize, vacationRanges } from './schedule.js';

const $ = (id) => document.getElementById(id);
const shiftHours = 12;
const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const shortWeekdays = ['вс','пн','вт','ср','чт','пт','сб'];
const today = new Date();
const state = { person: data.employees[0].id, month: Math.max(0, data.months.findIndex(m => m.year === today.getFullYear() && m.month === today.getMonth() + 1)), view: 'grid', day: 1 };
const number = (value) => new Intl.NumberFormat('ru-RU').format(value);
const person = () => data.employees.find(p => p.id === state.person);
const month = () => data.months[state.month];
const marks = () => month().rows[person().shortName]?.marks;
const labels = { work: 'Рабочая смена', off: 'Выходной', vacation: 'Отпуск', sick: 'Больничный', unknown: 'Другая отметка' };

$('person').innerHTML = `<optgroup label="Есть график">${data.employees.filter(p => p.hasSchedule).map(option).join('')}</optgroup><optgroup label="Только лист отпусков">${data.employees.filter(p => !p.hasSchedule).map(option).join('')}</optgroup>`;
function option(p) { return `<option value="${p.id}">${p.name}</option>`; }
$('person').value = state.person;
$('person').addEventListener('change', e => { state.person = e.target.value; state.day = 1; render(); });
$('today').addEventListener('click', () => {
  const index = data.months.findIndex(m => m.year === today.getFullYear() && m.month === today.getMonth() + 1);
  if (index >= 0) { state.month = index; state.day = today.getDate(); render(); }
});
$('today').disabled = !data.months.some(m => m.year === today.getFullYear() && m.month === today.getMonth() + 1);
$('today').title = $('today').disabled ? 'Сегодня за пределами доступного периода' : 'Перейти к текущему дню';
for (const view of ['grid','list']) $(''+view+'-view').addEventListener('click', () => { state.view = view; renderCalendar(); });
$('months').addEventListener('click', e => { const button = e.target.closest('[data-month]'); if (button) selectMonth(Number(button.dataset.month)); });
$('overview').addEventListener('click', e => { const button = e.target.closest('[data-month]'); if (button) selectMonth(Number(button.dataset.month)); });
$('calendar-content').addEventListener('click', e => { const day = e.target.closest('[data-day]'); if (day) { state.day = Number(day.dataset.day); updateDaySelection(); } });
function selectMonth(index) { state.month = index; state.day = 1; render(); }
function render() {
  const employee = person();
  $('initials').textContent = employee.name.split(' ').map(x => x[0]).join('');
  $('person-name').textContent = employee.name;
  $('person-subtitle').textContent = employee.hasSchedule ? 'Начало в 09:00 · смена 12 ч' : 'График не указан';
  $('month-title').innerHTML = `${month().label} <span>${month().year}</span>`;
  $('months').innerHTML = data.months.map((m,i) => `<button data-month="${i}" aria-pressed="${i === state.month}">${m.label}</button>`).join('');
  const total = summarize(marks(), shiftHours);
  $('stats').innerHTML = [['Рабочие часы','hours','ч'],['Рабочие дни','work',''],['Выходные','off',''],['Отпуск','vacation','дн']].map(([label,key,unit]) => `<div class="stat"><div class="stat-label">${label}</div><div class="stat-number">${total ? number(total[key]) : '—'}<small>${total ? unit : ''}</small></div></div>`).join('');
  const all = data.months.map(m => summarize(m.rows[employee.shortName]?.marks, shiftHours)).filter(Boolean);
  $('period-total').innerHTML = all.length ? `<div class="period-hours">${number(all.reduce((a,s) => a + s.hours,0))} <small>часов</small></div><div class="period-days">${all.reduce((a,s) => a + s.work,0)} рабочих дней · ${all.reduce((a,s) => a + s.off,0)} выходных</div>` : '<div class="period-days">Нет данных о сменах</div>';
  $('overview').innerHTML = data.months.map((m,i) => { const s = summarize(m.rows[employee.shortName]?.marks, shiftHours); return `<button class="overview-row" data-month="${i}" aria-pressed="${state.month === i}"><span>${m.label}</span><span>${s ? s.work + ' <small>смен</small>' : '—'}</span><span>${s ? s.hours + ' <small>ч</small>' : '—'}</span></button>`; }).join('');
  renderCalendar(); renderVacations();
}
function renderCalendar() {
  $('grid-view').setAttribute('aria-pressed', state.view === 'grid');
  $('list-view').setAttribute('aria-pressed', state.view === 'list');
  const days = marks();
  if (!days) { $('calendar-content').innerHTML = '<div class="empty-state">Для этого сотрудника нет графика<br>на выбранный месяц.</div>'; $('day-detail').textContent = 'Доступная информация об отпусках — ниже.'; return; }
  if (state.view === 'list') {
    $('calendar-content').innerHTML = `<div class="day-list">${days.map((mark,i) => { const kind = classify(mark); return `<button class="list-day ${kind}" data-day="${i+1}" aria-label="${dayLabel(i+1,kind)}"><span>${i+1} ${month().label.toLowerCase().slice(0,3)} · ${shortWeekdays[new Date(month().year,month().month-1,i+1).getDay()]}</span><span class="status">${labels[kind]}${kind === 'work' ? ' · 09:00' : ''}</span><span class="duration">${kind === 'work' ? '12 ч' : '—'}</span></button>`; }).join('')}</div>`;
  } else {
    const offset = (new Date(month().year,month().month-1,1).getDay() + 6) % 7;
    const cells = Array.from({length:offset}, () => '<div class="day empty" aria-hidden="true"></div>');
    days.forEach((mark,i) => { const kind = classify(mark); const isToday = month().year === today.getFullYear() && month().month === today.getMonth()+1 && i+1 === today.getDate(); cells.push(`<button class="day ${kind} ${isToday ? 'is-today' : ''}" data-day="${i+1}" ${isToday ? 'aria-current="date"' : ''} aria-label="${dayLabel(i+1,kind)}"><span class="day-num">${i+1}</span><span class="day-label">${kind === 'work' ? '09:00' : kind === 'off' ? '—' : kind === 'vacation' ? 'Отпуск' : labels[kind]}</span></button>`); });
    $('calendar-content').innerHTML = '<div class="week-header" aria-hidden="true">'+['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(d=>`<span>${d}</span>`).join('')+'</div><div class="days">'+cells.join('')+'</div>';
  }
  updateDaySelection();
}
function dayLabel(day, kind) { return `${day} ${month().label}, ${labels[kind]}${kind === 'work' ? ', начало в 09:00, 12 часов' : ''}`; }
function updateDaySelection() {
  const kind = classify(marks()[state.day - 1]);
  document.querySelectorAll('[data-day]').forEach(el => { const active = Number(el.dataset.day) === state.day; el.classList.toggle('selected',active); el.setAttribute('aria-pressed',active); });
  const date = new Date(month().year,month().month-1,state.day).toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'});
  $('day-detail').innerHTML = `<strong>${date}</strong><span>${labels[kind]}${kind === 'work' ? ' · с 09:00 · 12 часов' : ''}</span>`;
}
function renderVacations() {
  const employee = person();
  const ranges = data.months.flatMap(m => vacationRanges(m.rows[employee.shortName]?.marks).map(r => ({...r,month:m.month})));
  let html = '<div class="vacation-subtitle">По ежедневному графику</div>';
  html += ranges.length ? ranges.map(r => `<div class="vacation-entry"><div><strong>${r.start}–${new Date(2026,r.month-1,r.end).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</strong><small>Лист «ГРАФИК» · отметка «о»</small></div><span class="count">${r.end-r.start+1} дн.</span></div>`).join('') : `<p class="vacation-note">${employee.hasSchedule ? 'В сентябре–декабре отпуск не отмечен.' : 'Нет ежедневного графика за сентябрь–декабрь.'}</p>`;
  html += '<div class="vacation-subtitle">Недельный план на 2026 год</div>';
  if (!employee.vacationWeeks.length) html += '<p class="vacation-note">В листе «отпуска» на 2026 год отметок нет.</p>';
  else {
    const groups = Map.groupBy ? Map.groupBy(employee.vacationWeeks, w=>`${w.month}-${w.kind}`) : employee.vacationWeeks.reduce((map,w)=>{const key=`${w.month}-${w.kind}`;map.set(key,[...(map.get(key)||[]),w]);return map;},new Map());
    for (const group of groups.values()) html += `<div class="weeks"><span class="week-tag ${group[0].kind}">${monthNames[group[0].month-1]} · недели ${group.map(w=>w.week).join(', ')} · ${group[0].kind === 'color' ? 'красная заливка' : 'отметка «1»'}</span></div>`;
    html += '<p class="vacation-note">В источнике указаны недели месяца, без точных дат. Эти отметки не меняют часы и выходные в календаре.</p>';
  }
  $('vacations').innerHTML = html;
}
render();
