const fs = require("fs").promises;
const https = require("https");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "x-games-auth-bypass": "true",
      },
    };

    https
      .get(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Invalid JSON response"));
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchPuzzle() {
  try {
    const url = "https://www.nytimes.com/svc/crosswords/v6/puzzle/mini.json";
    console.log(`Fetching puzzle from ${url}...`);
    const response = await fetchJson(url);

    if (
      !response.body ||
      !Array.isArray(response.body) ||
      response.body.length === 0
    ) {
      throw new Error("API response missing puzzle body");
    }

    const puzzle = response.body[0];
    delete puzzle.board;
    delete puzzle.SVG;
    const { dimensions } = puzzle;

    if (!dimensions || !dimensions.width || !dimensions.height) {
      throw new Error("Puzzle dimensions missing");
    }

    await fs.mkdir("./data/puzzles", { recursive: true });

    const today = new Date().toISOString().slice(0, 10);
    const filename = `./data/puzzles/${today}.json`;

    await fs.writeFile(filename, JSON.stringify(puzzle, null, 2), "utf8");

    console.log(`Puzzle saved to ${filename}`);
    console.log(`Dimensions: ${dimensions.width} x ${dimensions.height}`);
  } catch (error) {
    console.error("Error fetching puzzle:", error.message);
  }
}

fetchPuzzle();
