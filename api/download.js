import chromium from "chrome-aws-lambda";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes("instagram.com/reel")) {
    return res.status(400).json({ error: "Invalid Reel URL" });
  }

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const data = await page.evaluate(() => {
      const caption = document.querySelector("meta[property='og:description']")?.content || "";
      const videoUrl = document.querySelector("meta[property='og:video']")?.content || "";
      return { caption, videoUrl };
    });

    await browser.close();

    const hashtags = data.caption.match(/#[\w]+/g) || [];
    res.status(200).json({
      success: true,
      videoUrl: data.videoUrl,
      caption: data.caption,
      hashtags: hashtags,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch reel details" });
  }
      }
