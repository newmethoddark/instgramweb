import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  try {
    const { url } = req.body || {};
    if (!url || !url.includes("instagram.com")) {
      return res.status(400).json({ ok: false, error: "Invalid Instagram URL" });
    }

    // Temporary file for output
    const tmpPath = path.join("/tmp", "insta.json");

    const ytdlp = spawn("yt-dlp", [
      "-j",
      "--no-warnings",
      "--dump-single-json",
      url
    ]);

    let output = "";
    ytdlp.stdout.on("data", (d) => (output += d.toString()));
    ytdlp.stderr.on("data", (d) => console.error(d.toString()));

    ytdlp.on("close", () => {
      try {
        const info = JSON.parse(output);
        const caption = info.description || "";
        const hashtags = [...new Set(caption.match(/#\\w+/g) || [])];
        const videoUrl = info.url || (info.formats?.find(f => f.ext === "mp4" && f.vcodec !== "none")?.url);

        res.status(200).json({
          ok: true,
          caption,
          hashtags,
          video_url: videoUrl
        });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
  }
