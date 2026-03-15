import { NextRequest, NextResponse } from "next/server";
import type { VoiceRidePayload } from "@/lib/types";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const GOOGLE_STUDIO_API_KEY = process.env.GOOGLE_STUDIO_API_KEY;

/** Run ElevenLabs Speech-to-Text on the audio file. */
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  const formData = new FormData();
  formData.append("model_id", "scribe_v2");
  formData.append("file", audioBlob, "audio.webm");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs STT failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { text?: string };
  const text = data?.text?.trim();
  if (!text) {
    throw new Error("No transcript text in ElevenLabs response");
  }
  return text;
}

/** Fallback: parse transcript with simple regex/heuristics when Gemini is over quota or fails. */
function parseTranscriptFallback(transcript: string): VoiceRidePayload {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const lower = transcript.toLowerCase();

  let startLocation = "";
  let destination = "";
  const fromTo = /(?:create\s+a?\s*ride\s+)?(?:from\s+)?(.+?)\s+to\s+(.+?)(?:\s+(?:tomorrow|today|at|\d|and|with|have|seat)|$)/i.exec(transcript);
  if (fromTo) {
    startLocation = fromTo[1].trim().replace(/\s+/g, " ");
    destination = fromTo[2].trim().replace(/\s+/g, " ");
  }

  let date = todayStr;
  if (/\btomorrow\b/.test(lower)) {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    date = t.toISOString().slice(0, 10);
  }

  let time = "12:00";
  const atTime = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(transcript);
  if (atTime) {
    let h = parseInt(atTime[1], 10);
    const m = atTime[2] ? parseInt(atTime[2], 10) : 0;
    const pm = (atTime[3] || "").toLowerCase() === "pm";
    const am = (atTime[3] || "").toLowerCase() === "am";
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    if (!pm && !am && h <= 12) h = h < 9 ? h + 12 : h;
    time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  let availableSeats = 2;
  const seatsMatch = /(?:have|with)\s*(\d+)\s*seat/i.exec(transcript) ?? /(\d+)\s*seat/i.exec(transcript);
  if (seatsMatch) availableSeats = Math.min(10, Math.max(1, parseInt(seatsMatch[1], 10)));
  const totalSeats = Math.max(availableSeats, 3);

  return {
    startLocation: startLocation || "Start location",
    destination: destination || "Destination",
    date,
    time,
    note: undefined,
    price: 0,
    availableSeats,
    totalSeats,
  };
}

/** Use Google AI (Gemini) to parse natural language into structured ride fields. On quota/error, use fallback. */
async function parseTranscriptToRide(transcript: string): Promise<VoiceRidePayload> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (!GOOGLE_STUDIO_API_KEY) {
    console.log("[voice] No GOOGLE_STUDIO_API_KEY – using fallback parser");
    return parseTranscriptFallback(transcript);
  }

  console.log("transcript: ", transcript)

  const prompt = `You are a parser for a ride-sharing app. Extract ride details from the user's message. Today's date is ${todayStr}.

User message: "${transcript}"

Return ONLY a single JSON object with these exact keys (no markdown, no code block):
- startLocation (string): pickup/start place, e.g. "Main Campus", "Campus Main Gate"
- destination (string): destination, e.g. "Walmart", "Airport"
- date (string): YYYY-MM-DD. Interpret relative dates: "tomorrow" = next calendar day, "next Monday" = that Monday's date
- time (string): 24-hour HH:mm, e.g. "14:00" for 2pm, "09:00" for 9am
- note (string, optional): any extra details or empty string
- price (number): 0 if free or not mentioned
- availableSeats (number): seats available for riders, default 2 if not clear
- totalSeats (number): total seats in car, must be >= availableSeats, default 3 if not clear

If something is unclear, use sensible defaults. Output only the JSON object.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GOOGLE_STUDIO_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log("text: ", text)
    if (text) {
      console.log("text: ", text)
      const rawJson = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      try {
        const p = JSON.parse(rawJson) as Record<string, unknown>;
        return {
          startLocation: typeof p.startLocation === "string" ? p.startLocation : "",
          destination: typeof p.destination === "string" ? p.destination : "",
          date: typeof p.date === "string" ? p.date : todayStr,
          time: typeof p.time === "string" ? p.time : "12:00",
          note: typeof p.note === "string" ? p.note || undefined : undefined,
          price: Math.max(0, typeof p.price === "number" ? p.price : Number(p.price) || 0),
          availableSeats: Math.max(0, Number(p.availableSeats) || 2),
          totalSeats: Math.max(1, Number(p.totalSeats) || Math.max(3, Number(p.availableSeats) || 2)),
        };
      } catch {
        console.log("[voice] Gemini returned 200 but no valid JSON – using fallback");
      }
    }
  } else {
    const errBody = await res.text();
    console.log(`[voice] Gemini failed ${res.status} – using fallback. Response: ${errBody.slice(0, 200)}`);
  }
  return parseTranscriptFallback(transcript);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as Blob | null;
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing or invalid 'audio' file in form data" },
        { status: 400 }
      );
    }

    const transcript = await transcribeAudio(file);
    const ride = await parseTranscriptToRide(transcript);
    return NextResponse.json({ transcript, ride });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Voice processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
