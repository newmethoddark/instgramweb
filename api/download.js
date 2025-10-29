const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || !url.includes('instagram.com')) {
    return res.status(400).json({ error: 'Invalid Instagram URL' });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const videoUrl = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? video.src : null;
    });

    const postData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const jsonScript = scripts.find(script => script.textContent.includes('window._sharedData'));
      if (jsonScript) {
        try {
          const data = JSON.parse(jsonScript.textContent.match(/window\._sharedData\s*=\s*({.+});/)[1]);
          const media = data.entry_data.PostPage[0].graphql.shortcode_media;
          const caption = media.edge_media_to_caption.edges[0]?.node.text || 'No caption available';
          const hashtags = caption.match(/#\w+/g) || [];
          return { caption, hashtags };
        } catch {
          return { caption: 'Caption not found', hashtags: [] };
        }
      }
      return { caption: 'Not found', hashtags: [] };
    });

    await browser.close();

    if (videoUrl) {
      res.status(200).json({
        downloadUrl: videoUrl,
        caption: postData.caption,
        hashtags: postData.hashtags
      });
    } else {
      res.status(400).json({ error: 'Video not found or inaccessible' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error - try again later' });
  }
};
