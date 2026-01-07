import type {VercelRequest, VercelResponse} from "@vercel/node";
import {XMLParser} from "fast-xml-parser";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  // ✅ CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (_req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

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
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Failed to fetch Villiers data"});
  }
}
