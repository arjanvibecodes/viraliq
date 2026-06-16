import { NextRequest, NextResponse, connection } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  await connection();
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const entry = { email: email.trim().toLowerCase(), createdAt: new Date().toISOString() };

    // Try writing to project root (works locally), fall back to /tmp (Vercel)
    const paths = [
      path.join(process.cwd(), "emails.json"),
      "/tmp/emails.json",
    ];

    for (const filePath of paths) {
      try {
        let existing: { email: string; createdAt: string }[] = [];
        if (fs.existsSync(filePath)) {
          existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }
        // Avoid duplicates
        if (!existing.find((e) => e.email === entry.email)) {
          existing.push(entry);
          fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
        }
        console.log(`Email collected: ${entry.email}`);
        break;
      } catch {
        continue;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email collection error:", error);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
