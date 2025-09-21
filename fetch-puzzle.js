const fs = require("fs");
const https = require("https");
const path = require("path");

// Get today's date in YYYY-MM-DD
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const dateString = `${yyyy}-${mm}-${dd}`;

const outputPath = `data/puzzles/${dateString}.js`;
const url = "https://www.nytimes.com/svc/crosswords/v6/puzzle/mini.json";

https
  .get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const json = JSON.parse(data);
      const body = json.body;

      const { dimensions, cells, clues, clueLists, answers } = body;
      const width = dimensions.cols;
      const height = dimensions.rows;

      // Build puzzle grid
      const puzzle = [];
      for (let r = 0; r < height; r++) {
        const row = [];
        for (let c = 0; c < width; c++) {
          const i = r * width + c;
          const cell = cells[i];
          row.push(cell.answer || "_");
        }
        puzzle.push(row);
      }

      // Build clue objects
      const makeClue = (text, answer, start, number, direction) => {
        return {
          text,
          answer,
          start,
          length: answer.length,
          number,
          direction,
        };
      };

      const clueData = { across: {}, down: {} };

      for (const dir of ["across", "down"]) {
        for (const clue of clueLists[dir]) {
          const clueText = clues[clue];
          const [num, direction] = clue.split(/-/);
          const answerInfo = answers[clue];

          if (!clueText || !answerInfo) continue;

          const answer = answerInfo.answer;
          const start = answerInfo.position;

          clueData[dir][parseInt(num)] = makeClue(
            clueText,
            answer,
            start,
            parseInt(num),
            dir
          );
        }
      }

      const fileContent = `
// NYT Mini Puzzle for ${dateString}
export const puzzle = ${JSON.stringify(puzzle, null, 2)};

export function makeClue(text, answer, start, number, direction) {
  return {
    text,
    answer,
    start,
    length: answer.length,
    number,
    direction,
  };
}

export const clues = ${JSON.stringify(clueData, null, 2)};
`;

      // Ensure the output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Skip if file already exists
      if (fs.existsSync(outputPath)) {
        console.log(`🟡 Puzzle for ${dateString} already exists.`);
        return;
      }

      fs.writeFileSync(outputPath, fileContent.trim());
      console.log(`✅ Puzzle saved to ${outputPath}`);
    });
  })
  .on("error", (err) => {
    console.error("Error fetching puzzle:", err.message);
  });
