import { OPENAI_API_KEY } from '../config/apiKeys';
import type { ParsedEntry } from '../types';

const TRANSCRIPTION_TIMEOUT_MS = 30_000;

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!audioUri || (!audioUri.startsWith('file://') && !audioUri.startsWith('/'))) {
    throw new Error(`Invalid audio URI: ${audioUri}`);
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const xhr = new XMLHttpRequest();

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        xhr.abort();
        reject(new Error('Transcription timed out'));
      }
    }, TRANSCRIPTION_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
    };

    xhr.open('POST', 'https://api.openai.com/v1/audio/transcriptions');
    xhr.setRequestHeader('Authorization', `Bearer ${OPENAI_API_KEY}`);

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      cleanup();

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (typeof data.text !== 'string' || data.text.length === 0) {
            reject(new Error('Whisper returned empty transcript'));
            return;
          }
          resolve(data.text);
        } catch {
          reject(new Error('Failed to parse Whisper response'));
        }
      } else {
        reject(new Error(`Whisper API error (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Network error during transcription'));
    };

    xhr.onabort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Transcription was cancelled'));
    };

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    xhr.send(formData);
  });
}

const VALID_CATEGORIES = new Set<ParsedEntry['category']>(['materials', 'time', 'issue', 'note']);

function validateEntry(raw: any): ParsedEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  if (typeof raw.title !== 'string' || raw.title.length === 0) return null;

  const category = VALID_CATEGORIES.has(raw.category) ? raw.category : 'note';

  const entry: ParsedEntry = {
    category,
    title: raw.title.slice(0, 200),
  };

  if (typeof raw.quantity === 'number' && isFinite(raw.quantity)) {
    entry.quantity = raw.quantity;
  }
  if (typeof raw.unit === 'string' && raw.unit.length > 0) {
    entry.unit = raw.unit.slice(0, 20);
  }
  if (typeof raw.detail === 'string' && raw.detail.length > 0) {
    entry.detail = raw.detail.slice(0, 500);
  }

  return entry;
}

const PARSE_SYSTEM_PROMPT = `You are a construction site assistant. Parse the following voice note transcript into structured entries.
Return a JSON array where each entry has:
- category: one of "materials", "time", "issue", "note"
- title: short description
- quantity: number (if applicable, omit if not)
- unit: string (if applicable, e.g. "hr", "m", "×", omit if not)
- detail: additional context (omit if not needed)
Only return valid JSON, no other text.`;

const ESTIMATE_PARSE_PROMPT = `You are a construction/trades quoting assistant. Parse the following voice note into billable line items for an estimate.
Return a JSON array where each entry has:
- name: short item/service description (e.g. "Downlight LED 6W", "Labour", "Call-out fee")
- quantity: number if mentioned, otherwise null
- unit: unit string if mentioned (e.g. "hr", "m", "×", "ea"), otherwise ""
- unitPrice: dollar amount per unit if mentioned, otherwise null
Extract every distinct billable item. If the speaker mentions a total price but not a per-unit price, put the total as unitPrice with quantity 1.
Only return valid JSON, no other text.`;

export async function parseTranscript(transcript: string): Promise<ParsedEntry[]> {
  if (!OPENAI_API_KEY) {
    return [{ category: 'note', title: transcript }];
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PARSE_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.length === 0) {
    return [{ category: 'note', title: transcript }];
  }

  try {
    const cleaned = content
      .replace(/```(?:json)?\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return [{ category: 'note', title: transcript }];
    }

    const validated = parsed
      .map(validateEntry)
      .filter((e): e is ParsedEntry => e !== null);

    return validated.length > 0 ? validated : [{ category: 'note', title: transcript }];
  } catch {
    return [{ category: 'note', title: transcript }];
  }
}

export type EstimateLineResult = {
  name: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
};

function validateEstimateLine(raw: any): EstimateLineResult | null {
  if (typeof raw !== 'object' || raw === null) return null;
  if (typeof raw.name !== 'string' || raw.name.length === 0) return null;

  return {
    name: raw.name.slice(0, 200),
    quantity: typeof raw.quantity === 'number' && isFinite(raw.quantity) ? raw.quantity : null,
    unit: typeof raw.unit === 'string' ? raw.unit.slice(0, 20) : '',
    unitPrice: typeof raw.unitPrice === 'number' && isFinite(raw.unitPrice) ? raw.unitPrice : null,
  };
}

export async function parseTranscriptForEstimate(transcript: string): Promise<EstimateLineResult[]> {
  if (!OPENAI_API_KEY) {
    return [{ name: transcript, quantity: null, unit: '', unitPrice: null }];
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ESTIMATE_PARSE_PROMPT },
        { role: 'user', content: transcript },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.length === 0) {
    return [{ name: transcript, quantity: null, unit: '', unitPrice: null }];
  }

  try {
    const cleaned = content
      .replace(/```(?:json)?\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return [{ name: transcript, quantity: null, unit: '', unitPrice: null }];
    }

    const validated = parsed
      .map(validateEstimateLine)
      .filter((e): e is EstimateLineResult => e !== null);

    return validated.length > 0 ? validated : [{ name: transcript, quantity: null, unit: '', unitPrice: null }];
  } catch {
    return [{ name: transcript, quantity: null, unit: '', unitPrice: null }];
  }
}
