import fs from "fs";
import path from "path";
import Parser from "rss-parser";

const DATA_DIR = "./data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const OUTPUT_FILE = path.join(DATA_DIR, "articles.json");

const RSS_FEEDS = [
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://www.theguardian.com/world/rss",
  // add more feeds if needed
];

const MAX_ARTICLES = 50; // max total articles to fetch

export async function fetchArticles() {
  const parser = new Parser();
  const allArticles = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      feed.items.forEach(item => {
        if (allArticles.length >= MAX_ARTICLES) return;
        allArticles.push({
          id: item.guid || item.link,
          title: item.title || "(no title)",
          content: item.contentSnippet || item.content || "",
          url: item.link || "",
          publishedAt: item.pubDate || null,
        });
      });
    } catch (err) {
      console.warn(`Failed to fetch feed ${feedUrl}: ${err.message}`);
    }
  }

  // save JSON
  const output = { articles: allArticles.slice(0, MAX_ARTICLES) };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Saved ${output.articles.length} articles to ${OUTPUT_FILE}`);
}