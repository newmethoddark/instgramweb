import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReel = async () => {
    if (!url) return alert("Please enter a reel link!");
    setLoading(true);
    setResult(null);

    const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>🎥 Instagram Reels Downloader</h1>
      <input
        type="text"
        placeholder="Paste Instagram Reel link..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={fetchReel} disabled={loading}>
        {loading ? "Fetching..." : "Download"}
      </button>

      {result && result.success && (
        <div className="output">
          <video src={result.videoUrl} controls width="300" />
          <h3>📜 Caption:</h3>
          <p>{result.caption}</p>
          <h3>🏷️ Hashtags:</h3>
          <p>{result.hashtags.join(" ")}</p>
          <a href={result.videoUrl} download>
            ⬇️ Download Video
          </a>
        </div>
      )}

      <style jsx>{`
        .container {
          text-align: center;
          padding: 40px;
          font-family: Arial, sans-serif;
        }
        input {
          width: 80%;
          padding: 10px;
          margin: 10px;
          border: 2px solid #ccc;
          border-radius: 8px;
        }
        button {
          padding: 10px 20px;
          background: #ff3e6c;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .output {
          margin-top: 20px;
        }
        video {
          margin-top: 10px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
          }
