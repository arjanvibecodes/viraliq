import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse, connection } from "next/server";

export interface VideoData {
  topic: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    const apiKey = process.env.VIRALIQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "VIRALIQ_API_KEY is not set in .env.local" }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    const { videos }: { videos: VideoData[] } = await request.json();

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: "No video data provided" }, { status: 400 });
    }

    const videoTable = videos
      .map(
        (v, i) =>
          `${i + 1}. Topic/Hook: "${v.topic}" | Views: ${v.views.toLocaleString()} | Likes: ${v.likes.toLocaleString()} | Comments: ${v.comments.toLocaleString()} | Shares: ${v.shares.toLocaleString()} | Watch Time: ${v.watchTime}%`
      )
      .join("\n");

    const prompt = `You are an expert TikTok content strategist. Analyze the following video performance data and provide a detailed, actionable content strategy report.

VIDEO PERFORMANCE DATA:
${videoTable}

Provide your analysis in the following exact JSON format. Be specific, data-driven, and actionable. Reference actual video topics and numbers from the data:

{
  "topPerformers": {
    "title": "Top Performing Videos",
    "icon": "🏆",
    "content": "Identify the 2-3 best performing videos (by engagement rate = (likes+comments+shares)/views * 100 and watch time). Explain specifically WHY they worked — what made the hook compelling, what theme resonated, what emotional trigger was hit."
  },
  "hookStyle": {
    "title": "Your Winning Hook Style",
    "icon": "🎣",
    "content": "Identify the hook pattern that gets the most views and watch time. Is it question-based, controversy, relatable situation, bold claim? Give 2-3 specific examples from their data and the exact pattern they should replicate."
  },
  "contentThemes": {
    "title": "Content Themes Driving Engagement",
    "icon": "🎯",
    "content": "Identify the 2-3 content themes or topics generating the most comments and shares. Explain why these themes are working for this creator's audience and what underlying audience desire each theme is tapping into."
  },
  "nextVideos": {
    "title": "Your Next 3 Video Ideas",
    "icon": "💡",
    "content": "Based on their best performers, provide 3 specific video ideas with suggested hooks. Format as: 1) [Hook idea] — [Why this will work based on their data]. 2) [Hook idea] — [Why]. 3) [Hook idea] — [Why]."
  },
  "postingPattern": {
    "title": "Optimal Posting Pattern",
    "icon": "📅",
    "content": "Based on the engagement distribution across their videos, recommend a posting frequency and consistency strategy. If data suggests certain content types perform better when spaced out vs posted close together, note that. Focus on quality signals from the data."
  },
  "stopDoing": {
    "title": "One Thing To Stop Immediately",
    "icon": "🚫",
    "content": "Identify the clearest pattern in their worst-performing videos. What hook style, topic, or format is consistently underperforming? Be direct and specific — name the exact thing they should stop doing and why the data shows it's not working for their audience."
  }
}

Return ONLY valid JSON, no markdown, no additional text.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse Claude response as JSON");
      }
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
