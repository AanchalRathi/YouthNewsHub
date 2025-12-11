import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 5000;

// 🔑 Replace with your actual GNews API key
const API_KEY = "6091fdfb0afb1f1f52fc9dd7307d0267";
const BASE_URL = "https://gnews.io/api/v4/top-headlines";

app.use(cors());

app.get("/news", async (req, res) => {
  const { q = "", lang = "en", country = "in" } = req.query;

  try {
    // Construct GNews URL
    const url = `${BASE_URL}?token=${API_KEY}&lang=${lang}&country=${country}&q=${encodeURIComponent(q)}&max=20`;
    console.log("🔍 Fetching from GNews:", url);

    // Fetch from GNews
    const response = await fetch(url);
    const data = await response.json();

    // Transform data to match your frontend format
    const articles = (data.articles || []).map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.image || "",
    }));

    res.json({ status: "ok", articles });
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`);
});
