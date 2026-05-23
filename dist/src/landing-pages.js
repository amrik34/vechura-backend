export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
const getSupabaseConfig = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tableName = process.env.SUPABASE_LANDING_PAGES_TABLE || "landing_pages";
    if (!supabaseUrl) {
        throw new Error("Missing SUPABASE_URL");
    }
    if (!supabaseUrl.startsWith("https://")) {
        throw new Error("SUPABASE_URL must be your Supabase Project URL, for example https://your-project-ref.supabase.co. Do not use the Postgres connection string here.");
    }
    if (!serviceRoleKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }
    return {
        serviceRoleKey,
        tableName,
        supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    };
};
const getSupabaseRestUrl = (path = "") => {
    const { supabaseUrl, tableName } = getSupabaseConfig();
    return `${supabaseUrl}/rest/v1/${tableName}${path}`;
};
const getSupabaseHeaders = (prefer) => {
    const { serviceRoleKey } = getSupabaseConfig();
    const headers = {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
    };
    if (prefer) {
        headers.Prefer = prefer;
    }
    return headers;
};
export const normalizeSlug = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
export const getLandingPages = async () => {
    const response = await fetch(getSupabaseRestUrl("?select=id,slug,data&order=updated_at.desc"), {
        method: "GET",
        headers: getSupabaseHeaders(),
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    const rows = (await response.json());
    return rows.reduce((pages, row) => {
        if (row.slug) {
            pages[row.slug] = row.data;
        }
        return pages;
    }, {});
};
export const deleteLandingPage = async (slug) => {
    const response = await fetch(getSupabaseRestUrl(`?slug=eq.${encodeURIComponent(slug)}`), {
        method: "DELETE",
        headers: getSupabaseHeaders("return=minimal"),
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
};
export const upsertLandingPage = async (slug, previousSlug, data, id) => {
    if (previousSlug && previousSlug !== slug) {
        await deleteLandingPage(previousSlug);
    }
    const response = await fetch(getSupabaseRestUrl("?on_conflict=slug"), {
        method: "POST",
        headers: getSupabaseHeaders("resolution=merge-duplicates,return=representation"),
        body: JSON.stringify({
            ...(id ? { id } : {}),
            slug,
            data,
            updated_at: new Date().toISOString(),
        }),
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    const rows = (await response.json());
    return rows[0];
};
export const updateLandingPage = async (slug, previousSlug, data, id) => {
    const targetSlug = previousSlug || slug;
    const response = await fetch(getSupabaseRestUrl(`?slug=eq.${encodeURIComponent(targetSlug)}`), {
        method: "PATCH",
        headers: getSupabaseHeaders("return=representation"),
        body: JSON.stringify({
            ...(id ? { id } : {}),
            slug,
            data,
            updated_at: new Date().toISOString(),
        }),
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    const rows = (await response.json());
    if (!rows[0]) {
        throw new HttpError(404, `Landing page "${targetSlug}" was not found.`);
    }
    return rows[0];
};
