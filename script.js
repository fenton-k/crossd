const puzzle = [
  ["B", "O", "_", "I", "M"],
  ["N", "A", "M", "E", "I"],
  ["A", "M", "I", "L", "C"],
  ["M", "E", "C", "Z", "E"],
  ["E", "D", "E", "_", "_"],
];

function makeClue(text, answer, start, number, direction) {
  // console.log("length of clue " + text + " is " + answer.length);

  return {
    text: text,
    answer: answer,
    start: start,
    length: answer.length,
    number: number,
    direction: direction,
  };
}

const clues = {
  across: {
    1: makeClue("A silly dog", "BO", 0, 1, "across"),
    2: makeClue("A word for me", "IM", 3, 2, "across"),
    3: makeClue("Reindeer in french", "TIGER", 5, 3, "across"),
  },
  down: {
    1: makeClue("A hilarious monkey", "BABER", 0, 1, "down"),
    2: makeClue("A chunkey monkey", "DADDY", 1, 2, "down"),
  },
};

let cluesArr = [];

let activeCell;
let activeClueIndex = 0;
let activeClue;

function getClue(direction) {
  const step = direction === "prior" ? -1 : 1;
  activeClueIndex =
    (activeClueIndex + step + cluesArr.length) % cluesArr.length;

  return cluesArr[activeClueIndex];
}

function buildCluesArr() {
  Object.values(clues["across"]).forEach((clue) => cluesArr.push(clue));
  Object.values(clues["down"]).forEach((clue) => cluesArr.push(clue));

  activeClue = cluesArr[activeClueIndex];
}

window.onload = function () {
  buildCluesArr();
  // console.log(cluesArr);

  const puzzleDiv = document.getElementById("puzzle");

  // set up the puzzle (we only need for testing, tbh)
  for (const row of puzzle) {
    for (const letter of row) {
      const clueDiv = document.createElement("div");
      clueDiv.classList.add("cell-div");

      newCell = createCell(letter);

      const clueNumber = document.createElement("span");
      clueNumber.classList.add("cell-number");
      clueNumber.textContent = 1; // really should be added based on clues

      clueDiv.appendChild(newCell);
      clueDiv.appendChild(clueNumber);
      puzzleDiv.appendChild(clueDiv);
    }
  }

  // console.log(activeClue.text);

  // this is all just to make iOS/safari happy.
  const hiddenInput = document.getElementById("hiddenInput");

  hiddenInput.addEventListener("input", (e) => {
    if (!/^[a-zA-Z]$/.test(e.target.value)) return;
    if (!activeCell) return;
    activeCell.textContent = e.target.value;
    hiddenInput.value = "";
  });

  hiddenInput.addEventListener("keydown", (e) => {
    if (!activeCell) return;
    if (e.key === "Backspace") {
      activeCell.textContent = " ";
      // e.preventDefault();
    }
  });

  // add event handlers to the buttons
  const backButton = document.getElementById("back-button");
  backButton.addEventListener("click", () => {
    activeClue = getClue("prior");
    updateClue();
  });

  const forwardButton = document.getElementById("forward-button");
  forwardButton.addEventListener("click", () => {
    activeClue = getClue("next");
    updateClue();
  });

  setCellsActive(0, 0);
};

function updateClue() {
  const clue = document.getElementById("clue");
  clue.textContent = activeClue.number + ". " + activeClue.text;

  highlightClueCells();

  // keep the keyboard pulled up
  const hiddenInput = document.getElementById("hiddenInput");
  hiddenInput.focus();
}

function highlightClueCells() {
  // unhighlight any cells that may already be highlighted
  document
    .querySelectorAll("div")
    .forEach((div) => div.classList.remove("active-secondary"));

  let direction = activeClue.direction === "across" ? "across" : "down";
  let clueLength = activeClue.length;
  let clueStart = activeClue.start;

  let step = 0;

  if (direction == "down") {
    step = puzzle[0].length;
  }

  for (let i = 0; i < clueLength; i++) {
    if (direction == "across") {
      highlightCell(clueStart + i);
    } else {
      highlightCell(clueStart + step * i);
    }
  }
}

function highlightCell(cellIndex) {
  let puzzleDiv = document.getElementById("puzzle").children;
  let div = puzzleDiv[cellIndex];
  div.classList.add("active-secondary");
}

function createCell(letter) {
  const newCell = document.createElement("p");
  newCell.textContent = letter;
  newCell.className = "cell";
  newCell.contentEditable = true;

  if (letter === "_") {
    newCell.classList.add("block");
  }

  newCell.addEventListener("click", (event) => handleClick(event.target));

  return newCell;
}

function handleClick(newCell) {
  activeCell = newCell;

  // there can only be one lord of the rings
  document
    .querySelectorAll(".cell")
    .forEach((cell) =>
      cell.classList.remove("active-primary", "active-secondary")
    );

  // set the new cell to active
  if (!newCell.classList.contains("block")) {
    newCell.classList.add("active-primary");
  }

  //   just makes it nice for iOS
  const hiddenInput = document.getElementById("hiddenInput");
  hiddenInput.focus();
  hiddenInput.value = ""; // clear for next character
}

// not called - work this logic in elsewhere
function handleKeyDown(key) {
  // there can only be one character in the cell
  document.querySelectorAll(".cell.active-primary").forEach((cell) => {
    cell.textContent = cell.textContent[0];
  });
}

function getCellIndex(cell) {
  const cells = Array.from(document.getElementById("puzzle").children);
  return cells.indexOf(cell);
}

function getCellPosition(cell) {
  index = getCellIndex(cell);

  const col = index % puzzle[0].length;
  const row = Math.floor(index / puzzle[0].length);
  return [col, row];
}

// index is which row/col to set i.e. 1 for row 1
// rowOrCol is whether to set rows or cols. 0 is rows, 1 is cols
function setCellsActive(index, rowOrCol) {
  // console.log("firing setting cells active");

  var blockSeen = false;

  document.querySelectorAll(".cell").forEach((cell) => {
    if (cell.classList.contains("block")) {
      blockSeen = true;
    }

    if (blockSeen) return;

    const [col, row] = getCellPosition(cell);

    if (!rowOrCol && row == index) {
      cell.classList.add("active-secondary");
    }

    if (rowOrCol && col == index) {
      cell.classList.add("active-secondary");
    }
  });
}
