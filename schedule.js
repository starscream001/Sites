export function classify(mark) {
  if (mark === '') return 'off';
  if (mark.toLowerCase() === 'о') return 'vacation';
  if (mark.toLowerCase() === 'б') return 'sick';
  if (/^\d+([.,]\d+)?$/.test(mark)) return 'work';
  return 'unknown';
}

export function summarize(marks, shiftHours = 12) {
  if (!marks) return null;
  return marks.reduce((total, mark) => {
    const kind = classify(mark);
    total[kind] += 1;
    if (kind === 'work') total.hours += shiftHours;
    return total;
  }, { work: 0, off: 0, vacation: 0, sick: 0, unknown: 0, hours: 0 });
}

export function vacationRanges(marks) {
  const ranges = [];
  marks?.forEach((mark, index) => {
    if (classify(mark) !== 'vacation') return;
    const previous = ranges.at(-1);
    if (previous?.end === index) previous.end = index + 1;
    else ranges.push({ start: index + 1, end: index + 1 });
  });
  return ranges;
}
