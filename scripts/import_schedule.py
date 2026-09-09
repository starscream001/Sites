"""Read values and vacation formatting from the supplied ODS without changing it."""
import calendar
import hashlib
import json
import sys
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

NS = {k: f'urn:oasis:names:tc:opendocument:xmlns:{v}:1.0' for k, v in
      [('table', 'table'), ('text', 'text'), ('style', 'style'), ('fo', 'xsl-fo-compatible')]}
MONTHS = 'январь февраль март апрель май июнь июль август сентябрь октябрь ноябрь декабрь'.split()

def attr(node, namespace, name, default=None):
    return node.get(f'{{{NS[namespace]}}}{name}', default)

def read_rows(table):
    rows = []
    for row in table.findall('table:table-row', NS):
        cells = []
        for cell in row:
            if cell.tag.split('}')[-1] not in ('table-cell', 'covered-table-cell'):
                continue
            value = ' '.join(''.join(p.itertext()) for p in cell.findall('text:p', NS)).strip()
            cells.extend([{'value': value, 'style': attr(cell, 'table', 'style-name')}]
                         * min(200, int(attr(cell, 'table', 'number-columns-repeated', '1'))))
        rows.extend([cells] * min(1000, int(attr(row, 'table', 'number-rows-repeated', '1'))))
    return rows

def main(source):
    raw = Path(source).read_bytes()
    with zipfile.ZipFile(source) as archive:
        root = ET.fromstring(archive.read('content.xml'))
    tables = {attr(t, 'table', 'name').lower(): read_rows(t) for t in root.findall('.//table:table', NS)}
    styles = {}
    for style in root.findall('.//style:style', NS):
        props = style.find('style:table-cell-properties', NS)
        if props is not None:
            styles[attr(style, 'style', 'name')] = attr(props, 'fo', 'background-color')
    schedule = tables['график']
    blocks = []
    year = 2019
    for i, row in enumerate(schedule):
        values = [c['value'].lower() for c in row]
        # Month names live inside the table, not in notes to its right.
        found = next((v for v in values[:32] if v in MONTHS), None)
        if not found:
            continue
        years = [v.strip('г. ') for v in values[:32] if v.strip('г. ').isdigit()]
        explicit = next((int(v) for v in years if 2018 <= int(v) <= 2100), None)
        short = next((int(v) for v in years if 19 <= int(v) <= 30), None)
        if explicit:
            year = explicit
        elif found == 'январь' and short:
            year = 2000 + short
        elif found == 'январь' and blocks and blocks[-1]['month'] == 12:
            year += 1
        month = MONTHS.index(found) + 1
        block = {'year': year, 'month': month, 'label': found.capitalize(), 'rows': {}}
        for j in range(i + 2, min(i + 16, len(schedule))):
            line = schedule[j]
            name = line[0]['value'] if line else ''
            if not name:
                break
            if not any(ch.isalpha() for ch in name):
                break
            days = calendar.monthrange(year, month)[1]
            marks = [(line[d]['value'] if d < len(line) else '') for d in range(1, days + 1)]
            block['rows'][name] = {'marks': marks, 'sourceRow': j + 1}
        if block['rows']:
            blocks.append(block)
    latest = sorted(blocks, key=lambda b: (b['year'], b['month']))[-4:]
    vacation_rows = tables['отпуска']
    start = max(i for i, row in enumerate(vacation_rows)
                if row and row[0]['value'] == 'Год' and row[1]['value'] == '2026')
    employees = []
    for i in range(start + 3, len(vacation_rows)):
        row = vacation_rows[i]
        if not row or not row[0]['value']:
            break
        name = row[0]['value'].strip().title()
        surname, first = name.split()[:2]
        short_name = f'{surname} {first[0]}.'
        marks = []
        for col, cell in enumerate(row[1:49], 1):
            color = styles.get(cell['style'])
            if color == '#ff0000' or cell['value']:
                marks.append({'month': (col - 1) // 4 + 1, 'week': (col - 1) % 4 + 1,
                              'kind': 'color' if color == '#ff0000' else 'value', 'value': cell['value']})
        employees.append({'id': str(i + 1), 'name': name, 'shortName': short_name,
                          'vacationWeeks': marks, 'vacationRow': i + 1,
                          'hasSchedule': any(short_name in b['rows'] for b in latest)})
    employees.sort(key=lambda p: (not p['hasSchedule'], p['name']))
    result = {'source': Path(source).name, 'sha256': hashlib.sha256(raw).hexdigest(),
              'months': latest, 'employees': employees, 'vacationYear': 2026}
    Path('schedule-data.js').write_text('export default ' + json.dumps(result, ensure_ascii=False, indent=2) + ';\n')
    print(json.dumps({'months': [(b['year'], b['month']) for b in latest],
                      'employees': len(employees), 'active': sum(p['hasSchedule'] for p in employees)}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1])
