import cors from "cors";
import express from "express";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { deleteLandingPage, getLandingPages, HttpError, normalizeSlug, updateLandingPage, upsertLandingPage, } from "./landing-pages.js";
const loadEnvFile = () => {
    const envPath = resolve(process.cwd(), ".env");
    if (!existsSync(envPath)) {
        return;
    }
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex === -1) {
            continue;
        }
        const key = trimmed.slice(0, equalsIndex).trim();
        const value = trimmed
            .slice(equalsIndex + 1)
            .trim()
            .replace(/^['"]|['"]$/g, "");
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
};
const asyncHandler = (handler) => (req, res, next) => {
    handler(req, res).catch(next);
};
loadEnvFile();
const app = express();
const port = Number(process.env.PORT || 5000);
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.get("/api", (_req, res) => {
    res.json({ status: "Vechura backend running" });
});
app.get("/api/villiers", asyncHandler(async (_req, res) => {
    const response = await fetch("https://api.villiers.ai/feeds/empty-legs?id=10228");
    const xml = await response.text();
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
    });
    const data = parser.parse(xml);
    res.setHeader("Cache-Control", "s-maxage=600");
    res.json(data?.rss?.channel?.item ?? []);
}));
app.get("/api/create-landing-page", asyncHandler(async (_req, res) => {
    res.json(await getLandingPages());
}));
app.post("/api/create-landing-page", asyncHandler(async (req, res) => {
    const slug = normalizeSlug(req.body.slug);
    const previousSlug = normalizeSlug(req.body.previousSlug);
    const id = typeof req.body.id === "string" ? req.body.id.trim() : undefined;
    if (!slug || !req.body.data) {
        res.status(400).json({ error: "POST requires slug and data." });
        return;
    }
    const row = await upsertLandingPage(slug, previousSlug, req.body.data, id);
    res.json({ ok: true, slug, row });
}));
app.patch("/api/create-landing-page", asyncHandler(async (req, res) => {
    const slug = normalizeSlug(req.body.slug);
    const previousSlug = normalizeSlug(req.body.previousSlug);
    const id = typeof req.body.id === "string" ? req.body.id.trim() : undefined;
    if (!slug || !req.body.data) {
        res.status(400).json({ error: "PATCH requires slug and data." });
        return;
    }
    const row = await updateLandingPage(slug, previousSlug, req.body.data, id);
    res.json({ ok: true, slug, row });
}));
app.put("/api/create-landing-page", asyncHandler(async (req, res) => {
    const slug = normalizeSlug(req.body.slug);
    const previousSlug = normalizeSlug(req.body.previousSlug);
    const id = typeof req.body.id === "string" ? req.body.id.trim() : undefined;
    if (!slug || !req.body.data) {
        res.status(400).json({ error: "PUT requires slug and data." });
        return;
    }
    const row = await updateLandingPage(slug, previousSlug, req.body.data, id);
    res.json({ ok: true, slug, row });
}));
app.delete("/api/create-landing-page", asyncHandler(async (req, res) => {
    const slug = normalizeSlug(req.query.slug);
    if (!slug) {
        res.status(400).json({ error: "DELETE requires a slug query parameter." });
        return;
    }
    await deleteLandingPage(slug);
    res.json({ ok: true, slug });
}));
app.use((error, _req, res, _next) => {
    console.error("API error:", error);
    res.status(error instanceof HttpError ? error.status : 500).json({
        error: "API failed.",
        details: error instanceof Error ? error.message : error,
    });
});
app.listen(port, () => {
    console.log(`Vechura backend running at http://localhost:${port}`);
});
