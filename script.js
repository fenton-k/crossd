//
let puzzle = [];

function makeClue(text, answer, start, number, direction) {
  return {
    text: text,
    answer: answer,
    start: start,
    length: answer.length,
    number: number,
    direction: direction,
  };
}

let clues = { across: {}, down: {} };

async function loadPuzzle() {
  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(`data/puzzles/${today}.json`);
  const data = await response.json();

  // Build puzzle grid
  const { cells, dimensions, clues: clueArr } = data;
  puzzle = [];
  for (let r = 0; r < dimensions.height; r++) {
    const row = [];
    for (let c = 0; c < dimensions.width; c++) {
      const cell = cells[r * dimensions.width + c];
      row.push(cell.answer || "_");
    }
    puzzle.push(row);
  }

  // Build clues object
  clues = { across: {}, down: {} };
  clueArr.forEach((clue) => {
    const dir = clue.direction.toLowerCase();
    const answer = clue.cells.map((i) => cells[i].answer || "_").join("");
    clues[dir][clue.label] = makeClue(
      clue.text[0].plain,
      answer,
      clue.cells[0],
      clue.label,
      dir
    );
  });
}

let state = {
  activeCell: null,
  activeClue: null,
  activeClueIndex: 0,
  preferredClueDirection: "across",
};

let cluesArr = [];

function getClue(direction) {
  const step = direction === "prior" ? -1 : 1;
  state.activeClueIndex =
    (state.activeClueIndex + step + cluesArr.length) % cluesArr.length;

  return cluesArr[state.activeClueIndex];
}

function buildCluesArr() {
  Object.values(clues["across"]).forEach((clue) => cluesArr.push(clue));
  Object.values(clues["down"]).forEach((clue) => cluesArr.push(clue));

  state.activeClue = cluesArr[state.activeClueIndex];
}

window.onload = async function () {
  await loadPuzzle();
  buildCluesArr();

  const puzzleDiv = document.getElementById("puzzle");
  let index = 0;

  // build grid
  for (const row of puzzle) {
    for (const letter of row) {
      const clueDiv = document.createElement("div");
      clueDiv.classList.add("cell-div");

      const newCell = createCell(letter);

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

  // Set initial active cell to first cell of first clue
  const puzzleDivs = document.getElementById("puzzle").children;
  const firstClueStart = state.activeClue.start;
  const firstCellDiv = puzzleDivs[firstClueStart];
  const firstCell = firstCellDiv.querySelector(".cell");

  if (firstCell && !firstCell.classList.contains("block")) {
    state.activeCell = firstCell;
    firstCell.classList.add("active-primary");
  }

  // iOS/safari hidden input
  const hiddenInput = document.getElementById("hiddenInput");

  hiddenInput.addEventListener("input", (e) => {
    const val = e.target.value.toUpperCase();

    if (!/^[A-Z]$/.test(val)) {
      e.target.value = "";
      return;
    }

    if (!state.activeCell) return;
    state.activeCell.textContent = val;
    hiddenInput.value = "";
    moveInClue("forward");
  });

  hiddenInput.addEventListener("keydown", (e) => {
    if (!state.activeCell) return;

    if (e.key === "Backspace") {
      const currentText = state.activeCell.textContent.trim();

      if (currentText === "" || currentText === "_") {
        moveInClue("backward");
      } else {
        state.activeCell.textContent = " ";
      }

      e.preventDefault(); // avoid double backspace on iOS
    }
  });

  // button handlers
  const backButton = document.getElementById("back-button");
  backButton.addEventListener("click", () => {
    state.activeClue = getClue("prior");
    removePrimaryStyle();
    updateClue();
  });

  const forwardButton = document.getElementById("forward-button");
  forwardButton.addEventListener("click", () => {
    state.activeClue = getClue("next");
    removePrimaryStyle();
    updateClue();
  });

  const checkButton = this.document.getElementById("check-button");
  checkButton.addEventListener("click", () => checkPuzzle());

  highlightClueCells();
};

function updateClue() {
  const clue = document.getElementById("clue");
  clue.textContent = state.activeClue.number + ". " + state.activeClue.text;

  highlightClueCells();

  // keep keyboard open
  const hiddenInput = document.getElementById("hiddenInput");
  hiddenInput.focus();
}

function highlightClueCells() {
  document
    .querySelectorAll("div")
    .forEach((div) => div.classList.remove("active-secondary"));

  let direction = state.activeClue.direction === "across" ? "across" : "down";
  let clueLength = state.activeClue.length;
  let clueStart = state.activeClue.start;

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

  if (letter === "_") {
    newCell.classList.add("block");
  }

  newCell.addEventListener("click", (event) => handleClick(event.target));

  return newCell;
}

function handleClick(newCell) {
  if (newCell.classList.contains("block")) return;

  removePrimaryStyle();

  newCell.classList.add("active-primary");

  const cluesInCell = cluesArr.filter((clue) => clueInCell(clue, newCell));

  if (cluesInCell.length == 0) return;

  let newActiveClue;

  if (state.activeCell === newCell) {
    newActiveClue = cluesInCell.find(
      (clue) => clue.direction !== state.activeClue.direction
    );
  } else {
    newActiveClue = cluesInCell.find(
      (clue) =>
        clue.direction === state.preferredClueDirection || cluesInCell[0]
    );
  }

  state.activeCell = newCell;
  state.activeClue = newActiveClue;
  state.activeClueIndex = cluesArr.indexOf(newActiveClue);

  updateClue();

  // For iOS keyboard behavior
  const hiddenInput = document.getElementById("hiddenInput");
  hiddenInput.focus();
  hiddenInput.value = "";
}

function clueInCell(clue, cell) {
  const cellIndex = getIndexByCell(cell);
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

function moveInClue(direction = "forward") {
  const clue = state.activeClue;
  const clueCells = [];

  const step = clue.direction === "across" ? 1 : puzzle[0].length;

  for (let i = 0; i < clue.length; i++) {
    clueCells.push(clue.start + i * step);
  }

  const currentCellIndex = getIndexByCell(state.activeCell);
  const currentIndexInClue = clueCells.indexOf(currentCellIndex);

  const puzzleDivs = document.getElementById("puzzle").children;

  if (direction === "forward") {
    if (currentIndexInClue < clueCells.length - 1) {
      const nextIndex = clueCells[currentIndexInClue + 1];
      const nextDiv = puzzleDivs[nextIndex];
      const nextCell = nextDiv.querySelector(".cell");
      if (nextCell && !nextCell.classList.contains("block")) {
        handleClick(nextCell);
      }
    } else {
      state.activeClue = getClue("next");
      state.activeClueIndex = cluesArr.indexOf(state.activeClue);

      const nextIndex = state.activeClue.start;
      const nextDiv = puzzleDivs[nextIndex];
      const nextCell = nextDiv.querySelector(".cell");

      if (nextCell && !nextCell.classList.contains("block")) {
        handleClick(nextCell);
      }
    }
  } else if (direction === "backward") {
    if (currentIndexInClue > 0) {
      const prevIndex = clueCells[currentIndexInClue - 1];
      const prevDiv = puzzleDivs[prevIndex];
      const prevCell = prevDiv.querySelector(".cell");

      if (prevCell && !prevCell.classList.contains("block")) {
        handleClick(prevCell);
      }
    } else {
      const currentText = state.activeCell.textContent.trim();
      if (currentText === "" || currentText === "_") {
        state.activeClue = getClue("prior");
        state.activeClueIndex = cluesArr.indexOf(state.activeClue);

        const prevClue = state.activeClue;
        const prevStep = prevClue.direction === "across" ? 1 : puzzle[0].length;
        const lastCellIndex = prevClue.start + (prevClue.length - 1) * prevStep;

        const lastDiv = puzzleDivs[lastCellIndex];
        const lastCell = lastDiv.querySelector(".cell");

        if (lastCell && !lastCell.classList.contains("block")) {
          handleClick(lastCell);
        }
      }
    }
  }
}

function checkPuzzle() {
  const flatPuzzle = puzzle.flat();

  let cells = Array.from(document.querySelectorAll(".cell"));
  for (let i = 0; i < cells.length; i++) {
    if (flatPuzzle[i] !== cells[i].textContent.toUpperCase()) {
      alert("Oops, you have a mistake!");
      return false;
    }
  }
  alert("Congrats, you win!");
  return true;
}
