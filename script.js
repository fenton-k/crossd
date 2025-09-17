const puzzle = [
  ["_", "S", "O", "S", "O"],
  ["_", "H", "U", "N", "K"],
  ["D", "A", "T", "E", "S"],
  ["I", "K", "E", "A", "_"],
  ["P", "E", "R", "K", "_"],
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
    1: makeClue("Could be better", "SOSO", 1, 1, "across"),
    5: makeClue("Attractive, muscular guy", "HUNK", 6, 5, "across"),
    6: makeClue("1/23/45 and 6/7/89", "DATES", 10, 6, "across"),
    7: makeClue("Famous flat rack furniture maker", "IKEA", 15, 7, "across"),
    8: makeClue("Job plus one", "PERK", 20, 8, "across"),
  },
  down: {
    1: makeClue("Ice cream drink", "SHAKE", 1, 1, "down"),
    2: makeClue("Word with space or Banks", "OUTER", 2, 2, "down"),
    3: makeClue("Quarterback running play", "SNEAK", 3, 3, "down"),
    4: makeClue("Signs off on", "OKS", 4, 4, "down"),
    6: makeClue("Buy the ___ (investing strategy)", "DIP", 10, 6, "down"),
  },
};

let cluesArr = [];

let activeCell;
let activeClueIndex = 0;
let activeClue;

let preferredClueDirection = "across";

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
  let index = 0;

  // set up the puzzle (we only need for testing, tbh)
  for (const row of puzzle) {
    for (const letter of row) {
      const clueDiv = document.createElement("div");
      clueDiv.classList.add("cell-div");

      newCell = createCell(letter);

      for (const clue of cluesArr) {
        if (clue.start == index) {
          const clueNumber = document.createElement("span");
          clueNumber.classList.add("cell-number");
          clueNumber.textContent = clue.number; // really should be added based on clues
          clueDiv.appendChild(clueNumber);
        }
      }

      clueDiv.appendChild(newCell);
      puzzleDiv.appendChild(clueDiv);
      index++;
    }
  }

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
    console.log("active clue is now " + activeClue.text);
    removePrimaryStyle();
    updateClue();
  });

  const forwardButton = document.getElementById("forward-button");
  forwardButton.addEventListener("click", () => {
    activeClue = getClue("next");
    removePrimaryStyle();
    updateClue();
  });

  const checkButton = this.document.getElementById("check-button");
  checkButton.addEventListener("click", () => checkPuzzle());

  highlightClueCells();
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

  let step = puzzle[0].length;

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
  newCell.textContent = "";
  if (letter == "_") newCell.textContent = "_";
  newCell.className = "cell";
  newCell.contentEditable = true;

  if (letter === "_") {
    newCell.classList.add("block");
  }

  newCell.addEventListener("click", (event) => handleClick(event.target));

  return newCell;
}

function handleClick(newCell) {
  // if it's a block, simply don't do ANYTHING!
  if (newCell.classList.contains("block")) return;

  const originalCell = activeCell;
  activeCell = newCell;

  // there can only be one lord of the rings
  removePrimaryStyle();

  // set the new cell to active
  if (!newCell.classList.contains("block")) {
    newCell.classList.add("active-primary");
  }

  // update the clue based on where we clicked
  getCluesByCell(newCell, originalCell);

  //   just makes it nice for iOS
  const hiddenInput = document.getElementById("hiddenInput");
  hiddenInput.focus();
  hiddenInput.value = ""; // clear for next character
}

function getCluesByCell(cell, originalCell) {
  let cellIndex = getIndexByCell(cell);
  let originalCellIndex = getIndexByCell(originalCell);
  let foundClue = null;

  let cluesInCellArr = [];

  cluesArr.forEach((clue) => {
    if (clueInCell(clue, cellIndex)) cluesInCellArr.push(clue);
  });

  console.log(cluesInCellArr);

  if (cellIndex == originalCellIndex)
    activeClue = cluesInCellArr.find((clue) => clue !== activeClue);
  else activeClue = cluesInCellArr[0];

  activeClueIndex = getIndexByCell(cell);

  console.log("active clue is now " + activeClue.text);

  updateClue();
}

function clueInCell(clue, cellIndex) {
  const gridWidth = 5;
  const start = clue.start;
  const length = clue.answer.length;
  const direction = clue.direction;

  if (direction == "across") {
    return (
      Math.floor(cellIndex / gridWidth) === Math.floor(start / gridWidth) &&
      cellIndex >= start &&
      cellIndex < start + length
    );
  } else if (direction == "down") {
    return (
      cellIndex >= start &&
      (cellIndex - start) % gridWidth === 0 &&
      (cellIndex - start) / gridWidth < length
    );
  }
  return false;
}

function getIndexByCell(cell) {
  return Array.from(document.querySelectorAll(".cell")).indexOf(cell);
}

function removePrimaryStyle() {
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("active-primary"));
}

function checkPuzzle() {
  let i = 0;

  const flatPuzzle = puzzle.flat();

  let cells = Array.from(document.querySelectorAll(".cell"));
  for (const cell of cells) {
    console.log("value at index " + i + " is " + cell.textContent);
    if (flatPuzzle[i] !== cell.textContent.toUpperCase()) {
      console.log();
      alert("oops, you have a mistake");
      return false;
    }
    i++;
  }
  alert("congrats, you win!");
  return true;
}
