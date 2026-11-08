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
const SIZE = 21;
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
    children: [
      new TextRun({
        text: value,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? SIZE,
        font: FONT,
        color: opts.color,
      }),
    ],
  });
}

function lineParagraph(value: string, indent: number, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 45 },
    indent: { left: indent },
    children: [new TextRun({ text: value, bold, font: FONT, size: SIZE })],
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
              children: [paragraph(label, { bold: true, size: 19 })],
            }),
            new TableCell({
              children: [paragraph(value || "-", { size: 19 })],
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
      children: [
        new TextRun({
          text: `${item.nomor}. `,
          bold: true,
          font: FONT,
          size: SIZE,
        }),
        new TextRun({ text: soalLines[0] ?? "", font: FONT, size: SIZE }),
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
      size: 19,
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
        size: 19,
        spacingBefore: 160,
      })
    );
    for (const line of paket.petunjuk.split(/\r?\n/)) {
      children.push(paragraph(line, { size: 19 }));
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
              children: [paragraph(label, { bold: true, size: 19 })],
            })
        ),
      }),
      ...butir.map(
        (item) =>
          new TableRow({
            children: [
              paragraph(String(item.nomor), { size: 19 }),
              paragraph(bentukInfo(item.bentuk).singkat, { size: 19 }),
              paragraph(item.kunci || "-", { size: 19 }),
              paragraph(String(item.skor), { size: 19 }),
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
      default: { document: { run: { font: FONT, size: SIZE } } },
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
        size: 18,
        italics: true,
      })
    );
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: SIZE } } },
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
