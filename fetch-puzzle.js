import fs from "fs/promises";
import https from "https";

// Utility to fetch JSON from URL (Promise wrapper for https.get)
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function fetchPuzzle() {
  try {
    // Replace this URL with your actual puzzle API endpoint
    const url = "https://api.example.com/todays-puzzle";

    console.log(`Fetching puzzle from ${url}...`);
    const response = await fetchJson(url);

    if (
      !response.body ||
      !Array.isArray(response.body) ||
      response.body.length === 0
    ) {
      throw new Error("API response missing puzzle body");
    }

    const puzzle = response.body[0]; // first item in the array
    const { dimensions, board, cells, clues, clueLists } = puzzle;

    if (!dimensions || !dimensions.width || !dimensions.height) {
      throw new Error("Puzzle dimensions missing");
    }

    // Create a folder for storing puzzles if it doesn't exist
    await fs.mkdir("./data/puzzles", { recursive: true });

    // Format filename with today's date: e.g. 2025-09-21.json
    const today = new Date().toISOString().slice(0, 10);
    const filename = `./data/puzzles/${today}.json`;

    // Save the entire puzzle object to file
    await fs.writeFile(filename, JSON.stringify(puzzle, null, 2), "utf8");

    console.log(`Puzzle saved to ${filename}`);
    console.log(`Dimensions: ${dimensions.width} x ${dimensions.height}`);
  } catch (error) {
    console.error("Error fetching puzzle:", error.message);
  }
}

// Run the fetch
fetchPuzzle();
