import express from "express";
import cors from "cors";
import {XMLParser} from "fast-xml-parser";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({status: "Vechura backend running"});
});

app.get("/villiers", async (_req, res) => {
  try {
    const response = await fetch(
      "https://api.villiers.ai/feeds/empty-legs?id=10228"
    );

    const xml = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    const data = parser.parse(xml);
    const items = data?.rss?.channel?.item ?? [];

    res.setHeader("Cache-Control", "s-maxage=600");
    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: "Villiers fetch failed"});
  }
});

export default app;
