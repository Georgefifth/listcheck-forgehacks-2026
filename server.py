"""Loopback-only ListCheck server. No third-party dependencies."""
import argparse
import csv
import io
import json
import re
import zipfile
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).parent / 'web'
MAX_FILE = 10 * 1024 * 1024
MAX_EXPANDED = 100 * 1024 * 1024
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def xml(data):
    if b'<!DOCTYPE' in data.upper() or b'<!ENTITY' in data.upper():
        raise ValueError('The workbook contains an unsupported XML declaration.')
    return ET.fromstring(data)


def tabular(rows, header_row=1):
    if not 1 <= header_row <= 100:
        raise ValueError('The header row must be between 1 and 100.')
    if len(rows) < header_row:
        raise ValueError('This header row does not exist in the file.')
    width = max((len(r) for r in rows), default=0)
    if width > 100:
        raise ValueError('Up to 100 columns are supported.')
    header = [str(v).strip() for v in rows[header_row - 1]]
    while header and not header[-1]:
        header.pop()
    if not header or any(not h for h in header):
        raise ValueError('The header contains blank column names. Select the correct header row or fill in the missing names.')
    if len(set(header)) != len(header):
        raise ValueError('Duplicate column names. Give each column a distinct name.')
    data = []
    for number, row in enumerate(rows[header_row:], header_row + 1):
        if not any(str(v).strip() for v in row):
            continue
        if any(str(v).strip() for v in row[len(header):]):
            raise ValueError(f'Row {number} contains data without a column header.')
        data.append({'line': number, 'values': [str(row[i]) if i < len(row) else '' for i in range(len(header))]})
    if not data:
        raise ValueError('The file has headers but no records to compare.')
    if len(data) > 20000:
        raise ValueError('Up to 20,000 records are supported.')
    return {'headers': header, 'rows': data}


def parse_csv(data, header_row=1):
    encoding = 'utf-16' if data[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig'
    try:
        text = data.decode(encoding)
    except UnicodeDecodeError:
        try:
            text = data.decode('gb18030')
        except UnicodeDecodeError:
            raise ValueError('Unsupported text encoding. Save the file as UTF-8 CSV.')
    if '\x00' in text:
        raise ValueError('The CSV contains invalid null characters.')
    try:
        dialect = csv.Sniffer().sniff(text[:8192], delimiters=',;\t')
    except csv.Error:
        dialect = csv.excel
    rows = []
    for row in csv.reader(io.StringIO(text, newline=''), dialect=dialect, strict=True):
        rows.append(row)
        if len(rows) > 20100:
            raise ValueError('The file exceeds the row limit.')
    result = tabular(rows, header_row)
    result.update(sheets=[], sheet='', warnings=[])
    return result


def column_index(address):
    match = re.fullmatch(r'([A-Z]+)[1-9][0-9]*', address)
    if not match:
        raise ValueError('The workbook contains an invalid cell reference.')
    result = 0
    for c in match[1]:
        result = result * 26 + ord(c) - 64
    if result > 100:
        raise ValueError('Up to 100 columns are supported.')
    return result - 1


def parse_xlsx(data, sheet_name='', header_row=1):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        infos = archive.infolist()
        if len(infos) > 2000 or len({i.filename for i in infos}) != len(infos):
            raise ValueError('Invalid workbook archive.')
        if sum(i.file_size for i in infos) > MAX_EXPANDED:
            raise ValueError('The expanded workbook is too large.')
        if any(i.flag_bits & 1 for i in infos):
            raise ValueError('Encrypted workbooks are not supported.')
        workbook = xml(archive.read('xl/workbook.xml'))
        rels = xml(archive.read('xl/_rels/workbook.xml.rels'))
        relationships = {}
        for relation in rels:
            if relation.get('TargetMode') == 'External':
                continue
            target = relation.get('Target', '')
            path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            if '..' in path.split('/'):
                raise ValueError('The workbook contains an invalid path.')
            relationships[relation.get('Id')] = path
        sheets = [(s.get('name'), relationships.get(s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'))) for s in workbook.findall('m:sheets/m:sheet', NS)]
        if not sheets:
            raise ValueError('The workbook has no worksheets.')
        chosen = next((s for s in sheets if s[0] == sheet_name), None) if sheet_name else sheets[0]
        if not chosen or not chosen[1]:
            raise ValueError('The selected worksheet was not found.')
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(s.itertext()) if not s.findall('.//m:t', NS) else ''.join(t.text or '' for t in s.findall('.//m:t', NS)) for s in xml(archive.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        formats = {}
        style_formats = []
        if 'xl/styles.xml' in archive.namelist():
            styles = xml(archive.read('xl/styles.xml'))
            formats = {int(f.get('numFmtId')): f.get('formatCode', '') for f in styles.findall('m:numFmts/m:numFmt', NS)}
            style_formats = [int(f.get('numFmtId', '0')) for f in styles.findall('m:cellXfs/m:xf', NS)]
        props = workbook.find('m:workbookPr', NS)
        date1904 = props is not None and props.get('date1904') in ('1', 'true')
        rows = []
        cells = 0
        formulas = 0
        unsupported = set()
        root = xml(archive.read(chosen[1]))
        for row in root.findall('m:sheetData/m:row', NS):
            number = int(row.get('r', len(rows) + 1))
            if number < 1 or number > 20100:
                raise ValueError('The worksheet exceeds the row limit.')
            while len(rows) < number:
                rows.append([])
            values = rows[number - 1]
            for cell in row.findall('m:c', NS):
                cells += 1
                if cells > 500000:
                    raise ValueError('The worksheet exceeds the cell limit.')
                index = column_index(cell.get('r', ''))
                while len(values) <= index:
                    values.append('')
                kind = cell.get('t', 'n')
                cached = cell.find('m:v', NS)
                value = cached.text or '' if cached is not None else ''
                if cell.find('m:f', NS) is not None:
                    formulas += 1
                    if cached is None or (cached.text is None and kind != 'str'):
                        raise ValueError(f'A formula in row {number} has no cached result. Recalculate and save in Excel, or export CSV.')
                if kind == 's':
                    value = shared[int(value)]
                elif kind == 'inlineStr':
                    value = ''.join(t.text or '' for t in cell.findall('.//m:t', NS))
                elif kind == 'b':
                    value = 'TRUE' if value == '1' else 'FALSE'
                elif kind == 'e':
                    raise ValueError(f'Row {number} contains the Excel error {value}.')
                elif kind == 'n' and value:
                    if len(value) > 1000:
                        raise ValueError('The workbook contains an excessively long number.')
                    numeric = Decimal(value)
                    if not numeric.is_finite() or abs(numeric.adjusted()) > 1000:
                        raise ValueError('The workbook contains an invalid number.')
                    style_index = int(cell.get('s', '0'))
                    fmt_id = style_formats[style_index] if style_index < len(style_formats) else 0
                    fmt = formats.get(fmt_id, '')
                    stripped = re.sub(r'"[^"]*"|\[[^\]]*\]|\\.', '', fmt).lower()
                    if fmt_id in range(14, 23) or (fmt and re.search(r'[ydh]', stripped)):
                        serial = float(value)
                        # Excel serial 60 is the fictitious 1900-02-29.
                        if not date1904 and int(serial) == 60:
                            raise ValueError('The workbook uses the invalid Excel date 1900-02-29. Correct it before importing.')
                        origin = datetime(1904, 1, 1) if date1904 else datetime(1899, 12, 31)
                        adjusted = serial if date1904 or serial < 60 else serial - 1
                        date = origin + timedelta(days=adjusted)
                        value = date.isoformat(sep=' ', timespec='seconds') if serial % 1 else date.date().isoformat()
                    elif re.fullmatch(r'0+', fmt) and numeric == numeric.to_integral_value():
                        value = str(int(numeric)).zfill(len(fmt))
                    else:
                        if numeric == numeric.to_integral_value():
                            value = str(int(numeric))
                        if fmt_id not in (0, 1, 2, 3, 4, 9, 10, 11, 12, 13, 37, 38, 39, 40, 48, 49) or (fmt and not re.fullmatch(r'0+(\.0+)?', fmt)):
                            unsupported.add(fmt or str(fmt_id))
                values[index] = value
        result = tabular(rows, header_row)
        warnings = []
        if formulas:
            warnings.append(f'{formulas} formulas use cached results saved in the file. This tool does not recalculate them. Check that the source file is up to date.')
        if unsupported:
            warnings.append('Some number display formats are unsupported. Underlying values were read instead. Check the preview before comparing.')
        result.update(sheets=[s[0] for s in sheets], sheet=chosen[0], warnings=warnings)
        return result


def parse_file(data, filename, sheet='', header=1):
    if len(data) > MAX_FILE:
        raise ValueError('Each file must be 10 MiB or smaller.')
    if filename.lower().endswith('.csv'):
        return parse_csv(data, header)
    if filename.lower().endswith('.xlsx'):
        return parse_xlsx(data, sheet, header)
    raise ValueError('Choose CSV or XLSX. XLS, XLSM, and encrypted workbooks are not supported.')


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, content_type):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        pathname = urlparse(self.path).path
        files = {'/': ('index.html', 'text/html; charset=utf-8'), '/app.mjs': ('app.mjs', 'text/javascript; charset=utf-8'), '/core.mjs': ('core.mjs', 'text/javascript; charset=utf-8'), '/worker.mjs': ('worker.mjs', 'text/javascript; charset=utf-8'), '/style.css': ('style.css', 'text/css; charset=utf-8')}
        if pathname not in files:
            self.send(404, b'Not found', 'text/plain')
            return
        name, kind = files[pathname]
        self.send(200, (ROOT / name).read_bytes(), kind)

    def do_POST(self):
        # Prevent a website from driving the loopback parser with cross-origin requests.
        origin = self.headers.get('Origin')
        host = self.headers.get('Host', '')
        if host not in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}') or (origin and origin not in (f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}')):
            self.send(403, b'Forbidden', 'text/plain')
            return
        parsed = urlparse(self.path)
        if parsed.path != '/api/parse':
            self.send(404, b'Not found', 'text/plain')
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if size < 1 or size > MAX_FILE:
                raise ValueError('The file is empty or larger than 10 MiB.')
            query = parse_qs(parsed.query)
            data = self.rfile.read(size)
            result = parse_file(data, query.get('name', [''])[0], query.get('sheet', [''])[0], int(query.get('header', ['1'])[0]))
            self.send(200, json.dumps(result, ensure_ascii=False).encode(), 'application/json; charset=utf-8')
        except (ValueError, KeyError, IndexError, zipfile.BadZipFile, ET.ParseError, csv.Error, OverflowError, RuntimeError, OSError, InvalidOperation):
            import sys
            exc = sys.exception()
            message = str(exc) if isinstance(exc, ValueError) else 'The file is damaged or unsupported. Re-export it as CSV or XLSX.'
            self.send(400, json.dumps({'error': message}, ensure_ascii=False).encode(), 'application/json; charset=utf-8')

    def log_message(self, *args):
        pass  # Do not write user filenames to logs.


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'ListCheck ready: http://127.0.0.1:{args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
