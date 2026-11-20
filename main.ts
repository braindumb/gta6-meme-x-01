import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const sourcePath = join(repoDir, "POST.json");
const targetPath = join(outputDir, "POST.json");

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function normalizePostUrl(value: string): string {
  const withoutQueryOrFragment = value.split(/[?#]/, 1)[0] ?? "";
  return withoutQueryOrFragment.replace(/\/+$/, "");
}

if (!existsSync(sourcePath)) {
  fail(`POST.json not found at ${sourcePath}`);
}

let raw: Buffer;
try {
  raw = readFileSync(sourcePath);
} catch (error) {
  fail(
    `could not read POST.json at ${sourcePath}: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw!.toString("utf8"));
} catch (error) {
  fail(
    `POST.json is not valid JSON: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

if (
  typeof parsed !== "object" ||
  parsed === null ||
  Array.isArray(parsed) ||
  typeof (parsed as Record<string, unknown>).url !== "string"
) {
  fail('POST.json must be a JSON object with a string field "url"');
}

const url = normalizePostUrl((parsed as Record<string, unknown>).url as string);
if (url === "") {
  fail("invalid X post URL in POST.json: URL is empty");
}
const pattern =
  /^https:\/\/(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\/(?:i\/web\/status\/|[A-Za-z0-9_]+\/status\/)\d+$/;

if (!pattern.test(url)) {
  fail(
    `invalid X post URL in POST.json: ${url} (expected https://x.com/<handle>/status/<digits>)`,
  );
}

try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(sourcePath, targetPath);
} catch (error) {
  fail(
    `could not copy POST.json to ${targetPath}: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}
