import "server-only";
import {
  AlignmentType,
  BorderStyle,
  Document,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { bentukInfo, HURUF_OPSI, kurikulumInfo, levelLabel } from "@/lib/konstanta";
import type { Butir, Paket, Settings } from "@/lib/types";

export type ExportData = {
  paket: Paket;
  butir: Butir[];
  settings: Settings;
};

const FONT = "Arial";
const SIZE = 24;
const FONT_ARAB = "Traditional Arabic";
const SIZE_ARAB = 36;
const ARAB = "\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF";
const ARAB_SEGMENT = new RegExp(`([${ARAB}](?:[${ARAB}\\s\\d.,:;!?()\\-]*[${ARAB}])?)`, "g");
const ARAB_CHAR = new RegExp(`[${ARAB}]`);
const ARAB_COUNT = new RegExp(`[${ARAB}]`, "g");

type RunOpts = { bold?: boolean; italics?: boolean; size?: number; color?: string };

// Pecah teks: bagian Arab pakai Traditional Arabic 18, sisanya Arial
function runs(value: string, opts: RunOpts = {}): TextRun[] {
  return value
    .split(ARAB_SEGMENT)
    .filter((part) => part !== "")
    .map((part) =>
      ARAB_CHAR.test(part)
        ? new TextRun({
            text: part,
            bold: opts.bold,
            italics: opts.italics,
            color: opts.color,
            font: { ascii: FONT_ARAB, hAnsi: FONT_ARAB, cs: FONT_ARAB, eastAsia: FONT_ARAB },
            size: SIZE_ARAB,
            sizeComplexScript: SIZE_ARAB,
            rightToLeft: true,
          })
        : new TextRun({
            text: part,
            bold: opts.bold,
            italics: opts.italics,
            color: opts.color,
            font: FONT,
            size: opts.size ?? SIZE,
            sizeComplexScript: opts.size ?? SIZE,
          })
    );
}

function mostlyArabic(value: string): boolean {
  const arab = (value.match(ARAB_COUNT) ?? []).length;
  const letters = (value.match(/[A-Za-z]/g) ?? []).length;
  return arab > 0 && arab >= letters;
}
const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  both: AlignmentType.JUSTIFIED,
};

function paragraph(
  value: string,
  opts: {
    bold?: boolean;
    size?: number;
    align?: keyof typeof ALIGN;
    italics?: boolean;
    spacingAfter?: number;
    spacingBefore?: number;
    indent?: number;
    color?: string;
    border?: boolean;
  } = {}
): Paragraph {
  return new Paragraph({
    alignment: opts.align ? ALIGN[opts.align] : undefined,
    bidirectional: mostlyArabic(value),
    spacing: {
      after: opts.spacingAfter ?? 60,
      before: opts.spacingBefore ?? 0,
    },
    indent: opts.indent ? { left: opts.indent } : undefined,
    border: opts.border
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: "000000",
            space: 4,
          },
        }
      : undefined,
    children: runs(value, opts),
  });
}

function lineParagraph(value: string, indent: number, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 45 },
    indent: mostlyArabic(value) ? { right: indent } : { left: indent },
    bidirectional: mostlyArabic(value),
    children: runs(value, { bold }),
  });
}

function kop(settings: Settings): Paragraph[] {
  const out: Paragraph[] = [];
  if (settings.baris1) {
    out.push(
      paragraph(settings.baris1, {
        bold: true,
        size: 23,
        align: "center",
        spacingAfter: 0,
      })
    );
  }
  if (settings.baris2) {
    out.push(
      paragraph(settings.baris2, {
        bold: true,
        size: 21,
        align: "center",
        spacingAfter: 0,
      })
    );
  }
  out.push(
    paragraph(settings.nama_madrasah || "NAMA MADRASAH", {
      bold: true,
      size: 30,
      align: "center",
      spacingAfter: 0,
    })
  );
  if (settings.alamat) {
    out.push(
      paragraph(settings.alamat, { size: 18, align: "center", spacingAfter: 0 })
    );
  }
  const kontak = [settings.kontak, settings.website].filter(Boolean).join(" · ");
  out.push(
    paragraph(kontak, {
      size: 17,
      align: "center",
      spacingAfter: 160,
      border: true,
    })
  );
  return out;
}

const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "B7B7B7",
};

function metaTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: TABLE_BORDER,
      bottom: TABLE_BORDER,
      left: TABLE_BORDER,
      right: TABLE_BORDER,
      insideHorizontal: TABLE_BORDER,
      insideVertical: TABLE_BORDER,
    },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { fill: "F2F2F2", type: ShadingType.CLEAR, color: "auto" },
              children: [paragraph(label, { bold: true, size: SIZE })],
            }),
            new TableCell({
              children: [paragraph(value || "-", { size: SIZE })],
            }),
          ],
        })
    ),
  });
}

function soalBlock(item: Butir): Paragraph[] {
  const out: Paragraph[] = [];
  const soalLines = (item.soal || "(soal belum diisi)").split(/\r?\n/);
  out.push(
    new Paragraph({
      spacing: { before: 100, after: 40 },
      indent: { left: 360, hanging: 360 },
      bidirectional: mostlyArabic(soalLines[0] ?? ""),
      children: [
        new TextRun({
          text: `${item.nomor}. `,
          bold: true,
          font: FONT,
          size: SIZE,
        }),
        ...runs(soalLines[0] ?? ""),
      ],
    })
  );
  for (const line of soalLines.slice(1)) {
    out.push(lineParagraph(line, 360));
  }

  if (bentukInfo(item.bentuk).pakaiOpsi) {
    item.opsi.filter(Boolean).forEach((option, index) => {
      out.push(
        lineParagraph(
          `${HURUF_OPSI[index] ?? index + 1}. ${option}`,
          720
        )
      );
    });
  }
  if (item.bentuk === "bs") {
    out.push(lineParagraph("Benar / Salah", 720));
  }
  if (item.bentuk === "isian") {
    out.push(lineParagraph("Jawaban: ..............................................................", 720));
  }
  return out;
}

export async function buildNaskahDocx({
  paket,
  butir,
  settings,
}: ExportData): Promise<Buffer> {
  const info = kurikulumInfo(paket.kurikulum);
  const children: (Paragraph | Table)[] = [...kop(settings)];

  children.push(
    paragraph(paket.jenis_penilaian || "Naskah Soal", {
      bold: true,
      size: 26,
      align: "center",
      spacingAfter: 0,
    })
  );
  children.push(
    paragraph(`Tahun Pelajaran ${paket.tahun_ajaran}`, {
      size: SIZE,
      align: "center",
      spacingAfter: 160,
    })
  );

  children.push(
    metaTable([
      ["Mata Pelajaran", paket.mapel],
      ["Kelas / Semester", `${paket.kelas} / ${paket.semester}`],
      ["Kurikulum", info.label],
      ["Alokasi Waktu", paket.alokasi_waktu || "-"],
      ["Jumlah Butir", `${butir.length} butir`],
    ])
  );

  if (paket.petunjuk) {
    children.push(
      paragraph("Petunjuk Umum", {
        bold: true,
        size: SIZE,
        spacingBefore: 160,
      })
    );
    for (const line of paket.petunjuk.split(/\r?\n/)) {
      children.push(paragraph(line, { size: SIZE }));
    }
  }

  const groups: { bentuk: string; items: Butir[] }[] = [];
  for (const item of butir) {
    const found = groups.find((group) => group.bentuk === item.bentuk);
    if (found) found.items.push(item);
    else groups.push({ bentuk: item.bentuk, items: [item] });
  }

  groups.forEach((group, groupIndex) => {
    children.push(
      paragraph(
        `${String.fromCharCode(65 + groupIndex)}. ${bentukInfo(group.bentuk).label}`,
        { bold: true, spacingBefore: 160 }
      )
    );
    for (const item of group.items) {
      children.push(...soalBlock(item));
    }
  });

  if (paket.cetak_kunci) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      paragraph("Kunci Jawaban dan Penskoran", {
        bold: true,
        size: 26,
        align: "center",
        spacingAfter: 160,
      })
    );

    const rows = [
      new TableRow({
        children: ["No", "Bentuk", "Kunci / Rubrik", "Skor"].map(
          (label) =>
            new TableCell({
              shading: { fill: "E8E8E8", type: ShadingType.CLEAR, color: "auto" },
              children: [paragraph(label, { bold: true, size: SIZE })],
            })
        ),
      }),
      ...butir.map(
        (item) =>
          new TableRow({
            children: [
              paragraph(String(item.nomor), { size: SIZE }),
              paragraph(bentukInfo(item.bentuk).singkat, { size: SIZE }),
              paragraph(item.kunci || "-", { size: SIZE }),
              paragraph(String(item.skor), { size: SIZE }),
            ].map((cell) => new TableCell({ children: [cell] })),
          })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: TABLE_BORDER,
          bottom: TABLE_BORDER,
          left: TABLE_BORDER,
          right: TABLE_BORDER,
          insideHorizontal: TABLE_BORDER,
          insideVertical: TABLE_BORDER,
        },
        rows,
      })
    );
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: SIZE, sizeComplexScript: SIZE_ARAB } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function buildKartuDocx({
  paket,
  butir,
  settings,
}: ExportData): Promise<Buffer> {
  const info = kurikulumInfo(paket.kurikulum);
  const total = butir.reduce((sum, item) => sum + (Number(item.skor) || 0), 0);
  const children: (Paragraph | Table)[] = [];

  butir.forEach((item, index) => {
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(...kop(settings));
    children.push(
      paragraph("KARTU SOAL", {
        bold: true,
        size: 25,
        align: "center",
        spacingAfter: 0,
      })
    );
    children.push(
      paragraph(`${paket.jenis_penilaian} · ${paket.tahun_ajaran}`, {
        size: 18,
        align: "center",
        spacingAfter: 120,
      })
    );

    children.push(
      metaTable([
        ["Mata Pelajaran", paket.mapel],
        ["Kelas / Semester", `${paket.kelas} / ${paket.semester}`],
        ["Kurikulum", info.label],
        ["Bentuk Soal", bentukInfo(item.bentuk).label],
        ["Nomor Soal", String(item.nomor)],
        ["Skor", String(item.skor)],
        [info.kisiKolom, item.acuan],
        ["Materi", item.materi],
        ["Indikator Soal", item.indikator],
        ["Level Kognitif", levelLabel(item.level)],
      ])
    );

    children.push(
      paragraph(`Butir Soal Nomor ${item.nomor}`, {
        bold: true,
        spacingBefore: 160,
      })
    );
    children.push(...soalBlock(item));

    children.push(
      paragraph("Kunci Jawaban dan Penskoran", {
        bold: true,
        spacingBefore: 160,
      })
    );
    for (const line of (item.kunci || "—").split(/\r?\n/)) {
      children.push(paragraph(line));
    }
    children.push(
      paragraph(`Skor butir: ${item.skor} dari total ${total} skor.`, {
        size: SIZE,
        italics: true,
      })
    );
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: SIZE, sizeComplexScript: SIZE_ARAB } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
