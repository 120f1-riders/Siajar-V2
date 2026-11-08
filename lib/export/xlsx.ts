import "server-only";
import ExcelJS from "exceljs";
import { bentukInfo, kurikulumInfo } from "@/lib/konstanta";
import type { ExportData } from "./docx";

const BORDER = {
  top: { style: "thin" as const, color: { argb: "FFBFBFBF" } },
  bottom: { style: "thin" as const, color: { argb: "FFBFBFBF" } },
  left: { style: "thin" as const, color: { argb: "FFBFBFBF" } },
  right: { style: "thin" as const, color: { argb: "FFBFBFBF" } },
};

export async function buildKisiXlsx({
  paket,
  butir,
  settings,
}: ExportData): Promise<Buffer> {
  const info = kurikulumInfo(paket.kurikulum);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIAJAR";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Kisi-kisi", {
    views: [{ state: "frozen", ySplit: 6 }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  sheet.columns = [
    { width: 6 },
    { width: 28 },
    { width: 22 },
    { width: 40 },
    { width: 10 },
    { width: 20 },
    { width: 8 },
    { width: 7 },
  ];

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "KISI-KISI SOAL";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A1").alignment = { horizontal: "center" };

  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = `${paket.jenis_penilaian} · ${paket.mapel} · Kelas ${paket.kelas} · ${paket.tahun_ajaran}`;
  sheet.getCell("A2").font = { size: 11 };
  sheet.getCell("A2").alignment = { horizontal: "center" };

  sheet.mergeCells("A3:D3");
  sheet.getCell("A3").value = `Madrasah: ${settings.nama_madrasah || "-"}`;
  sheet.mergeCells("E3:H3");
  sheet.getCell("E3").value = `Kurikulum: ${info.label}`;

  sheet.mergeCells("A4:D4");
  sheet.getCell("A4").value = `Guru Mata Pelajaran: ${paket.guru_nama}`;
  sheet.mergeCells("E4:H4");
  sheet.getCell("E4").value = `Jumlah Butir: ${butir.length} (${butir.reduce((sum, item) => sum + (Number(item.skor) || 0), 0)} skor)`;

  sheet.mergeCells("A5:D5");
  sheet.getCell("A5").value = `Kelas / Semester: ${paket.kelas} / ${paket.semester}`;
  sheet.mergeCells("E5:H5");
  sheet.getCell("E5").value = `Alokasi Waktu: ${paket.alokasi_waktu || "-"}`;

  for (let row = 3; row <= 5; row += 1) {
    for (let col = 1; col <= 8; col += 1) {
      sheet.getCell(row, col).font = { size: 10 };
    }
  }

  const headers = [
    "No",
    info.kisiKolom,
    "Materi",
    "Indikator Soal",
    "Level",
    "Bentuk Soal",
    "No. Soal",
    "Skor",
  ];
  const headerRow = sheet.getRow(6);
  headers.forEach((label, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF14532D" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = BORDER;
  });
  headerRow.height = 30;

  butir.forEach((item, index) => {
    const row = sheet.getRow(7 + index);
    row.values = [
      item.nomor,
      item.acuan || "-",
      item.materi || "-",
      item.indikator || "-",
      item.level,
      bentukInfo(item.bentuk).label,
      item.nomor,
      item.skor,
    ];
    for (let col = 1; col <= 8; col += 1) {
      const cell = row.getCell(col);
      cell.font = { size: 9 };
      cell.alignment = {
        vertical: "top",
        wrapText: true,
        horizontal: col === 1 || col >= 5 ? "center" : "left",
      };
      cell.border = BORDER;
    }
  });

  const lastRow = Math.max(7 + butir.length, 7);
  sheet.autoFilter = { from: "A6", to: `H${lastRow}` };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
