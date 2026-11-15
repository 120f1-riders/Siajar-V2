# Regression: save (PUT) existing paket soal after editing - Next.js API /api/paket/{id}
import os
import pytest
import requests

BASE_URL = os.environ.get("APP_URL").rstrip("/")


def butir(soal, kunci="A", opsi=None):
    return {"bentuk": "pg", "materi": "TEST_materi", "acuan": "", "indikator": "TEST_ind",
            "level": "C2", "hots": False, "soal": soal,
            "opsi": opsi or ["Opsi A", "Opsi B", "Opsi C", "Opsi D", ""], "kunci": kunci, "skor": 1}


def base_payload(pid, items):
    return {"id": pid, "mapel": "TEST_Matematika", "kelas": "VII", "semester": "Ganjil",
            "tahun_ajaran": "2026/2027", "kurikulum": "merdeka",
            "jenis_penilaian": "Asesmen Sumatif Akhir Semester", "alokasi_waktu": "90 menit",
            "materi": "", "petunjuk": "TEST", "cetak_kunci": False, "status": "draft", "butir": items}


@pytest.fixture(scope="module")
def guru():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login-test", json={"username": "guru1", "password": "guru123"})
    if r.status_code != 200:
        pytest.skip("login failed")
    return s


@pytest.fixture(scope="module")
def paket_id(guru):
    r = guru.post(f"{BASE_URL}/api/paket", headers={"Origin": BASE_URL})
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    yield pid
    guru.delete(f"{BASE_URL}/api/paket/{pid}", headers={"Origin": BASE_URL})


class TestPaketSave:
    def test_unauth_put(self, paket_id):
        r = requests.put(f"{BASE_URL}/api/paket/{paket_id}", json={})
        assert r.status_code == 401

    def test_first_save(self, guru, paket_id):
        items = [butir("TEST_Soal 1"), butir("TEST_Soal 2", "B"), butir("TEST_Soal 3", "C")]
        r = guru.put(f"{BASE_URL}/api/paket/{paket_id}", json=base_payload(paket_id, items),
                     headers={"Origin": BASE_URL})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert [b["soal"] for b in d["butir"]] == ["TEST_Soal 1", "TEST_Soal 2", "TEST_Soal 3"]

    def test_edit_existing_save(self, guru, paket_id):
        items = [butir("TEST_Soal 1 EDITED", "D", ["Edit A", "B", "C", "D", ""]),
                 butir("TEST_Soal 2", "B"), butir("TEST_Soal 3", "C")]
        r = guru.put(f"{BASE_URL}/api/paket/{paket_id}", json=base_payload(paket_id, items),
                     headers={"Origin": BASE_URL})
        assert r.status_code == 200, r.text
        b = r.json()["butir"]
        assert b[0]["soal"] == "TEST_Soal 1 EDITED"
        assert b[0]["kunci"] == "D"
        assert "Edit A" in str(b[0]["opsi"])

    def test_edit_repeat_save_many_times(self, guru, paket_id):
        for i in range(5):
            items = [butir(f"TEST_iter {i} #{j}") for j in range(10)]
            r = guru.put(f"{BASE_URL}/api/paket/{paket_id}", json=base_payload(paket_id, items),
                         headers={"Origin": BASE_URL})
            assert r.status_code == 200, r.text
            assert len(r.json()["butir"]) == 10

    def test_reorder_delete_add(self, guru, paket_id):
        items = [butir("TEST_C"), butir("TEST_A"), butir("TEST_NEW")]
        r = guru.put(f"{BASE_URL}/api/paket/{paket_id}", json=base_payload(paket_id, items),
                     headers={"Origin": BASE_URL})
        assert r.status_code == 200
        b = r.json()["butir"]
        assert [x["soal"] for x in b] == ["TEST_C", "TEST_A", "TEST_NEW"]
        assert [x["nomor"] for x in b] == [1, 2, 3]

    def test_editor_page_reflects(self, guru, paket_id):
        r = guru.get(f"{BASE_URL}/guru/paket/{paket_id}")
        assert r.status_code == 200
        assert "TEST_NEW" in r.text

    def test_missing_mapel_400(self, guru, paket_id):
        p = base_payload(paket_id, [])
        p["mapel"] = ""
        r = guru.put(f"{BASE_URL}/api/paket/{paket_id}", json=p, headers={"Origin": BASE_URL})
        assert r.status_code == 400
        assert "Mata pelajaran" in r.json()["error"]

    def test_foreign_origin_403(self, guru, paket_id):
        r = guru.put(f"{BASE_URL}/api/paket/{paket_id}", json=base_payload(paket_id, []),
                     headers={"Origin": "https://evil.example.com"})
        assert r.status_code == 403

    def test_not_found(self, guru):
        r = guru.put(f"{BASE_URL}/api/paket/99999999", json=base_payload(99999999, []),
                     headers={"Origin": BASE_URL})
        assert r.status_code == 404

    def test_other_user_forbidden(self, paket_id):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login-test", json={"username": "kepala1", "password": "kepala123"})
        r = s.put(f"{BASE_URL}/api/paket/{paket_id}", json=base_payload(paket_id, []),
                  headers={"Origin": BASE_URL})
        assert r.status_code == 403
