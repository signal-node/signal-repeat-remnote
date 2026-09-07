import type {
  RichTextAudioInterface,
  RichTextInterface,
} from '@remnote/plugin-sdk';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isSupportedElement(value: unknown): boolean {
  if (typeof value === 'string') {
    return true;
  }

  if (!isRecord(value) || typeof value.i !== 'string') {
    return false;
  }

  switch (value.i) {
    case 'm':
    case 'x':
    case 'n':
      return typeof value.text === 'string';
    case 'q':
      return typeof value._id === 'string' && value._id.length > 0;
    case 'g':
      return value._id === null || typeof value._id === 'string';
    case 'i':
    case 'a':
      return typeof value.url === 'string' && value.url.length > 0;
    default:
      return false;
  }
}

function isMeaningfulElement(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (!isRecord(value)) {
    return false;
  }

  if (value.i === 'm' || value.i === 'x' || value.i === 'n') {
    return typeof value.text === 'string' && value.text.trim().length > 0;
  }

  return isSupportedElement(value);
}

/**
 * Retains RichText that the official read-only viewer can safely present in a
 * repeat session. Interactive plugin embeds, icons, delimiters, and unknown
 * future elements are intentionally excluded.
 */
export function prepareRepeatContent(value: unknown): RichTextInterface | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const content = value.filter(isSupportedElement) as RichTextInterface;
  return content.some(isMeaningfulElement) ? content : null;
}

export type RepeatContentPart =
  | { kind: 'rich-text'; content: RichTextInterface }
  | { kind: 'media'; media: RichTextAudioInterface };

/**
 * Keeps audio/video controls inside the popup iframe so keyboard cancellation
 * remains available while a native media control owns focus. All other
 * supported elements continue through RemNote's official RichText viewer.
 */
export function splitRepeatContent(
  content: RichTextInterface,
): RepeatContentPart[] {
  const parts: RepeatContentPart[] = [];
  let richTextPart: RichTextInterface = [];

  const flushRichText = (): void => {
    if (richTextPart.length === 0) {
      return;
    }

    parts.push({ kind: 'rich-text', content: richTextPart });
    richTextPart = [];
  };

  for (const element of content) {
    if (isRecord(element) && element.i === 'a') {
      flushRichText();
      parts.push({
        kind: 'media',
        media: element as RichTextAudioInterface,
      });
    } else {
      richTextPart.push(element);
    }
  }

  flushRichText();
  return parts;
}
