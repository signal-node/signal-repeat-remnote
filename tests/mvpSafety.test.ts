import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = join(process.cwd(), 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

describe('MVP privacy and non-mutation boundary', () => {
  it('contains no logging, persistence, or external communication path', () => {
    const source = sourceFiles(SOURCE_ROOT)
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/\bconsole\s*\./);
    expect(source).not.toMatch(/\b(?:localStorage|sessionStorage|indexedDB)\b/);
    expect(source).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(?/);
  });

  it('contains no Rem, card-rating, scheduling, or queue mutation call', () => {
    const source = sourceFiles(SOURCE_ROOT)
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(
      /\.(?:setText|setBackText|setIsDocument|remove|delete|answerCard|rateCard|dismissCard|addToQueue|removeFromQueue)\s*\(/,
    );
  });
});

describe('MVP accessibility style boundary', () => {
  it('keeps long content scrollable and removes progress animation for reduced motion', () => {
    const styles = readFileSync(join(SOURCE_ROOT, 'index.css'), 'utf8');

    expect(styles).toMatch(
      /\.signal-repeat-session__content\s*\{[^}]*overflow:\s*auto/s,
    );
    expect(styles).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.signal-repeat-progress__fill\s*\{[^}]*transition:\s*none/s,
    );
    expect(styles).toMatch(
      /\.signal-repeat-session__close:focus-visible\s*\{[^}]*outline:/s,
    );
  });
});
