import io
import unittest
import zipfile
from server import parse_file, parse_xlsx, tabular, xml

MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

def workbook(cells, styles='', extra=None):
    target=io.BytesIO()
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('xl/workbook.xml',f'<workbook xmlns="{MAIN}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="r1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/worksheets/sheet1.xml',f'<worksheet xmlns="{MAIN}"><sheetData>{cells}</sheetData></worksheet>')
        if styles:z.writestr('xl/styles.xml',styles)
        for name,value in (extra or {}).items():z.writestr(name,value)
    return target.getvalue()

HEADER='<row r="1"><c r="A1" t="inlineStr"><is><t>ID</t></is></c><c r="B1" t="inlineStr"><is><t>Name</t></is></c></row>'

class ParserTests(unittest.TestCase):
    def test_csv_quotes_encoding_and_original_lines(self):
        result=parse_file('ID,名称\r\n001,"Oak, Garden"\r\n\r\n002,河畔\r\n'.encode('utf-8-sig'),'a.csv')
        self.assertEqual(result['rows'][0]['values'],['001','Oak, Garden'])
        self.assertEqual(result['rows'][1]['line'],4)
        self.assertEqual(parse_file('ID,名称\n001,河畔'.encode('utf-16'),'a.csv')['rows'][0]['values'][1],'河畔')
        self.assertEqual(parse_file('ID,名称\n001,河畔'.encode('gb18030'),'a.csv')['rows'][0]['values'][1],'河畔')

    def test_header_selection_and_empty_columns(self):
        self.assertEqual(parse_file(b'Report\nID,Name\n001,Oak','a.csv',header=2)['headers'],['ID','Name'])
        for rows in ([['ID','ID'],['1','2']],[['ID',''],['1','2']],[['ID']],[['ID'],['1','unlabelled']]):
            with self.assertRaises(ValueError):tabular(rows)

    def test_xlsx_shared_inline_and_leading_zero(self):
        styles=f'<styleSheet xmlns="{MAIN}"><numFmts count="1"><numFmt numFmtId="164" formatCode="00000"/></numFmts><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="164"/></cellXfs></styleSheet>'
        cells=HEADER+'<row r="2"><c r="A2" s="1"><v>12</v></c><c r="B2" t="s"><v>0</v></c></row>'
        shared=f'<sst xmlns="{MAIN}"><si><r><t>Oak </t></r><r><t>Garden</t></r></si></sst>'
        result=parse_xlsx(workbook(cells,styles,{'xl/sharedStrings.xml':shared}))
        self.assertEqual(result['rows'][0]['values'],['00012','Oak Garden'])
        self.assertEqual(result['sheets'],['Data'])

    def test_xlsx_date_and_large_integer(self):
        styles=f'<styleSheet xmlns="{MAIN}"><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>'
        cells=HEADER+'<row r="2"><c r="A2"><v>123456789012345678</v></c><c r="B2" s="1"><v>61</v></c></row>'
        result=parse_xlsx(workbook(cells,styles));self.assertEqual(result['rows'][0]['values'],['123456789012345678','1900-03-01'])

    def test_formula_cache_and_missing_cache(self):
        cells=HEADER+'<row r="2"><c r="A2"><f>1+1</f><v>2</v></c><c r="B2" t="inlineStr"><is><t>Oak</t></is></c></row>'
        result=parse_xlsx(workbook(cells));self.assertEqual(result['rows'][0]['values'][0],'2');self.assertTrue(result['warnings'])
        with self.assertRaises(ValueError):parse_xlsx(workbook(cells.replace('<v>2</v>','')))

    def test_rejects_invalid_and_entity_xml(self):
        with self.assertRaises(ValueError):parse_file(b'a,b','a.xls')
        with self.assertRaises(ValueError):xml(b'<!DOCTYPE x [<!ENTITY a "hello">]><x/>')
        with self.assertRaises(zipfile.BadZipFile):parse_xlsx(b'not a zip')
        with self.assertRaises(ValueError):parse_xlsx(workbook(HEADER+'<row r="999999"><c r="A999999"><v>1</v></c></row>'))
        with self.assertRaises(ValueError):parse_xlsx(workbook(HEADER+'<row r="2"><c r="A2" t="e"><v>#REF!</v></c></row>'))

    def test_missing_sheet(self):
        with self.assertRaises(ValueError):parse_xlsx(workbook(HEADER),'Absent')

    def test_file_size(self):
        with self.assertRaises(ValueError):parse_file(b'a'*(10*1024*1024+1),'a.csv')

if __name__=='__main__':unittest.main()
