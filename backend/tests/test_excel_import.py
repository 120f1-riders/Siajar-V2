# Excel soal import/template API tests (SIAJAR Next.js)
import io
import os
import pytest
import requests
import openpyxl

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or os.environ.get("preview_endpoint")).rstrip("/")
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def login(u, p):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login-test", json={"username": u, "password": p}, headers={"Origin": BASE_URL})
    if r.status_code != 200:
        pytest.skip(f"login failed {u}: {r.status_code}")
    s.headers.update({"Origin": BASE_URL})
    return s


@pytest.fixture(scope="module")
def guru():
    return login("guru1", "guru123")


def xlsx_bytes(headers, rows, sheet="Soal"):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet
    ws.append(headers)
    for r in rows:
        ws.append(r)
    b = io.BytesIO()
    wb.save(b)
    return b.getvalue()


def post_import(s, name, data, mime=XLSX_MIME, ai="0", **extra):
    form = {"mapel": "PAI", "kelas": "7", "materi": "Default Materi", "pakai_ai": ai, **extra}
    return s.post(f"{BASE_URL}/api/soal/import", files={"file": (name, data, mime)}, data=form, timeout=180)


# Template download
class TestTemplate:
    def test_template_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/soal/template")
        assert r.status_code == 401

    def test_template_valid(self, guru):
        r = guru.get(f"{BASE_URL}/api/soal/template")
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers["content-type"]
        wb = openpyxl.load_workbook(io.BytesIO(r.content))
        assert "Soal" in wb.sheetnames and "Petunjuk" in wb.sheetnames
        hdr = [c.value for c in wb["Soal"][1]]
        assert hdr == ["No", "Bentuk Soal", "Level Kognitif", "Skor", "Materi",
                       "Nilai Cinta & Capaian Pembelajaran", "Indikator Soal", "Butir Soal",
                       "Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D", "Pilihan E", "Kunci Jawaban"]


# Import parsing
class TestImport:
    def test_import_template_no_ai(self, guru):
        t = guru.get(f"{BASE_URL}/api/soal/template").content
        r = post_import(guru, "template.xlsx", t)
        assert r.status_code == 200, r.text
        rows = r.json()["rows"]
        assert len(rows) == 3
        assert rows[0]["bentuk"] == "pg" and rows[0]["kunci"] == "A" and rows[0]["level"] == "C2"
        assert rows[0]["opsi"][0] == "mutlak"
        assert rows[1]["bentuk"] == "pgk" and rows[1]["kunci"] == "A, C, E" and rows[1]["hots"] == 1
        assert rows[1]["skor"] == 2
        assert rows[2]["bentuk"] == "uraian" and rows[2]["skor"] == 5
        assert rows[2]["indikator"] == ""  # AI off

    def test_import_with_ai_fills_indikator(self, guru):
        t = guru.get(f"{BASE_URL}/api/soal/template").content
        r = post_import(guru, "template.xlsx", t, ai="1")
        assert r.status_code == 200, r.text
        d = r.json()
        print("aiInfo:", d["aiInfo"])
        assert d["rows"][1]["indikator"].strip() != ""
        assert d["rows"][2]["indikator"].strip() != ""

    def test_alias_headers_and_skip_and_unknown_bentuk(self, guru):
        data = xlsx_bytes(["Bentuk", "Soal", "A", "B", "Kunci"], [
            ["PG", "Siapa nabi terakhir?", "Muhammad", "Isa", "a"],
            ["", "", "", "", ""],
            [None, None, "x", "y", "B"],
            ["Esai", "Jelaskan wudu", None, None, "rubrik"],
            ["Aneh", "Soal aneh", None, None, ""],
        ])
        r = post_import(guru, "alias.xlsx", data)
        assert r.status_code == 200, r.text
        rows = r.json()["rows"]
        assert len(rows) == 3
        assert rows[0]["bentuk"] == "pg" and rows[0]["kunci"] == "A"
        assert rows[0]["materi"] == "Default Materi"
        assert rows[1]["bentuk"] == "uraian"
        assert any("tidak dikenali" in c for c in rows[2]["catatan"])
        assert any("Kunci" in c for c in rows[2]["catatan"])

    def test_reject_png(self, guru):
        r = post_import(guru, "foto.png", b"\x89PNG\r\n\x1a\nxxxx", mime="image/png")
        assert r.status_code == 400 and "xlsx" in r.json()["error"]

    def test_reject_jpg(self, guru):
        r = post_import(guru, "foto.jpg", b"\xff\xd8\xff", mime="image/jpeg")
        assert r.status_code == 400

    def test_reject_xls(self, guru):
        r = post_import(guru, "old.xls", b"\xd0\xcf\x11\xe0", mime="application/vnd.ms-excel")
        assert r.status_code == 400

    def test_corrupt_xlsx(self, guru):
        r = post_import(guru, "bad.xlsx", b"not a zip")
        assert r.status_code == 400

    def test_no_header(self, guru):
        r = post_import(guru, "nohdr.xlsx", xlsx_bytes(["X", "Y"], [["1", "2"]]))
        assert r.status_code == 400 and "Butir Soal" in r.json()["error"]

    def test_empty_rows(self, guru):
        r = post_import(guru, "empty.xlsx", xlsx_bytes(["Butir Soal"], []))
        assert r.status_code == 400

    def test_no_file(self, guru):
        r = guru.post(f"{BASE_URL}/api/soal/import", data={"x": "1"})
        assert r.status_code == 400

    def test_unauth(self):
        r = requests.post(f"{BASE_URL}/api/soal/import", files={"file": ("a.xlsx", b"x", XLSX_MIME)})
        assert r.status_code == 401

    def test_non_guru_forbidden(self):
        s = login("admin", "admin123")
        r = post_import(s, "a.xlsx", xlsx_bytes(["Soal"], [["q"]]))
        assert r.status_code == 403

    def test_foreign_origin_forbidden(self, guru):
        r = guru.post(f"{BASE_URL}/api/soal/import", files={"file": ("a.xlsx", xlsx_bytes(["Soal"], [["q"]]), XLSX_MIME)},
                      headers={"Origin": "https://evil.example.com"})
        assert r.status_code == 403
