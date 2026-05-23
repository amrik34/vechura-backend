import { getLandingPages, HttpError, normalizeSlug, deleteLandingPage, updateLandingPage, upsertLandingPage, } from "../src/landing-pages";
const setCorsHeaders = (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};
const jsonError = (res, status, message, details) => {
    res.status(status).json({ error: message, details });
};
const readBody = (req) => {
    if (!req.body) {
        return {};
    }
    if (typeof req.body === "string") {
        return JSON.parse(req.body);
    }
    return req.body;
};
export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }
    try {
        if (req.method === "GET") {
            res.status(200).json(await getLandingPages());
            return;
        }
        if (req.method === "POST") {
            const body = readBody(req);
            const slug = normalizeSlug(body.slug);
            const previousSlug = normalizeSlug(body.previousSlug);
            const id = typeof body.id === "string" ? body.id.trim() : undefined;
            if (!slug || !body.data) {
                jsonError(res, 400, "POST requires slug and data.");
                return;
            }
            const row = await upsertLandingPage(slug, previousSlug, body.data, id);
            res.status(200).json({ ok: true, slug, row });
            return;
        }
        if (req.method === "PUT" || req.method === "PATCH") {
            const body = readBody(req);
            const slug = normalizeSlug(body.slug);
            const previousSlug = normalizeSlug(body.previousSlug);
            const id = typeof body.id === "string" ? body.id.trim() : undefined;
            if (!slug || !body.data) {
                jsonError(res, 400, `${req.method} requires slug and data.`);
                return;
            }
            const row = await updateLandingPage(slug, previousSlug, body.data, id);
            res.status(200).json({ ok: true, slug, row });
            return;
        }
        if (req.method === "DELETE") {
            const slug = normalizeSlug(req.query.slug);
            if (!slug) {
                jsonError(res, 400, "DELETE requires a slug query parameter.");
                return;
            }
            await deleteLandingPage(slug);
            res.status(200).json({ ok: true, slug });
            return;
        }
        res.setHeader("Allow", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        jsonError(res, 405, `Method ${req.method} is not allowed.`);
    }
    catch (error) {
        console.error("Landing page API error:", error);
        jsonError(res, error instanceof HttpError ? error.status : 500, "Landing page API failed.", error instanceof Error ? error.message : error);
    }
}
