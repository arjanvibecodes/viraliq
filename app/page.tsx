"use client";

import { useState, useCallback, useEffect } from "react";

interface VideoRow {
  id: number;
  topic: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  watchTime: string;
}

interface AnalysisSection {
  title: string;
  icon: string;
  content: string;
}

interface Analysis {
  topPerformers: AnalysisSection;
  hookStyle: AnalysisSection;
  contentThemes: AnalysisSection;
  nextVideos: AnalysisSection;
  postingPattern: AnalysisSection;
  stopDoing: AnalysisSection;
}

const SAMPLE_DATA: Omit<VideoRow, "id">[] = [
  { topic: "POV: I quit my 9-5 to go full-time creator", views: "284000", likes: "22100", comments: "1840", shares: "3200", watchTime: "68" },
  { topic: "5 things I wish I knew before starting TikTok", views: "156000", likes: "14200", comments: "980", shares: "2100", watchTime: "74" },
  { topic: "What my first $10k month actually looked like", views: "420000", likes: "38500", comments: "3200", shares: "5800", watchTime: "71" },
  { topic: "Rating my old videos (they're embarrassing)", views: "92000", likes: "7400", comments: "620", shares: "410", watchTime: "81" },
  { topic: "Day in the life of a creator — unfiltered", views: "67000", likes: "5100", comments: "340", shares: "280", watchTime: "52" },
  { topic: "The algorithm is broken and here's proof", views: "512000", likes: "41000", comments: "4800", shares: "9200", watchTime: "65" },
  { topic: "Answering your most asked questions", views: "44000", likes: "2900", comments: "180", shares: "90", watchTime: "38" },
  { topic: "I tried posting 3x a day for 30 days", views: "198000", likes: "17600", comments: "1440", shares: "2900", watchTime: "77" },
  { topic: "Honest review: creator economy in 2024", views: "88000", likes: "7100", comments: "520", shares: "610", watchTime: "61" },
  { topic: "How I hit 100k followers in 4 months", views: "634000", likes: "54200", comments: "5100", shares: "11400", watchTime: "73" },
  { topic: "My weekly content planning routine", views: "38000", likes: "2200", comments: "140", shares: "80", watchTime: "44" },
  { topic: "Things successful TikTokers do differently", views: "277000", likes: "23800", comments: "1960", shares: "4100", watchTime: "69" },
];

function createEmptyRow(id: number): VideoRow {
  return { id, topic: "", views: "", likes: "", comments: "", shares: "", watchTime: "" };
}

const INITIAL_ROWS = 5;

export default function Home() {
  const [rows, setRows] = useState<VideoRow[]>(
    Array.from({ length: INITIAL_ROWS }, (_, i) => createEmptyRow(i + 1))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(INITIAL_ROWS + 1);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasUnlimitedAccess(localStorage.getItem("viraliq_access") === "true");
    }
  }, []);

  const updateRow = useCallback((id: number, field: keyof Omit<VideoRow, "id">, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }, []);

  const addRow = useCallback(() => {
    if (rows.length >= 20) return;
    setRows((prev) => [...prev, createEmptyRow(nextId)]);
    setNextId((n) => n + 1);
  }, [rows.length, nextId]);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  const loadSampleData = useCallback(() => {
    const sampleRows = SAMPLE_DATA.map((d, i) => ({ ...d, id: i + 1 }));
    setRows(sampleRows);
    setNextId(sampleRows.length + 1);
    setAnalysis(null);
    setError(null);
  }, []);

  const runAnalysis = useCallback(async () => {
    const filledRows = rows.filter((r) => r.topic.trim() && r.views);

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const videos = filledRows.map((r) => ({
        topic: r.topic.trim(),
        views: Number(r.views) || 0,
        likes: Number(r.likes) || 0,
        comments: Number(r.comments) || 0,
        shares: Number(r.shares) || 0,
        watchTime: Number(r.watchTime) || 0,
      }));

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
      setAnalysisCount((c) => c + 1);

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [rows]);

  const handleAnalyse = useCallback(() => {
    const filledRows = rows.filter((r) => r.topic.trim() && r.views);
    if (filledRows.length < 3) {
      setError("Please enter at least 3 videos to get a meaningful analysis.");
      return;
    }
    // First analysis is always free; subsequent ones require email
    if (analysisCount >= 1 && !hasUnlimitedAccess) {
      setShowModal(true);
      return;
    }
    runAnalysis();
  }, [rows, analysisCount, hasUnlimitedAccess, runAnalysis]);

  const unlockAccess = useCallback(() => {
    setHasUnlimitedAccess(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("viraliq_access", "true");
    }
  }, []);

  const filledCount = rows.filter((r) => r.topic.trim() && r.views).length;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--purple)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ⚡
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>ViralIQ</span>
        </div>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-dim)",
            background: "var(--surface-2)",
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid var(--border-subtle)",
          }}
        >
          Powered by Claude AI
        </span>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--purple)",
              background: "rgba(155, 92, 255, 0.1)",
              padding: "6px 14px",
              borderRadius: 20,
              marginBottom: 24,
              border: "1px solid rgba(155, 92, 255, 0.2)",
            }}
          >
            AI Content Strategist
          </div>
          <h1
            style={{
              fontSize: "clamp(36px, 5.5vw, 58px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              marginBottom: 24,
              background: "linear-gradient(135deg, #fff 40%, #9B5CFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Stop posting and praying.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "var(--text-dim)",
              maxWidth: 580,
              margin: "0 auto 16px",
              lineHeight: 1.65,
            }}
          >
            Most creators post and pray. ViralIQ reads your last 20 videos and tells you exactly what&apos;s working, what&apos;s not, and what to post next.
          </p>
          <p style={{ fontSize: 14, color: "var(--muted)", letterSpacing: "0.01em" }}>
            Paste your stats below — results in under 30 seconds.
          </p>
        </div>

        {/* Input Section */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          {/* Section header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Your Video Stats</h2>
              <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Enter data for your last 10–20 videos. Minimum 3 to analyse.
              </p>
            </div>
            <button
              onClick={loadSampleData}
              style={{
                background: "rgba(155, 92, 255, 0.1)",
                border: "1px solid rgba(155, 92, 255, 0.3)",
                color: "var(--purple)",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "rgba(155, 92, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "rgba(155, 92, 255, 0.1)";
              }}
            >
              ✨ Load sample data
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["#", "Video topic / hook", "Views", "Likes", "Comments", "Shares", "Watch time %", ""].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: i === 0 ? "12px 12px 12px 20px" : "12px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--text-dim)",
                        whiteSpace: "nowrap",
                        width: i === 0 ? 40 : i === 1 ? "auto" : i === 7 ? 40 : 90,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "8px 12px 8px 20px", color: "var(--text-dim)", fontSize: 13 }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder="e.g. POV: I quit my job to go full-time..."
                        value={row.topic}
                        onChange={(e) => updateRow(row.id, "topic", e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    {(["views", "likes", "comments", "shares", "watchTime"] as const).map((field) => (
                      <td key={field} style={{ padding: "8px 12px" }}>
                        <input
                          type="number"
                          placeholder={field === "watchTime" ? "72" : "0"}
                          value={row[field]}
                          onChange={(e) => updateRow(row.id, field, e.target.value)}
                          min={0}
                          max={field === "watchTime" ? 100 : undefined}
                          style={{ ...inputStyle, width: "100%" }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: "8px 12px 8px 8px", textAlign: "center" }}>
                      <button
                        onClick={() => removeRow(row.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--muted)",
                          cursor: "pointer",
                          fontSize: 16,
                          padding: "2px 6px",
                          borderRadius: 4,
                          lineHeight: 1,
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLButtonElement).style.color = "#ff5c5c";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLButtonElement).style.color = "var(--muted)";
                        }}
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <button
              onClick={addRow}
              disabled={rows.length >= 20}
              style={{
                background: "none",
                border: "1px dashed var(--border)",
                color: "var(--text-dim)",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                cursor: rows.length >= 20 ? "not-allowed" : "pointer",
                opacity: rows.length >= 20 ? 0.4 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (rows.length < 20)
                  (e.target as HTMLButtonElement).style.borderColor = "var(--purple)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
              }}
            >
              + Add row {rows.length >= 20 ? "(max 20)" : `(${rows.length}/20)`}
            </button>
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
              {filledCount} video{filledCount !== 1 ? "s" : ""} entered
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(255, 80, 80, 0.08)",
              border: "1px solid rgba(255, 80, 80, 0.25)",
              color: "#ff8080",
              padding: "14px 18px",
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Analyse button */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 60 }}>
          <button
            onClick={handleAnalyse}
            disabled={isLoading || filledCount < 3}
            style={{
              background: isLoading || filledCount < 3 ? "var(--surface-2)" : "var(--purple)",
              color: isLoading || filledCount < 3 ? "var(--text-dim)" : "#fff",
              border: "none",
              padding: "16px 40px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: isLoading || filledCount < 3 ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: isLoading || filledCount < 3 ? "none" : "0 0 30px rgba(155, 92, 255, 0.35)",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && filledCount >= 3) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--purple-dim)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 50px rgba(155, 92, 255, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && filledCount >= 3) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--purple)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(155, 92, 255, 0.35)";
              }
            }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                  }}
                  className="spin"
                />
                Analysing your content…
              </>
            ) : (
              <>⚡ Analyse My Content</>
            )}
          </button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="shimmer"
                style={{ height: 180, borderRadius: 14, border: "1px solid var(--border-subtle)" }}
              />
            ))}
          </div>
        )}

        {/* Results */}
        {analysis && !isLoading && (
          <div id="results" className="fade-in">
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  marginBottom: 8,
                }}
              >
                Your Content Strategy Report
              </h2>
              <p style={{ color: "var(--text-dim)", fontSize: 15 }}>
                Based on {filledCount} videos — here's exactly what the data says.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {Object.values(analysis).map((section: AnalysisSection, i) => (
                <AnalysisCard key={i} section={section} index={i} />
              ))}
            </div>

            {/* Beta banner */}
            <BetaBanner hasUnlimitedAccess={hasUnlimitedAccess} onUnlock={unlockAccess} />

            <div
              style={{
                textAlign: "center",
                marginTop: 24,
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
              }}
            >
              <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 16 }}>
                Want to re-analyse with updated data?
              </p>
              <button
                onClick={() => {
                  setAnalysis(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  padding: "10px 22px",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--purple)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--purple)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)";
                }}
              >
                ↑ Back to top
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Paywall Modal */}
      {showModal && (
        <PaywallModal
          onClose={() => setShowModal(false)}
          onUnlock={() => {
            unlockAccess();
            setShowModal(false);
            runAnalysis();
          }}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "20px 24px",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: 13,
        }}
      >
        ViralIQ — Built with Claude AI. Your data never leaves this session.
      </footer>
    </div>
  );
}

function AnalysisCard({ section, index }: { section: AnalysisSection; index: number }) {
  const isStopDoing = section.title?.toLowerCase().includes("stop");

  return (
    <div
      className="fade-in"
      style={{
        background: "var(--surface)",
        border: `1px solid ${isStopDoing ? "rgba(255, 80, 80, 0.2)" : "var(--border-subtle)"}`,
        borderRadius: 14,
        padding: "24px",
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!isStopDoing)
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
      onMouseLeave={(e) => {
        if (!isStopDoing)
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)";
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            fontSize: 22,
            lineHeight: 1,
            background: isStopDoing ? "rgba(255, 80, 80, 0.1)" : "rgba(155, 92, 255, 0.1)",
            padding: "8px",
            borderRadius: 8,
          }}
        >
          {section.icon}
        </span>
        <h3
          style={{
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.01em",
            color: isStopDoing ? "#ff8080" : "var(--text)",
          }}
        >
          {section.title}
        </h3>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: isStopDoing ? "rgba(255, 80, 80, 0.1)" : "var(--border-subtle)",
          marginBottom: 16,
        }}
      />

      {/* Content */}
      <CardContent content={section.content} isStopDoing={isStopDoing} />
    </div>
  );
}

function CardContent({ content, isStopDoing }: { content: string; isStopDoing: boolean }) {
  // Split into numbered items (1) ... 2) ... 3) ...) or regular paragraphs
  const numberedPattern = /(?:^|\n)(\d+\))\s+/;
  const hasNumberedItems = numberedPattern.test(content);

  if (hasNumberedItems) {
    const items = content
      .split(/\n?(\d+\))\s+/)
      .filter(Boolean)
      .reduce<string[]>((acc, part, i, arr) => {
        if (/^\d+\)$/.test(part)) {
          acc.push(part + " " + (arr[i + 1] || ""));
        } else if (!/^\d+\)$/.test(arr[i - 1] || "")) {
          acc.push(part);
        }
        return acc;
      }, []);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => {
          const isItem = /^\d+\)/.test(item);
          if (!isItem) {
            return (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#ccc", margin: 0 }}>
                {item.trim()}
              </p>
            );
          }
          const dashIdx = item.indexOf(" — ");
          const hook = dashIdx > -1 ? item.slice(0, dashIdx) : item;
          const why = dashIdx > -1 ? item.slice(dashIdx + 3) : null;
          return (
            <div
              key={i}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>
                {hook.trim()}
              </p>
              {why && (
                <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0, lineHeight: 1.6 }}>
                  {why.trim()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Regular content — split into paragraphs on double newline or sentence groups
  const paragraphs = content.split(/\n+/).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {paragraphs.map((para, i) => {
        // Highlight lines that start with "Theme" or a keyword marker
        const isHighlight = /^Theme \d|^The winning|^Stop|^Recommended/i.test(para);
        return (
          <p
            key={i}
            style={{
              fontSize: 14,
              lineHeight: 1.75,
              color: isHighlight ? "#e0e0e0" : "#aaa",
              fontWeight: isHighlight ? 600 : 400,
              margin: 0,
              paddingLeft: isHighlight ? 10 : 0,
              borderLeft: isHighlight
                ? `2px solid ${isStopDoing ? "rgba(255,80,80,0.4)" : "var(--purple)"}`
                : "none",
            }}
          >
            {para}
          </p>
        );
      })}
    </div>
  );
}

async function submitEmail(email: string): Promise<boolean> {
  try {
    const res = await fetch("/api/collect-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function PaywallModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const ok = await submitEmail(email);
    if (ok) {
      setStatus("success");
      setTimeout(() => onUnlock(), 1200);
    } else {
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="fade-in"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(155, 92, 255, 0.15)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(155, 92, 255, 0.15)",
            border: "1px solid rgba(155, 92, 255, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            margin: "0 auto 20px",
          }}
        >
          ⚡
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
          You&apos;ve used your free analysis
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 28 }}>
          ViralIQ is free during beta. Enter your email to unlock unlimited analyses — we&apos;ll let you know when we launch.
        </p>

        {status === "success" ? (
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--purple)" }}>
            You&apos;re in. Unlimited access unlocked 🔥
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{
                  flex: 1,
                  background: "var(--surface-2)",
                  border: `1px solid ${status === "error" ? "rgba(255,80,80,0.4)" : "var(--border)"}`,
                  color: "var(--text)",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={status === "loading"}
                style={{
                  background: "var(--purple)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: status === "loading" ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {status === "loading" ? "..." : "Unlock Access"}
              </button>
            </div>
            {status === "error" && (
              <p style={{ fontSize: 13, color: "#ff8080", marginBottom: 10 }}>
                Please enter a valid email address.
              </p>
            )}
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function BetaBanner({ hasUnlimitedAccess, onUnlock }: { hasUnlimitedAccess: boolean; onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (hasUnlimitedAccess && status !== "success") return null;

  const handleSubmit = async () => {
    if (!email.includes("@")) { setStatus("error"); return; }
    setStatus("loading");
    const ok = await submitEmail(email);
    if (ok) {
      setStatus("success");
      onUnlock();
    } else {
      setStatus("error");
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        marginTop: 32,
        padding: "28px 32px",
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(155,92,255,0.12) 0%, rgba(155,92,255,0.04) 100%)",
        border: "1px solid rgba(155, 92, 255, 0.25)",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.01em" }}>
          {status === "success"
            ? "You're in. Unlimited access unlocked 🔥"
            : "Like your strategy? Unlimited analyses are free during beta"}
        </p>
        {status !== "success" && (
          <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0 }}>
            Locks in at $10/month at launch — join free now.
          </p>
        )}
      </div>
      {status !== "success" && (
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${status === "error" ? "rgba(255,80,80,0.4)" : "rgba(155,92,255,0.3)"}`,
              color: "var(--text)",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              width: 200,
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={status === "loading"}
            style={{
              background: "var(--purple)",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: status === "loading" ? "wait" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status === "loading" ? "..." : "Get Unlimited Access"}
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid transparent",
  color: "var(--text)",
  padding: "7px 10px",
  borderRadius: 6,
  fontSize: 13,
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
  minWidth: 0,
};
