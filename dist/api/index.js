export default function handler(_req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ status: "Vechura backend running" });
}
