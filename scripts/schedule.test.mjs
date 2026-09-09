import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../schedule-data.js';
import { summarize, vacationRanges } from '../schedule.js';

test('September excludes vacation from days off and counts 12-hour shifts', () => {
  const marks = data.months[0].rows['Ишуков Д.'].marks;
  assert.deepEqual(summarize(marks), { work: 9, off: 9, vacation: 12, sick: 0, unknown: 0, hours: 108 });
  assert.deepEqual(vacationRanges(marks), [{ start: 14, end: 25 }]);
});
test('missing employee schedule is distinct from a month off', () => {
  assert.equal(summarize(undefined), null);
  assert.equal(summarize(['', '', '']).off, 3);
});
test('all imported calendars cover the real month, including trailing blanks', () => {
  assert.deepEqual(data.months.map(m => [m.year,m.month]), [[2026,9],[2026,10],[2026,11],[2026,12]]);
  for (const m of data.months) for (const {marks} of Object.values(m.rows)) {
    assert.equal(marks.length, new Date(m.year,m.month,0).getDate());
    const s = summarize(marks);
    assert.equal(s.work + s.off + s.vacation, marks.length);
    assert.equal(s.hours, s.work * 12);
  }
  assert.equal(data.months[3].rows['Михайлов А.'].marks[30], '');
});
test('vacation import preserves color-only and numeric weekly marks separately', () => {
  const p = data.employees.find(e => e.shortName === 'Михайлов А.');
  assert.deepEqual(p.vacationWeeks.map(w=>[w.month,w.week,w.kind]), [[7,1,'color'],[7,2,'color'],[8,1,'value'],[8,2,'value']]);
  assert.equal(data.employees.filter(e => e.hasSchedule).length,4);
});
