"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/lib/actions/admin";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="baris1">
            Baris pertama kop
          </label>
          <input
            id="baris1"
            name="baris1"
            className="input"
            defaultValue={settings.baris1}
            placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="baris2">
            Baris kedua kop
          </label>
          <input
            id="baris2"
            name="baris2"
            className="input"
            defaultValue={settings.baris2}
            placeholder="KANTOR KEMENTERIAN AGAMA KABUPATEN ..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="nama_madrasah">
            Nama madrasah
          </label>
          <input
            id="nama_madrasah"
            name="nama_madrasah"
            className="input"
            defaultValue={settings.nama_madrasah}
            required
            placeholder="MTs NEGERI 1 ..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="alamat">
            Alamat
          </label>
          <input
            id="alamat"
            name="alamat"
            className="input"
            defaultValue={settings.alamat}
            placeholder="Jalan ..., Kecamatan ..., Kabupaten/Kota ..."
          />
        </div>
        <div>
          <label className="label" htmlFor="kontak">
            Telepon / surel
          </label>
          <input
            id="kontak"
            name="kontak"
            className="input"
            defaultValue={settings.kontak}
            placeholder="Telepon (000) 000000 · surel: ..."
          />
        </div>
        <div>
          <label className="label" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            className="input"
            defaultValue={settings.website}
            placeholder="www.madrasah.sch.id"
          />
        </div>
        <div>
          <label className="label" htmlFor="kota">
            Kota / kabupaten (tempat tanda tangan)
          </label>
          <input
            id="kota"
            name="kota"
            className="input"
            defaultValue={settings.kota}
            placeholder="Contoh: Bandung"
          />
        </div>
        <div>
          <label className="label" htmlFor="kepala_nama">
            Nama kepala madrasah
          </label>
          <input
            id="kepala_nama"
            name="kepala_nama"
            className="input"
            defaultValue={settings.kepala_nama}
          />
        </div>
        <div>
          <label className="label" htmlFor="kepala_nip">
            NIP kepala madrasah
          </label>
          <input
            id="kepala_nip"
            name="kepala_nip"
            className="input"
            defaultValue={settings.kepala_nip}
          />
        </div>
        <div>
          <label className="label" htmlFor="tahun_ajaran">
            Tahun pelajaran bawaan
          </label>
          <input
            id="tahun_ajaran"
            name="tahun_ajaran"
            className="input"
            defaultValue={settings.tahun_ajaran}
            placeholder="2026/2027"
          />
        </div>
        <div>
          <label className="label" htmlFor="semester">
            Semester bawaan
          </label>
          <select
            id="semester"
            name="semester"
            className="select"
            defaultValue={settings.semester || "Ganjil"}
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">Logo madrasah</p>
          <p className="mt-0.5 text-xs text-stone-500">
            Tampil di sisi kiri kop surat. PNG transparan disarankan.
          </p>
          <div className="mt-3 flex items-center gap-4">
            {settings.logo_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_path}
                alt="Logo madrasah"
                className="h-20 w-20 rounded-lg border border-stone-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white text-[10px] text-stone-400">
                Belum ada
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-800"
              />
              {settings.logo_path ? (
                <label className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                  <input type="checkbox" name="hapus_logo" value="1" className="h-3.5 w-3.5 accent-red-600" />
                  Hapus logo saat menyimpan
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">
            Tanda tangan kepala madrasah
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Dipakai bila kepala madrasah belum mengunggah tanda tangan pada akunnya.
          </p>
          <div className="mt-3 flex items-center gap-4">
            {settings.kepala_ttd_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.kepala_ttd_path}
                alt="Tanda tangan kepala madrasah"
                className="h-20 w-32 rounded-lg border border-stone-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white text-[10px] text-stone-400">
                Belum ada
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                name="kepala_ttd"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-800"
              />
              {settings.kepala_ttd_path ? (
                <label className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                  <input type="checkbox" name="hapus_ttd" value="1" className="h-3.5 w-3.5 accent-red-600" />
                  Hapus tanda tangan saat menyimpan
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
