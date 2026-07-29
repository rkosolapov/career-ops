// One-off helper: render a cover-letter JSON payload to PDF via the user's
// local Chrome (Safe Local Mode reverse-SSH tunnel), bypassing the broken
// Docker playwright sidecar. Mirrors render-pdf-local-tunnel.mjs's approach
// -- reuses buildHtml from generate-cover-letter.mjs and renderHtmlToPdf from
// generate-pdf.mjs, does not duplicate either script's logic.
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { buildHtml } from './generate-cover-letter.mjs';
import { renderHtmlToPdf } from './generate-pdf.mjs';

const [, , payloadArg, outArg, reportArg] = process.argv;
if (!payloadArg) {
  console.error('Usage: node render-cover-local-tunnel.mjs <payload.json> [output.pdf] [reportNum]');
  process.exit(1);
}

const CDP_ENDPOINT = 'http://172.18.0.1:9222';
const OUTPUT_ROOT = resolve('output');

const payloadPath = resolve(payloadArg);
if (!existsSync(payloadPath)) {
  console.error(`ERROR: payload file not found: ${payloadPath}`);
  process.exit(1);
}

const payload = JSON.parse(readFileSync(payloadPath, 'utf-8'));
if (outArg) payload.output_path = outArg;
if (!payload.output_path) {
  const company = (payload.letter?.company || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const role = (payload.letter?.role_title || 'role').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
  payload.output_path = join(OUTPUT_ROOT, `${company}-${role}-cover.pdf`);
}
if (!existsSync(OUTPUT_ROOT)) mkdirSync(OUTPUT_ROOT, { recursive: true });

const html = buildHtml(payload);
const outputPath = resolve(payload.output_path);

const result = await renderHtmlToPdf(html, outputPath, {
  format: 'a4',
  reportNum: reportArg || '',
  launchBrowser: () => chromium.connectOverCDP(CDP_ENDPOINT),
});

console.log(`Done: ${result.outputPath} (${result.pageCount} pages, ${(result.size / 1024).toFixed(1)} KB)`);
