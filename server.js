const http = require("http");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const { exec } = require("child_process");

// Configuration
const PORT = 8080;
const ROOT_FILES = ["index.html", "styles.css"];
const WATCH_DIRS = [path.join(__dirname, "src"), ...ROOT_FILES];

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
    const filePath =
        req.url === "/"
            ? path.join(__dirname, "index.html")
            : path.join(__dirname, req.url);

    if (req.url === "/livereload.js") {
        // Serve WebSocket client script
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(`
      const socket = new WebSocket('ws://localhost:${PORT}');
      socket.onmessage = (event) => {
        if (event.data === 'reload') {
          window.location.reload();
        }
      };
    `);
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("404: File Not Found");
        } else {
            res.writeHead(200, { "Content-Type": getContentType(filePath) });
            res.end(data);
        }
    });
});

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".html":
            return "text/html";
        case ".js":
            return "application/javascript";
        case ".css":
            return "text/css";
        default:
            return "text/plain";
    }
}

// Set up WebSocket server for live reload
const wss = new WebSocket.Server({ server });
wss.on("connection", (ws) => {
    console.log("Browser connected");
});

chokidar.watch(WATCH_DIRS).on("change", (file) => {
    console.log(`${file} changed. Rebuilding...`);
    runBuild();
});

function runBuild() {
    exec("npm run build", (err, stdout, stderr) => {
        if (err) {
            console.error(`Build failed: ${stderr}`);
            return;
        }
        clearConsole();
        console.log(`Build successful:\n${stdout}`);
        reloadBrowser();
    });
}

function reloadBrowser() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send("reload");
        }
    });
}

function clearConsole() {
    process.stdout.write("\x1Bc");
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
