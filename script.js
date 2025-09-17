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
  // if it's a block, simply don't do ANYTHING!
  if (newCell.classList.contains("block")) return;

  const originalCell = activeCell;
  const originalCellIndex = Array.from(
    document.querySelectorAll(".cell")
  ).indexOf(originalCell);
  activeCell = newCell;

  // there can only be one lord of the rings
  document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.classList.remove("active-primary"));

  // set the new cell to active
  if (!newCell.classList.contains("block")) {
    newCell.classList.add("active-primary");
  }

  // update the clue based on where we clicked
  newCellIndex = Array.from(document.querySelectorAll(".cell")).indexOf(
    newCell
  );
  console.log(newCellIndex);
  getCluesByIndex(newCellIndex, originalCellIndex);

  //   just makes it nice for iOS
  const hiddenInput = document.getElementById("hiddenInput");
  hiddenInput.focus();
  hiddenInput.value = ""; // clear for next character
}

function getCluesByIndex(cellIndex, originalCellIndex) {
  let foundClue = null;

  let cluesInCellArr = [];

  cluesArr.forEach((clue) => {
    if (clueInCell(clue, cellIndex)) cluesInCellArr.push(clue);
  });

  console.log(cluesInCellArr);

  if (cellIndex == originalCellIndex)
    activeClue = cluesInCellArr.find((clue) => clue !== activeClue);
  else activeClue = cluesInCellArr[0];

  // console.log(cluesInCellArr);

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
