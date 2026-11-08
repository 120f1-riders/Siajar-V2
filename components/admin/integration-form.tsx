"use client";

import { useActionState, useState } from "react";
import {
  disconnectGoogleAction,
  saveIntegrationsAction,
} from "@/lib/actions/admin";

export type IntegrationView = {
  aiKeySet: boolean;
  aiKeyFromEnv: boolean;
  aiApiBase: string;
  aiModel: string;
  googleClientId: string;
  googleSecretSet: boolean;
  googleEmail: string;
  googleConnected: boolean;
  redirectUri: string;
  googleFolderId: string;
};

export function IntegrationForm({ view }: { view: IntegrationView }) {
  const [state, formAction, pending] = useActionState(
    saveIntegrationsAction,
    null
  );
  const [folders, setFolders] = useState<Array<{ id: string; name: string }> | null>(null);
  const [pilihFolderOpen, setPilihFolderOpen] = useState(false);

  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-stone-800">Integrasi</h2>
        <p className="text-xs text-stone-500">
          Kunci AI dan koneksi Google Drive disimpan di server, tidak pernah dikirim ke
          browser pengguna lain.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="rounded-xl border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-stone-800">Bantuan AI</p>
              <p className="text-xs text-stone-500">
                Dipakai tombol Bantu AI saat guru menyusun butir soal.
              </p>
            </div>
            <span
              className={`badge ${
                view.aiKeySet
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-stone-200 bg-stone-100 text-stone-600"
              }`}
            >
              {view.aiKeySet ? "Aktif" : "Belum diatur"}
            </span>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label" htmlFor="ai_api_key">
                Kunci API AI
              </label>
              <input
                id="ai_api_key"
                name="ai_api_key"
                type="password"
                autoComplete="off"
                className="input"
                placeholder={
                  view.aiKeySet
                    ? view.aiKeyFromEnv
                      ? "Aktif dari environment: Gemini utama, Claude cadangan"
                      : "Sudah tersimpan — kosongkan bila tidak diganti"
                    : "Isi kunci API, contoh dari Z.ai"
                }
              />
              {view.aiKeySet ? (
                <label className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                  <input
                    type="checkbox"
                    name="hapus_ai_key"
                    value="1"
                    className="h-3.5 w-3.5 accent-red-600"
                  />
                  Hapus kunci AI yang tersimpan di aplikasi
                </label>
              ) : null}
            </div>

            <div>
              <label className="label" htmlFor="ai_api_base">
                Alamat API
              </label>
              <input
                id="ai_api_base"
                name="ai_api_base"
                className="input"
                defaultValue={view.aiApiBase}
                placeholder="https://api.z.ai/api/paas/v4"
              />
            </div>
            <div>
              <label className="label" htmlFor="ai_model">
                Model
              </label>
              <input
                id="ai_model"
                name="ai_model"
                className="input"
                defaultValue={view.aiModel}
                placeholder="glm-5.3-flash"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-stone-800">
                Google Drive
              </p>
              <p className="text-xs text-stone-500">
                Untuk mengekspor naskah dan kartu soal sebagai Google Docs, serta
                kisi-kisi sebagai Google Sheets.
              </p>
            </div>
            <span
              className={`badge ${
                view.googleConnected
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-stone-200 bg-stone-100 text-stone-600"
              }`}
            >
              {view.googleConnected ? "Terhubung" : "Belum terhubung"}
            </span>
          </div>

          {view.googleConnected ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">
              <span>
                Akun: <span className="font-semibold">{view.googleEmail || "Google"}</span>
              </span>
              <form action={disconnectGoogleAction}>
                <button
                  type="submit"
                  className="btn btn-outline btn-sm"
                  onClick={(event) => {
                    if (
                      !window.confirm(
                        "Putuskan koneksi Google? Ekspor ke Drive tidak dapat dipakai sampai dihubungkan lagi."
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  Putuskan
                </button>
              </form>
            </div>
          ) : null}

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="google_client_id">
                Client ID OAuth Google
              </label>
              <input
                id="google_client_id"
                name="google_client_id"
                className="input"
                defaultValue={view.googleClientId}
                placeholder="....apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="google_client_secret">
                Client Secret
              </label>
              <input
                id="google_client_secret"
                name="google_client_secret"
                type="password"
                autoComplete="off"
                className="input"
                placeholder={
                  view.googleSecretSet
                    ? "Sudah tersimpan — kosongkan bila tidak diganti"
                    : "Client secret dari Google Cloud Console"
                }
              />
            </div>
            <div className="md:col-span-2">
              <p className="label">Redirect URI yang didaftarkan di Google</p>
              <code className="block break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-700">
                {view.redirectUri}
              </code>
            </div>

            <div className="md:col-span-2">
              <p className="label">Folder tujuan di Google Drive (opsional)</p>
              <input
                id="google_folder_id"
                name="google_folder_id"
                className="input"
                defaultValue={view.googleFolderId}
                placeholder={view.googleConnected
                  ? "Kotak ini terisi otomatis saat akun terhubung"
                  : "ID folder Google Drive, misalnya 0B01gk… atau 1BxiMVs0XRAox…"
                }
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                File naskah, kisi-kisi, dan kartu soal akan disimpan di folder ini bila
                kosongkan untuk biarkan Drive menentukan lokasi default.
              </p>
            </div>
          </div>            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href="/api/google/connect"
                aria-disabled={!view.googleClientId || !view.googleSecretSet}
                className={`btn btn-outline btn-sm ${
                  !view.googleClientId || !view.googleSecretSet
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                {view.googleConnected ? "Hubungkan Ulang" : "Hubungkan Akun Google"}
              </a>
              <span className="text-[11px] text-stone-500">
                Simpan Client ID dan Secret terlebih dahulu, lalu hubungkan.
              </span>
            </div>

            {view.googleConnected ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setFolders(null);
                    setPilihFolderOpen(true);
                    fetch("/api/admin/folders")
                      .then((r) => r.json())
                      .then((data) => {
                        if (Array.isArray(data)) setFolders(data);
                      })
                      .catch(() => setFolders(null));
                  }}
                >
                  Pilih dari Drive
                </button>
                <span className="text-[11px] text-stone-500">
                  Biarkan kosong untuk lokasi default Drive.
                </span>
              </div>
            ) : null}


          <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
            Di Google Cloud Console: aktifkan Google Drive API, buat OAuth Client ID
            jenis Web Application, lalu tempelkan Redirect URI di atas. Tambahkan akun
            Anda sebagai test user bila aplikasi masih berstatus Testing. Izin yang
            diminta hanya untuk file yang dibuat aplikasi ini (drive.file) dan alamat
            surel.
          </p>
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

        {pilihFolderOpen && (
          <div className="mt-3 rounded-lg border border-stone-300 bg-white shadow-sm">
            <div className="flex items-center justify-between rounded-t-lg border-b border-stone-200 px-3 py-2">
              <p className="text-sm font-semibold text-stone-800">Pilih folder Drive</p>
              <button
                type="button"
                className="text-stone-500"
                onClick={() => setPilihFolderOpen(false)}
              >
                Tutup
              </button>
            </div>
            {folders === null ? (
              <div className="px-3 py-3 text-center text-sm text-stone-500">
                Memuat daftar folder...
              </div>
            ) : folders?.length === 0 ? (
              <div className="px-3 py-3 text-center text-sm text-stone-500">
                Tidak ada folder di Drive.
              </div>
            ) : (
              <ul className="max-h-60 overflow-auto px-2">
                {folders?.map((folder: { id: string; name: string }) => (
                  <li key={folder.id}>
                    <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-stone-50">
                      <input
                        type="radio"
                        name="folderIdRadio"
                        value={folder.id}
                        defaultChecked={folder.id === view.googleFolderId}
                        className="h-4 w-4 accent-brand-700"
                      />
                      <span className="text-sm text-stone-700">{folder.name || folder.id}</span>
                      <span className="ml-auto text-[11px] text-stone-400">{folder.id}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-b-lg border-t border-stone-200 px-3 py-2 flex gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const selected = (
                    document.querySelector('input[name="folderIdRadio"]:checked') as HTMLInputElement | null
                  );
                  if (!selected) {
                    window.alert("Pilih satu folder dulu.");
                    return;
                  }
                  const form = document.querySelector("form") as HTMLFormElement | null;
                  if (!form) return;
                  const input = document.getElementById("google_folder_id") as HTMLInputElement | null;
                  if (input) input.value = selected.value;
                  form.requestSubmit();
                  setPilihFolderOpen(false);
                }}
              >
                Simpan pilihan
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPilihFolderOpen(false)}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Menyimpan..." : "Simpan Integrasi"}
        </button>
      </form>
    </section>
  );
}
