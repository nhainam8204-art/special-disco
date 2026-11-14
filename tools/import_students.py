"""Doc danh sach hoc sinh tu file Excel (.xlsx) va tao students.js
Cach dung: python import_students.py duong_dan_file.xlsx
Ten dang nhap = Ma hoc sinh, mat khau mac dinh = 123.
"""
import sys, re, json, zipfile, os
import xml.etree.ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
M = '{%s}' % NS['m']


def read_xlsx(path):
    z = zipfile.ZipFile(path)
    sst = [''.join(t.text or '' for t in si.iter(M + 't'))
           for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    sheets = []
    for s in wb.find('m:sheets', NS):
        rid = s.get('{%s}id' % NS['r'])
        target = rels[rid].replace('../', '')
        if not target.startswith('xl/'):
            target = 'xl/' + target
        rows = []
        for r in ET.fromstring(z.read(target)).iter(M + 'row'):
            row = {}
            for c in r.findall('m:c', NS):
                v = c.find('m:v', NS)
                if v is None:
                    continue
                val = sst[int(v.text)] if c.get('t') == 's' else v.text
                row[re.match('[A-Z]+', c.get('r')).group()] = (val or '').strip()
            rows.append(row)
        sheets.append((s.get('name'), rows))
    return sheets


def main(path, out):
    users, seen, report = [], set(), []
    for name, rows in read_xlsx(path):
        cls = name.strip().upper()
        grade = re.match(r'\d+', cls).group()
        gvcn = ''
        count = 0
        for row in rows:
            a = row.get('A', '')
            if a.startswith('Lớp') and 'GVCN' in a:
                gvcn = a.split('GVCN', 1)[1].strip()
            code = row.get('C', '')
            if not (a.isdigit() and re.match(r'^[0-9][0-9\-]{5,}$', code)):
                continue
            if code in seen:
                print('Trung ma hoc sinh, bo qua:', code, row.get('B'))
                continue
            seen.add(code)
            count += 1
            users.append({
                'id': code, 'username': code, 'password': '123',
                'fullName': row.get('B', ''), 'role': 'student',
                'className': cls, 'grade': grade,
                'dob': row.get('D', ''), 'gender': row.get('E', ''),
                'ethnicity': row.get('F', ''), 'active': True,
            })
        report.append((cls, count, gvcn))
    with open(out, 'w', encoding='utf-8') as f:
        f.write('// Tu dong tao boi tools/import_students.py - Danh sach hoc sinh toan truong\n')
        f.write('window.SCHOOL_STUDENTS = ' + json.dumps(users, ensure_ascii=False, indent=1) + ';\n')
    for r in report:
        print('Lop %-5s %3d hoc sinh  (GVCN: %s)' % r)
    print('TONG:', len(users), 'hoc sinh ->', out)


if __name__ == '__main__':
    main(sys.argv[1], os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'students.js'))
