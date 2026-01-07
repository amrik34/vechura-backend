import type {VercelRequest, VercelResponse} from "@vercel/node";
import {XMLParser} from "fast-xml-parser";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch(
      "https://api.villiers.ai/feeds/empty-legs?id=10228"
    );

    if (!response.ok) {
      throw new Error("Villiers API request failed");
    }

    const xml = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    const data = parser.parse(xml);

    const items = data?.rss?.channel?.item || data?.feed?.entry || [];

    res.setHeader("Cache-Control", "s-maxage=600");
    res.status(200).json(items);
  } catch (error) {
    console.error("Villiers error:", error);
    res.status(500).json({error: "Failed to fetch Villiers data"});
  }
}
