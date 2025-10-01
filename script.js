let puzzle = [];
let puzzleCompleted = false;

let gridWidth = 0;
let gridHeight = 0;

// MODIFICATION: Added 'indices' to store the array of cell indices for the clue.
function makeClue(text, answer, start, number, direction, indices) {
  return {
    text: text,
    answer: answer,
    start: start,
    length: answer.length,
    number: number,
    direction: direction,
    indices: indices, // <--- ADDED
  };
}

let clues = { across: {}, down: {} };

let state = {
  activeCell: null,
  activeClue: null,
  activeClueIndex: 0,
  preferredClueDirection: "across",
};

function getTodayInEST() {
  const now = new Date();
  const estString = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = estString.split("/");
  return `${year}-${month}-${day}`;
}

async function loadPuzzle() {
  const today = getTodayInEST();
  const response = await fetch(`data/puzzles/${today}.json`);
  const data = await response.json();

  const { cells, dimensions, clues: clueArr } = data;
  gridWidth = dimensions.width;
  gridHeight = dimensions.height;

  puzzle = [];
  for (let r = 0; r < gridHeight; r++) {
    const row = [];
    for (let c = 0; c < gridWidth; c++) {
      // Corrected logic: Use 'type' property to correctly identify block cells
      const cell = cells[r * gridWidth + c];
      row.push(cell.type === 1 ? cell.answer || "" : "_");
    }
    puzzle.push(row);
  }

  clues = { across: {}, down: {} };
  clueArr.forEach((clue) => {
    const dir = clue.direction.toLowerCase();
    const answer = clue.cells.map((i) => cells[i].answer || "").join("");
    clues[dir][clue.label] = makeClue(
      clue.text[0].plain,
      answer,
      clue.cells[0],
      clue.label,
      dir,
      clue.cells // <--- PASSING INDICES
    );
  });
}

let cluesArr = [];

function getClue(direction) {
  const step = direction === "prior" ? -1 : 1;
  state.activeClueIndex =
    (state.activeClueIndex + step + cluesArr.length) % cluesArr.length;
  return cluesArr[state.activeClueIndex];
}

function buildCluesArr() {
  // Clearing cluesArr before building is a good practice if loadPuzzle could run multiple times
  cluesArr = [];
  Object.values(clues["across"]).forEach((clue) => cluesArr.push(clue));
  Object.values(clues["down"]).forEach((clue) => cluesArr.push(clue));
  state.activeClue = cluesArr[state.activeClueIndex];
}

function setActiveCell(cell) {
  if (!cell || cell.classList.contains("block")) return;
  removePrimaryStyle();
  cell.classList.add("active-primary");
  state.activeCell = cell;
}

// MODIFICATION: Uses the stored clue.indices instead of calculating cell position.
function findFirstBlankCellInClue(clue) {
  const puzzleDivs = document.getElementById("puzzle").children;

  for (const cellIndex of clue.indices) {
    const cellDiv = puzzleDivs[cellIndex];
    const cell = cellDiv.querySelector(".cell");
    if (cell && !cell.classList.contains("block")) {
      const currentText = cell.textContent.trim();
      if (currentText === "" || currentText === "_") {
        return cell;
      }
    }
  }

  // If no blank cells, return the first cell of the clue
  const firstCellDiv = puzzleDivs[clue.start];
  return firstCellDiv.querySelector(".cell");
}

window.onload = async function () {
  await loadPuzzle();
  buildCluesArr();

  const puzzleDiv = document.getElementById("puzzle");
  // Set the CSS Grid columns property based on gridWidth
  puzzleDiv.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;

  let index = 0;

  for (const row of puzzle) {
    for (const letter of row) {
      const clueDiv = document.createElement("div");
      clueDiv.classList.add("cell-div");

      // The createCell function handles setting the letter and 'block' class
      const newCell = createCell(letter);

      // Clue number placement logic (unchanged)
      for (const clue of cluesArr) {
        if (clue.start == index) {
          const clueNumber = document.createElement("span");
          clueNumber.classList.add("cell-number");
          clueNumber.textContent = clue.number;
          clueDiv.appendChild(clueNumber);
        }
      }

      clueDiv.appendChild(newCell);
      puzzleDiv.appendChild(clueDiv);
      index++;
    }
  }

  const firstBlankCell = findFirstBlankCellInClue(state.activeClue);
  if (firstBlankCell) setActiveCell(firstBlankCell);

  const keys = document.querySelectorAll(".key:not(.backspace)");
  keys.forEach((key) => {
    key.addEventListener("click", (e) => {
      if (!state.activeCell) return;
      const letter = e.target.getAttribute("data-key");
      state.activeCell.textContent = letter;
      moveInClue("forward");
      if (isPuzzleFilled()) checkPuzzle();
    });
  });

  const backspaceKey = document.getElementById("backspace-key");
  backspaceKey.addEventListener("click", () => {
    if (!state.activeCell) return;
    const currentText = state.activeCell.textContent.trim();
    if (currentText === "" || currentText === "_") {
      moveInClue("backward");
    } else {
      state.activeCell.textContent = " ";
    }
  });

  const backButton = document.getElementById("back-button");
  backButton.addEventListener("click", () => {
    state.activeClue = getClue("prior");
    updateClue();
    const firstBlankCell = findFirstBlankCellInClue(state.activeClue);
    if (firstBlankCell) setActiveCell(firstBlankCell);
  });

  const forwardButton = document.getElementById("forward-button");
  forwardButton.addEventListener("click", () => {
    state.activeClue = getClue("next");
    updateClue();
    const firstBlankCell = findFirstBlankCellInClue(state.activeClue);
    if (firstBlankCell) setActiveCell(firstBlankCell);
  });

  const checkButton = document.getElementById("check-button");
  checkButton.addEventListener("click", () => checkPuzzle());

  highlightClueCells();

  state.activeClue = cluesArr[0];
  updateClue();

  const clueDiv = document.getElementById("clue");
  clueDiv.addEventListener("click", () => {
    if (!state.activeCell) return;
    const cluesInCell = cluesArr.filter((clue) =>
      clueInCell(clue, state.activeCell)
    );
    if (cluesInCell.length < 2) return;
    const currentDirection = state.activeClue.direction;
    const alternateClue = cluesInCell.find(
      (clue) => clue.direction !== currentDirection
    );
    if (alternateClue) {
      state.activeClue = alternateClue;
      state.activeClueIndex = cluesArr.indexOf(alternateClue);
      updateClue();
      highlightClueCells();
    }
  });

  startTimer();
};

function updateClue() {
  const clue = document.getElementById("clue");
  clue.style.fontSize = "18px";
  if (state.activeClue.text.length > 75) clue.style.fontSize = "0.9em";
  clue.textContent = state.activeClue.number + ". " + state.activeClue.text;
  highlightClueCells();
}

// MODIFICATION: Uses the stored clue.indices instead of calculating cell position.
function highlightClueCells() {
  document
    .querySelectorAll(".cell-div") // Target the parent div to remove the secondary style
    .forEach((div) => div.classList.remove("active-secondary"));

  // Iterate over the exact indices stored in the active clue
  state.activeClue.indices.forEach((cellIndex) => {
    highlightCell(cellIndex);
  });
}

function highlightCell(cellIndex) {
  const puzzleDiv = document.getElementById("puzzle").children;
  const div = puzzleDiv[cellIndex];
  if (div) {
    div.classList.add("active-secondary");
  }
}

function createCell(letter) {
  const newCell = document.createElement("p");
  // If letter is "_", it's a block cell based on your puzzle array creation.
  // Otherwise, if it's a letter, show an empty cell for the user to fill.
  newCell.textContent = letter === "_" ? "" : "";
  newCell.className = "cell";
  if (letter === "_") newCell.classList.add("block");
  newCell.addEventListener("click", (event) => handleClick(event.target));
  return newCell;
}

function handleClick(newCell) {
  if (newCell.classList.contains("block")) return;
  const cluesInCell = cluesArr.filter((clue) => clueInCell(clue, newCell));
  if (cluesInCell.length === 0) return;

  const isSameCell = state.activeCell === newCell;
  const currentClue = state.activeClue;
  const isInActiveClue = clueInCell(currentClue, newCell);

  if (isSameCell && cluesInCell.length > 1) {
    const alternateClue = cluesInCell.find(
      (clue) => clue.direction !== currentClue.direction
    );
    if (alternateClue) {
      state.activeClue = alternateClue;
      state.activeClueIndex = cluesArr.indexOf(alternateClue);
      updateClue();
    }
  } else if (!isInActiveClue) {
    const newClue =
      cluesInCell.find(
        (clue) => clue.direction === state.preferredClueDirection
      ) || cluesInCell[0];
    state.activeClue = newClue;
    state.activeClueIndex = cluesArr.indexOf(newClue);
    updateClue();
  }

  setActiveCell(newCell);
  highlightClueCells();
}

// MODIFICATION: Simply checks if the cell's index is present in the clue's stored indices array.
function clueInCell(clue, cell) {
  const cellIndex = getIndexByCell(cell);
  return clue.indices.includes(cellIndex);
}

function getIndexByCell(cell) {
  const puzzleDivs = document.getElementById("puzzle").children;
  const parentDiv = cell.parentElement;
  return Array.from(puzzleDivs).indexOf(parentDiv);
}

function removePrimaryStyle() {
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("active-primary"));
}

// script.js

// MODIFICATION: Uses the stored clue.indices instead of calculating cell position.
function moveInClue(direction = "forward") {
  const clue = state.activeClue;
  const clueCells = clue.indices; // <-- USE STORED INDICES

  const currentCellIndex = getIndexByCell(state.activeCell);
  const currentIndexInClue = clueCells.indexOf(currentCellIndex);
  const puzzleDivs = document.getElementById("puzzle").children;

  if (direction === "forward") {
    // Iterate over the indices *after* the current cell
    for (let i = currentIndexInClue + 1; i < clueCells.length; i++) {
      const nextIndex = clueCells[i];
      const nextDiv = puzzleDivs[nextIndex];
      const nextCell = nextDiv.querySelector(".cell");

      // Found a blank cell: move to it and stop
      if (
        nextCell &&
        !nextCell.classList.contains("block") &&
        (nextCell.textContent.trim() === "" ||
          nextCell.textContent.trim() === "_")
      ) {
        setActiveCell(nextCell);
        return;
      }
    }

    // If no more blank cells in the current clue, move to the next clue
    state.activeClue = getClue("next");
    state.activeClueIndex = cluesArr.indexOf(state.activeClue);
    updateClue();
    const firstBlankCell = findFirstBlankCellInClue(state.activeClue);
    if (firstBlankCell) setActiveCell(firstBlankCell);
  } else if (direction === "backward") {
    if (currentIndexInClue > 0) {
      // Move one step back within the current clue's indices array
      const prevIndex = clueCells[currentIndexInClue - 1];
      const prevDiv = puzzleDivs[prevIndex];
      const prevCell = prevDiv.querySelector(".cell");
      if (prevCell && !prevCell.classList.contains("block")) {
        setActiveCell(prevCell);
      }
    } else {
      // If at the start, move to the last cell of the prior clue
      state.activeClue = getClue("prior");
      state.activeClueIndex = cluesArr.indexOf(state.activeClue);
      updateClue();
      const prevClue = state.activeClue;

      // Get the last cell index from the prior clue's indices array
      const lastCellIndex = prevClue.indices[prevClue.indices.length - 1];
      const lastDiv = puzzleDivs[lastCellIndex];
      const lastCell = lastDiv.querySelector(".cell");
      if (lastCell && !lastCell.classList.contains("block")) {
        setActiveCell(lastCell);
      }
    }
  }
}

function checkPuzzle() {
  if (puzzleCompleted) return true;
  const flatPuzzle = puzzle.flat();
  const cells = Array.from(document.querySelectorAll(".cell"));

  for (let i = 0; i < cells.length; i++) {
    if (cells[i].classList.contains("block")) continue;

    const userLetter = cells[i].textContent.trim().toUpperCase();
    const correctLetter = flatPuzzle[i] || "";

    if (userLetter !== correctLetter) {
      alert("Oops, you have a mistake!");
      return false;
    }
  }

  puzzleCompleted = true;
  clearInterval(timerInterval);
  // 🔽 MODIFIED: Call showShareLink instead of alert
  showShareLink();
  return true;
}

let timerInterval;
let secondsElapsed = 0;

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const timerDisplay = document.getElementById("timer");
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  timerDisplay.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function isPuzzleFilled() {
  const cells = Array.from(document.querySelectorAll(".cell:not(.block)"));
  return cells.every((cell) => cell.textContent.trim() !== "");
}

// 🔽 REPLACED a new, more powerful share function
function showShareLink() {
  const modal = document.getElementById("share-modal");
  const finalTimeDisplay = document.getElementById("final-time");
  const copyButton = document.getElementById("copy-link-button");
  const copyConfirmation = document.getElementById("copy-confirmation");

  // Format time for display
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  finalTimeDisplay.textContent = timeString;

  // Build the shareable URL with the time in seconds
  const baseUrl = window.location.origin + window.location.pathname;
  const vercelUrl = "https://crossd-preview.vercel.app/api/share";
  const shareUrl = `${vercelUrl}?t=${secondsElapsed}`;

  // Show the modal
  modal.style.display = "flex";

  // Handle copy button click
  copyButton.onclick = function () {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        // Show confirmation message
        copyConfirmation.style.display = "block";
        // Hide it after 2 seconds
        setTimeout(() => {
          copyConfirmation.style.display = "none";
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };
}
