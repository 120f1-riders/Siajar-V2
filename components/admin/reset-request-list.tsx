"use client";

import { useActionState } from "react";
import {
  handleResetRequestAction,
  ignoreResetRequestAction,
} from "@/lib/actions/admin";
import type { ResetRequestItem } from "@/lib/queries";
import { tanggalJamId } from "@/lib/format";

function RequestRow({ request }: { request: ResetRequestItem }) {
  const [state, formAction, pending] = useActionState(handleResetRequestAction, null);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-stone-800">{request.nama}</p>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-600">
            {request.username}
          </span>
          {request.status !== "pending" ? (
            <span className="badge badge-disahkan">Sudah ditangani</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-stone-500">
          Diajukan {tanggalJamId(request.created_at)}
          {request.keterangan ? ` · "${request.keterangan}"` : ""}
        </p>

        {state?.ok && state.temp ? (
          <div className="mt-2 rounded-lg border border-gold-300 bg-gold-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-gold-700">
              Password sementara {state.username}
            </p>
            <p className="font-mono text-lg font-bold tracking-wider text-stone-900">
              {state.temp}
            </p>
          </div>
        ) : null}
        {state?.error ? (
          <p className="mt-2 text-xs font-medium text-red-600">{state.error}</p>
        ) : null}
      </div>

      {request.status === "pending" ? (
        <div className="flex items-center gap-2">
          <form action={formAction}>
            <input type="hidden" name="id" value={request.id} />
            <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
              {pending ? "Memproses..." : "Buat Password Sementara"}
            </button>
          </form>
          <form action={ignoreResetRequestAction}>
            <input type="hidden" name="id" value={request.id} />
            <button type="submit" className="btn btn-ghost btn-sm">
              Abaikan
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function ResetRequestList({ requests }: { requests: ResetRequestItem[] }) {
  if (requests.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-stone-500">
        Tidak ada permintaan reset password.
      </p>
    );
  }
  return (
    <div>
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
    </div>
  );
}
