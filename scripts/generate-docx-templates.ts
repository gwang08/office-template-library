// DOCX generator: DocSpec --docx@9.15.0--> .docx file + SVG card preview.
// Exercises the full round-trip surface: headings, bold/italic/underline,
// bullet + numbered lists, tables, inline PNG images.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DocBlock, DocSpec } from './specs/spec-types';
import { hexToRgb, solidColorPng } from './lib/png';
import { docxCardSvg } from './lib/svg-card';
import { manifestEntryForDocx, seedAssetsDir, type ManifestEntry } from './lib/manifest';

const HEADING = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

function blockToChildren(block: DocBlock, spec: DocSpec): (Paragraph | Table)[] {
  switch (block.type) {
    case 'heading':
      return [new Paragraph({ text: block.text, heading: HEADING[block.level - 1] })];
    case 'para':
      return [
        new Paragraph({
          children: block.runs.map(
            (run) =>
              new TextRun({
                text: run.text,
                bold: run.bold,
                italics: run.italic,
                underline: run.underline ? {} : undefined,
              }),
          ),
        }),
      ];
    case 'bullets':
      return block.items.map((item) => new Paragraph({ text: item, bullet: { level: 0 } }));
    case 'numbered':
      return block.items.map(
        (item) => new Paragraph({ text: item, numbering: { reference: 'ordered-list', level: 0 } }),
      );
    case 'image': {
      const png = solidColorPng(hexToRgb(spec.palette.accent), 200, 120);
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ type: 'png', data: png, transformation: { width: 200, height: 120 } })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: block.label, italics: true, size: 18, color: spec.palette.muted })],
        }),
      ];
    }
    case 'table': {
      const headerRow = new TableRow({
        tableHeader: true,
        children: block.header.map(
          (cell) =>
            new TableCell({
              shading: { fill: spec.palette.accent },
              children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true, color: 'FFFFFF' })] })],
            }),
        ),
      });
      const bodyRows = block.rows.map(
        (row) =>
          new TableRow({
            children: row.map((cell) => new TableCell({ children: [new Paragraph({ text: cell })] })),
          }),
      );
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...bodyRows],
        }),
      ];
    }
  }
}

/** Generates one .docx + its SVG card; returns the manifest entry. */
export async function generateDocxTemplate(spec: DocSpec): Promise<ManifestEntry> {
  const doc = new Document({
    creator: 'office-template-library',
    title: spec.name,
    description: spec.description,
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [{ children: spec.blocks.flatMap((block) => blockToChildren(block, spec)) }],
  });

  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.join(seedAssetsDir, 'templates', `${spec.slug}.docx`);
  mkdirSync(path.dirname(docxPath), { recursive: true });
  writeFileSync(docxPath, buffer);

  const cardPath = path.join(seedAssetsDir, 'assets', 'thumbs', spec.slug, 'card.svg');
  mkdirSync(path.dirname(cardPath), { recursive: true });
  writeFileSync(cardPath, docxCardSvg(spec));

  return manifestEntryForDocx(spec);
}
