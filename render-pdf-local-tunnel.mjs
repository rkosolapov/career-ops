// One-off helper: render an already-built CV HTML to PDF via the user's local
// Chrome (Safe Local Mode reverse-SSH tunnel), bypassing the broken Docker
// playwright sidecar. Reuses generate-pdf.mjs's tested rendering logic
// (font inlining, ATS normalization, PDF options) via its exported functions
// -- does not duplicate or modify any career-ops system file.
import { chromium } from 'playwright';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { renderHtmlToPdf, normalizeTextForATS } from './generate-pdf.mjs';

const [, , inputArg, outputArg, formatArg, reportArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node render-pdf-local-tunnel.mjs <input.html> <output.pdf> [format] [reportNum]');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const format = formatArg || 'letter';
const reportNum = reportArg || '';
const CDP_ENDPOINT = 'http://172.18.0.1:9222';

const raw = await readFile(inputPath, 'utf-8');
const { html: normalized, replacements } = normalizeTextForATS(raw);
const total = Object.values(replacements).reduce((a, b) => a + b, 0);
if (total > 0) {
  console.log(`ATS normalization: ${total} replacements`);
}

const result = await renderHtmlToPdf(normalized, outputPath, {
  format,
  baseDir: dirname(inputPath),
  reportNum,
  inputPath,
  launchBrowser: () => chromium.connectOverCDP(CDP_ENDPOINT),
});

console.log(`Done: ${result.outputPath} (${result.pageCount} pages, ${(result.size / 1024).toFixed(1)} KB)`);
