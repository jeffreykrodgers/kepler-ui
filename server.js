import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

// __dirname is not defined in ES modules; compute it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create a livereload server that watches the pub folder
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "pub"));

// Inject the livereload script into your served HTML pages
app.use(connectLivereload());

// Serve static files from the "pub" folder
app.use(express.static(path.join(__dirname, "pub")));

app.use("/dist", express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "pub")));

// For SPA routing, redirect all unmatched routes to index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "pub", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Dev server is running at http://localhost:${PORT}`);
});
