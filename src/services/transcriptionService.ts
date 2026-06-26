import { OPENAI_API_KEY } from '../config/apiKeys';
import type { ParsedEntry } from '../types';

export async function transcribeAudio(audioUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.openai.com/v1/audio/transcriptions');
    xhr.setRequestHeader('Authorization', `Bearer ${OPENAI_API_KEY}`);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.text);
        } catch {
          reject(new Error('Failed to parse Whisper response'));
        }
      } else {
        reject(new Error(`Whisper API error (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during transcription'));

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    xhr.send(formData);
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const data = await response.json();
  return data.text;
}

const PARSE_SYSTEM_PROMPT = `You are a construction site assistant. Parse the following voice note transcript into structured entries.
Return a JSON array where each entry has:
- category: one of "materials", "time", "issue", "note"
- title: short description
- quantity: number (if applicable, omit if not)
- unit: string (if applicable, e.g. "hr", "m", "×", omit if not)
- detail: additional context (omit if not needed)
Only return valid JSON, no other text.`;

export async function parseTranscript(transcript: string): Promise<ParsedEntry[]> {
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
  const content = data.choices?.[0]?.message?.content ?? '[]';

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ParsedEntry[];
  } catch {
    return [{ category: 'note', title: transcript }];
  }
}
