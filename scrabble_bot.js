const rows = cols = 15;
const middle = Math.ceil(rows / 2) - 1;
let boardsTested = 0;
const board_element = document.getElementById('main');

const scoreModifiers = [
    [6, 1, 1, 4, 1, 1, 1, 6, 1, 1, 1, 4, 1, 1, 6],
    [1, 4, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 4, 1],
    [1, 1, 4, 1, 1, 1, 2, 1, 2, 1, 1, 1, 4, 1, 1],
    [4, 1, 1, 4, 1, 1, 1, 4, 1, 1, 1, 4, 1, 1, 4],
    [1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1],
    [1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1],
    [1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1],
    [6, 1, 1, 4, 1, 1, 1, 4, 1, 1, 1, 4, 1, 1, 6],
    [1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1],
    [1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1],
    [1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1],
    [4, 1, 1, 4, 1, 1, 1, 4, 1, 1, 1, 4, 1, 1, 4],
    [1, 1, 4, 1, 1, 1, 2, 1, 2, 1, 1, 1, 4, 1, 1],
    [1, 4, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 4, 1],
    [6, 1, 1, 4, 1, 1, 1, 6, 1, 1, 1, 4, 1, 1, 6]

];

// js version of python's itertools.product
function product(arr1, arr2) {
    return arr1.flatMap(x => arr2.map(y => [x, y]));
}

function customProduct(alphabet, repeat) {
    var result = [];
    
    function generate(current, depth) {
        if (depth === repeat) {
            result.push(current.slice());
            return;
        }
        
        for (var i = 0; i < alphabet.length; i++) {
            current.push(alphabet[i]);
            generate(current, depth + 1);
            current.pop();
        }
    }
    
    generate([], 0);
    
    return result;
}

// js version of pythpn's itertools.permutations
function permutations(array, size) {
    if (size === 1) return array.map(x => [x]);
    const results = [];
    array.forEach((x, i) => {
        const rest = permutations(array.slice(0, i).concat(array.slice(i + 1)), size - 1);
        rest.forEach(comb => {
            results.push([x].concat(comb));
        });
    });
    return results;
}

function reset2DArray(array) {
    for (let i = 0; i < rows; i++) {
        array[i] = []; // Reset each row to an empty array
        for (let j = 0; j < cols; j++) {
            array[i][j] = null; // Set each element to null
        }
    }
}

function drawTiles(tileBag, rack) {
    while (rack.length < 7) {
        const randomTile = letterList[Math.floor(Math.random() * letterList.length)];
        if (tileBag[randomTile].count > 0) {
            rack.push(randomTile);
            tileBag[randomTile].count--;
        }
    }
}

function printRack(rack) {
    console.log(rack.join(' '));
}

function generatePossibleWords(rack) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const possibleWords = new Set();

    for (let wordLength = 1; wordLength <= rack.length; wordLength++) {
        const perms = permutations(rack, wordLength);
        for (const permutation of perms) {
            let indices = [];
            if (permutation.includes("?")) {
                for (let i = 0; i < permutation.length; i++) {
                    if (permutation[i] === '?') {
                        indices.push(i);
                    }
                }
                let replacements = customProduct(alphabet, indices.length)
                for (let j=0; j<replacements.length; j++) {
                    let temp_perm = [...permutation]
                    for (let k = 0; k<indices.length; k++) {
                        temp_perm[indices[k]] = replacements[j][k]
                    }
                    const possibleWord = temp_perm.join('');
                    if (sowpods.has(possibleWord) || possibleWord.length==1) {
                        possibleWords.add(possibleWord);
                    }
                }
            } else {
                const possibleWord = permutation.join('');
                if (sowpods.has(possibleWord) || possibleWord.length==1) {
                    possibleWords.add(possibleWord);
                }
            }
        }
    }
    return Array.from(possibleWords);
}

function getWordTotal(word) {
    let wordScore = 0;
    for (const letter of word) {
        wordScore += scrabbleTiles[letter].score;
    }
    return wordScore;
}

function getHighestScoringWord(words) {
    let highestScoringWord = '';
    let highestScore = 0;
    for (const word of words) {
        const wordTotal = getWordTotal(word);
        if (wordTotal > highestScore) {
            highestScoringWord = word;
            highestScore = wordTotal;
        }
    }
    return [highestScoringWord, highestScore];
}

class ScrabbleSquare {
    constructor(coordinates) {
        this.tile = null;
        this.newlyPlaced = true;
        this.coordinates = coordinates;
        this.hasBlank = false;
        this.multiplier = 1;
    }

    addTile(tile, newlyPlaced) {
        this.tile = tile;
        this.newlyPlaced = newlyPlaced;
    }

    removeTile() {
        this.tile = null;
    }

    checkConnectedToExistingWord(board) {
        const [row, col] = this.coordinates;
        const neighbors = [
            row > 0 ? board[row - 1][col] : null,
            row < rows - 1 ? board[row + 1][col] : null,
            col > 0 ? board[row][col - 1] : null,
            col < cols - 1 ? board[row][col + 1] : null
        ];
        for (const square of neighbors) {
            if (square && !square.newlyPlaced) {
                return true;
            }
        }
        return false;
    }
}

class ScrabbleBoard {
    constructor() {
        this.board = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => new ScrabbleSquare([row, col])));
    }

    giveOutsideMove(x, y, letter) {
        this.board[x-1][y].addTile(letter, false);
    }

    printBoard() {
        for (const row of this.board) {
            console.log(row.map(square => square.tile || '.').join(' '));
        }
        console.log();
    }

    makeFirstMove(tileBag, rack) {
        const words = generatePossibleWords(rack);
        const [bestWord] = getHighestScoringWord(words);
        for (let index = 0; index < bestWord.length; index++) {
            this.board[middle][middle + index].addTile(bestWord[index], false);
            rack.splice(rack.indexOf(bestWord[index]), 1);
        }
        drawTiles(tileBag, rack);
        this.printBoard();
    }

    validateBoard() {
        const words = [];
        const tileConnectedToExistingWord = [];

        for (const row of this.board) {
            for (const square of row) {
                if (square.tile && square.newlyPlaced) {
                    tileConnectedToExistingWord.push(square.checkConnectedToExistingWord(this.board));
                }
            }
        }

        if (!tileConnectedToExistingWord.some(Boolean)) {
            return false;
        }

        for (const row of this.board) {
            const wordsToProcess = row.map(square => square.tile || '.').join('');
            const splitWordsToProcess = wordsToProcess.split('.');
            for (const string of splitWordsToProcess) {
                if (string) {
                    words.push(string);
                }
            }
        }

        for (let colIndex = 0; colIndex < cols; colIndex++) {
            const column = this.board.map(row => row[colIndex]);
            const wordsToProcess = column.map(square => square.tile || '.').join('');
            const splitWordsToProcess = wordsToProcess.split('.');
            for (const string of splitWordsToProcess) {
                if (string) {
                    words.push(string);
                }
            }
        }

        for (const word of words) {
            if (word.length > 1 && !sowpods.has(word)) {
                return false;
            }
        }

        return true;
    }

    scoreBoard() {
        let totalScore = 0;
        for (const row of this.board) {
            for (const square of row) {
                const [x, y] = square.coordinates
                if (square.tile) {
                    if (!square.hasBlank) {
                        if (square.newlyPlaced) {
                            
                            totalScore += scrabbleTiles[square.tile].score * scoreModifiers[x][y]
                        } else {
                            totalScore += scrabbleTiles[square.tile].score; 
                        }   
                    } else {
                        console.log("have a blank tile")
                    }
                }
            }
        }
        return totalScore;
    }

    // method to check if letter placed is in the rack
    // if it's not, it must be from a blank tile
    tileInRack(letter, rack) {
        return rack.includes(letter)
    }

    getBestMove(rack) {
        let highestScore = 0;
        let bestMove = [];
        for (let i = 0; i < rows; i++) {
            bestMove.push([]); // Push an empty array for each row
            for (let j = 0; j < cols; j++) {
                bestMove[i].push(null); // Push null (or any default value) for each column
            }
        }

        const wordCombinations = generatePossibleWords(rack)
        console.log(wordCombinations)
        for (const wordCombination of wordCombinations) {
            console.log(wordCombination)
            const length = wordCombination.length;
            for (const [row, col] of product([...Array(rows).keys()], [...Array(cols).keys()])) {
                boardsTested++;
                let changes = [];
                let tilesUsed = 0;
                if (col < cols - (length - 1)) {
                    for (let i = 0; i < length; i++) {
                        if (!this.board[row][col + i].tile) {
                            this.board[row][col + i].tile = wordCombination[i];
                            tilesUsed++;
                            if (!this.tileInRack(wordCombination[i], rack)) {
                                this.board[row][col + i].hasBlank = true;
                            }
                            changes.push([row, col + i]);
                        }
                    }
                    if (this.validateBoard()) {
                        let score = this.scoreBoard();
                        if (tilesUsed == 7) {
                            score += 50
                        }
                        if (score > highestScore) {
                            highestScore = score;
                            reset2DArray(bestMove)
                            for (const [r, c] of changes) {
                                bestMove[r][c] = this.board[r][c].tile
                            }
                        }
                    }
                    for (const [r, c] of changes) {
                        this.board[r][c].tile = null;
                        this.board[r][c].hasBlank = false;
                        tilesUsed = 0;
                    }
                }

                if (row < rows - (length - 1)) {
                    for (let i = 0; i < length; i++) {
                        if (!this.board[row + i][col].tile) {
                            this.board[row + i][col].tile = wordCombination[i];
                            tilesUsed++;
                            if (!this.tileInRack(wordCombination[i], rack)) {
                                this.board[row+i][col].hasBlank = true;
                            }
                            changes.push([row + i, col]);
                        }
                    }
                    if (this.validateBoard()) {
                        let score = this.scoreBoard();
                        if (tilesUsed == 7) {
                            score += 50
                        }
                        if (score > highestScore) {
                            highestScore = score;
                            reset2DArray(bestMove)
                            for (const [r, c] of changes) {
                                bestMove[r][c] = this.board[r][c].tile
                            }
                        }
                    }
                    for (const [r, c] of changes) {
                        this.board[r][c].tile = null;
                        this.board[r][c].hasBlank = false;
                    }
                }
            }
        }

        let hasMoves = false;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (bestMove[r][c] !== null) {
                    hasMoves = true;
                    break; // Exit inner loop since we already found a move
                }
            }
            if (hasMoves) {
                break; // Exit outer loop since we already found a move
            }
        }

        if (hasMoves) {
            // Apply the best move to the game board
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const tile = bestMove[r][c];
                    if (tile !== null && this.board[r][c].tile == null) {
                        this.board[r][c].tile = tile;
                        if (!this.tileInRack(tile, rack)) {
                            this.board[r][c].hasBlank = true;
                        }
                    }
                }
            }
            const button = document.querySelector('button');
            button.innerHTML = "Suggest a Move";
        } else {
            console.log("No more moves!");
            const button = document.querySelector('button');
            button.innerHTML = "No more moves!";
        }

        return bestMove
    }

    makeBestMove(rack) {
        const newBoard = this.getBestMove(rack);
        console.log("Boards Tested:", boardsTested);
        this.printBoard();
        for (const row of this.board) {
            for (const square of row) {
                if (square.tile && square.newlyPlaced === true) {
                    rack.splice(rack.indexOf(square.tile), 1);
                }
            }
        }
        for (let i=0; i<15; i++) {
            for (let j=0; j<15; j++) {
                let currentTile = this.board[i][j].tile
                const select = document.querySelector(`[name="sq${i+1},${j}"]`);
                if (currentTile != null) {
                    select.value = currentTile
                    console.log("currentTile: ", currentTile)
                    select.style.backgroundColor = 'yellow'
                    if (this.board[i][j].newlyPlaced) {
                        select.style.border = '3px solid blue'
                        this.board[i][j].newlyPlaced = false;
                    } else {
                        select.style.border = ''
                    }
                } 
            }
        }
        return this.board;
    }
}

function generateInput() {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const options = ['<option value=""></option>']
            for (let letter of alphabet) {
                options.push(`<option value="${letter}">${letter}</option>`);
            }
            options.push(`<option value="?">?</option>`);
            return options.join('');
        }

const scrabbleTable = document.querySelector('.scrabble-table');

for (let i = 0; i < 16; i++) { // 15 rows
    const row = document.createElement('div');
    row.classList.add('scrabble-row');
    const index = document.createElement('div');
    index.classList.add('index');
    if (i != 0) {
        index.textContent = `${i}`;
    }
    row.appendChild(index)
    for (let j = 0; j < 15; j++) { // 15 columns
        const box = document.createElement('div');
        box.classList.add('scrabble-cell');
        
        if (i === 0) {
            const letterCharCode = j + 65;
            const letter = String.fromCharCode(letterCharCode);
            box.textContent = `${letter}`;
        } else {
            const select = document.createElement('select');
            select.setAttribute('name', `sq${i},${j}`);
            select.innerHTML = generateInput();
            
        // Apply score modifiers
            if (scoreModifiers[i - 1][j] === 6) {
                select.classList.add('red-background');
            } else if (scoreModifiers[i - 1][j] === 4) {
                select.classList.add('pink-background');
            } else if (scoreModifiers[i - 1][j] === 2) {
                select.classList.add('lightblue-background');
            } else if (scoreModifiers[i - 1][j] === 3) {
                select.classList.add('blue-background');
            }
            
            box.appendChild(select);
        }
        row.appendChild(box);
    }
    scrabbleTable.appendChild(row);
}

const rack = document.querySelector('.rack')
for (let i = 0; i < 7; i++) {
    const tile = document.createElement('select');
    tile.classList.add('tile');
    tile.innerHTML = generateInput(); // Generate options
    rack.appendChild(tile)
}

const form = document.getElementById('input-form');

form.addEventListener('submit', function(event) {
    const board = new ScrabbleBoard();
    let myTiles = [];
    event.preventDefault();

    const selects = document.querySelectorAll('.scrabble-cell select');
    
    selects.forEach((select) => {
        const cellValue = select.value;
        if (cellValue != "") {
            const cellName = select.getAttribute('name');
            const [row, column] = cellName.split('sq')[1].split(',');
            board.giveOutsideMove(parseInt(row), parseInt(column), cellValue)
        } 
    });

    const tiles = document.querySelectorAll('.tile');
    tiles.forEach((tile) => {
        myTiles.push(tile.value)
    });

    board.makeBestMove(myTiles)
})

const selects = document.querySelectorAll('.scrabble-cell select');
selects.forEach((select) => {
    select.addEventListener('change', function() {
        const cellValue = this.value;
        if (cellValue != '') {
            this.style.backgroundColor = 'yellow';
        } else {
            this.style.backgroundColor = ''; // Reset background color
        }
    });
});

