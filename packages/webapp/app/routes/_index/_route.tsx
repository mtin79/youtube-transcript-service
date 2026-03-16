import { useState } from "react";
import { useFetcher } from "react-router";

const MODELS = [
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (default)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (most accurate)" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (advanced)" },
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite (fastest)" },
];

export default function Index() {
  const fetcher = useFetcher();
  const [showOptions, setShowOptions] = useState(false);

  const isLoading = fetcher.state !== "idle";
  const data = fetcher.data as any;
  const hasResult = data?.transcript;
  const hasError = data?.error;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            YouTube Transcript
          </h1>
          <p className="mt-2 text-zinc-400">
            Extract full transcripts from YouTube videos using Gemini AI
          </p>
        </div>

        {/* Form */}
        <fetcher.Form
          method="post"
          action="/resources/transcribe"
          className="space-y-4"
        >
          {/* URL Input */}
          <div className="flex gap-2">
            <input
              type="text"
              name="url"
              placeholder="Paste a YouTube URL or video ID..."
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Transcribing..." : "Transcribe"}
            </button>
          </div>

          {/* Options Toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {showOptions ? "▼ Hide options" : "▶ Show options"}
          </button>

          {/* Options Panel */}
          {showOptions && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              {/* Language */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Language
                </label>
                <input
                  type="text"
                  name="lang"
                  defaultValue="en"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Model
                </label>
                <select
                  name="model"
                  defaultValue="gemini-3-flash-preview"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timestamps */}
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="timestamps"
                  value="true"
                  defaultChecked
                  className="rounded border-zinc-600"
                />
                Include timestamps
              </label>

              {/* Speakers */}
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="speakers"
                  value="true"
                  className="rounded border-zinc-600"
                />
                Speaker identification
              </label>

              {/* Clip Start */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Start offset (seconds)
                </label>
                <input
                  type="number"
                  name="startOffset"
                  min="0"
                  placeholder="0"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500"
                />
              </div>

              {/* Clip End */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  End offset (seconds)
                </label>
                <input
                  type="number"
                  name="endOffset"
                  min="0"
                  placeholder="end"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}
        </fetcher.Form>

        {/* Error */}
        {hasError && (
          <div className="mt-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-300">
            {data.error}
          </div>
        )}

        {/* Result */}
        {hasResult && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Transcript</h2>
                {data.usage && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                    {data.usage.totalTokens.toLocaleString()} tokens
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(data.transcript)}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Copy
              </button>
            </div>

            <pre className="max-h-[60vh] overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {data.transcript}
            </pre>

            <p className="text-xs text-zinc-500">
              Video: {data.videoUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
