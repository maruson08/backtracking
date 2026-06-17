/* =========================================================
   4x4 Sudoku Algorithm Visualizer
   app.js - Part 1

   Contents
   -----------------------------------------
   1. DOM References
   2. Constants
   3. Global State
   4. Board Rendering
   5. Input Utilities
   6. Sudoku Validation
   7. Candidate Calculation
   8. Solvability Check
   9. Board Extraction
   10. Base Initialization

   Part 2:
   Naive / Basic / MRV Event Generators

   Part 3:
   Animation Engine + Charts + Analysis
========================================================= */

/* =========================================================
   DOM REFERENCES
========================================================= */

const inputBoardEl =
    document.getElementById("inputBoard");

const solveBtn =
    document.getElementById("solveBtn");

const sampleBtn =
    document.getElementById("sampleBtn");

const clearBtn =
    document.getElementById("clearBtn");

const logPanel =
    document.getElementById("logPanel");

const analysisContent =
    document.getElementById("analysisContent");

const naiveBoardEl =
    document.getElementById("naiveBoard");

const basicBoardEl =
    document.getElementById("basicBoard");

const mrvBoardEl =
    document.getElementById("mrvBoard");

/* =========================================================
   CONSTANTS
========================================================= */

const SIZE = 4;
const BOX = 2;

const EMPTY = 0;

const CELL_CLASS = {
    EMPTY: "cell-empty",
    FIXED: "cell-fixed",
    SELECT: "cell-selected",
    SUCCESS: "cell-success",
    BACKTRACK: "cell-backtrack"
};

let liveStats = {

    naive:createStats(),
    basic:createStats(),
    mrv:createStats()

};

let animationDelay = 120;


const speedRange =
    document.getElementById(
        "speedRange"
    );

const speedValue =
    document.getElementById(
        "speedValue"
    );


speedRange.addEventListener(
    "input",
    () => {

        animationDelay =
            Number(
                speedRange.value
            );

        speedValue.textContent =
            animationDelay + " ms";
    }
);

/* =========================================================
   GLOBAL STATE
========================================================= */

let depthChart = null;

let animationRunning = false;

let naiveEvents = [];
let basicEvents = [];
let mrvEvents = [];

let naiveDepthSeries = [];
let basicDepthSeries = [];
let mrvDepthSeries = [];

let naiveStats = null;
let basicStats = null;
let mrvStats = null;

/* =========================================================
   BOARD FACTORY
========================================================= */

function createEmptyBoard() {

    return Array.from(
        { length: SIZE },
        () => Array(SIZE).fill(0)
    );
}

function cloneBoard(board) {

    return board.map(
        row => [...row]
    );
}

/* =========================================================
   VISUAL BOARD CREATION
========================================================= */

function createVisualBoard(container) {

    container.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const cell =
                document.createElement("div");

            cell.classList.add("cell");

            /* Thick Borders */

            if (col === 0)
                cell.classList.add("left-thick");

            if (col === SIZE - 1)
                cell.classList.add("right-thick");

            if (row === 0)
                cell.classList.add("top-thick");

            if (row === SIZE - 1)
                cell.classList.add("bottom-thick");

            if (col === 1)
                cell.classList.add("right-thick");

            if (row === 1)
                cell.classList.add("bottom-thick");

            cell.dataset.row = row;
            cell.dataset.col = col;

            container.appendChild(cell);
        }
    }
}

/* =========================================================
   RENDER BOARD
========================================================= */

function renderBoard(
    container,
    board,
    fixedMap = null,
    highlight = null
) {

    const cells =
        container.querySelectorAll(".cell");

    let index = 0;

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const cell = cells[index++];

            cell.classList.remove(
                CELL_CLASS.EMPTY,
                CELL_CLASS.FIXED,
                CELL_CLASS.SELECT,
                CELL_CLASS.SUCCESS,
                CELL_CLASS.BACKTRACK
            );

            const value =
                board[row][col];

            cell.textContent =
                value === 0 ? "" : value;

            if (value === 0) {
                cell.classList.add(
                    CELL_CLASS.EMPTY
                );
            }

            if (
                fixedMap &&
                fixedMap[row][col]
            ) {
                cell.classList.add(
                    CELL_CLASS.FIXED
                );
            }

            if (
                highlight &&
                highlight.row === row &&
                highlight.col === col
            ) {

                cell.classList.add(
                    highlight.className
                );
            }
        }
    }
}

/* =========================================================
   INPUT VALIDATION
========================================================= */

function normalizeInputValue(value) {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {
        return 0;
    }

    const num =
        Number(value);

    if (
        Number.isNaN(num)
    ) {
        return null;
    }

    return num;
}

function validateInputBoard() {

    const inputs =
        inputBoardEl.querySelectorAll("input");

    for (const input of inputs) {

        const value =
            normalizeInputValue(
                input.value
            );

        if (
            value === null
        ) {
            alert(
                "숫자만 입력 가능합니다."
            );
            return false;
        }

        if (
            value < 0 ||
            value > 4
        ) {
            alert(
                "0~4 범위만 입력 가능합니다."
            );
            return false;
        }
    }

    return true;
}

/* =========================================================
   EXTRACT BOARD
========================================================= */

function getBoardFromInputs() {

    const board =
        createEmptyBoard();

    const inputs =
        inputBoardEl.querySelectorAll("input");

    inputs.forEach(input => {

        const row =
            Number(
                input.dataset.row
            );

        const col =
            Number(
                input.dataset.col
            );

        const value =
            Number(
                input.value || 0
            );

        board[row][col] =
            value;
    });

    return board;
}

/* =========================================================
   FIXED CELL MAP
========================================================= */

function createFixedMap(board) {

    return board.map(row =>
        row.map(v => v !== 0)
    );
}

/* =========================================================
   ROW VALIDATION
========================================================= */

function rowValid(
    board,
    row,
    value,
    ignoreCol = -1
) {

    for (
        let col = 0;
        col < SIZE;
        col++
    ) {

        if (col === ignoreCol)
            continue;

        if (
            board[row][col] === value
        ) {
            return false;
        }
    }

    return true;
}

/* =========================================================
   COLUMN VALIDATION
========================================================= */

function columnValid(
    board,
    col,
    value,
    ignoreRow = -1
) {

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {

        if (row === ignoreRow)
            continue;

        if (
            board[row][col] === value
        ) {
            return false;
        }
    }

    return true;
}

/* =========================================================
   BOX VALIDATION
========================================================= */

function boxValid(
    board,
    row,
    col,
    value
) {

    const startRow =
        Math.floor(row / BOX) * BOX;

    const startCol =
        Math.floor(col / BOX) * BOX;

    for (
        let r = startRow;
        r < startRow + BOX;
        r++
    ) {

        for (
            let c = startCol;
            c < startCol + BOX;
            c++
        ) {

            if (
                r === row &&
                c === col
            ) {
                continue;
            }

            if (
                board[r][c] === value
            ) {
                return false;
            }
        }
    }

    return true;
}

/* =========================================================
   IS SAFE
========================================================= */

function isSafe(
    board,
    row,
    col,
    value
) {

    return (
        rowValid(
            board,
            row,
            value,
            col
        ) &&
        columnValid(
            board,
            col,
            value,
            row
        ) &&
        boxValid(
            board,
            row,
            col,
            value
        )
    );
}

/* =========================================================
   INITIAL CONFLICT CHECK
========================================================= */

function hasInitialConflict(board) {

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {

            const value =
                board[row][col];

            if (
                value === 0
            ) {
                continue;
            }

            if (
                !isSafe(
                    board,
                    row,
                    col,
                    value
                )
            ) {
                return true;
            }
        }
    }

    return false;
}

/* =========================================================
   CANDIDATE LIST
========================================================= */

function getCandidates(
    board,
    row,
    col
) {

    if (
        board[row][col] !== 0
    ) {
        return [];
    }

    const candidates = [];

    for (
        let value = 1;
        value <= 4;
        value++
    ) {

        if (
            isSafe(
                board,
                row,
                col,
                value
            )
        ) {
            candidates.push(
                value
            );
        }
    }

    return candidates;
}

/* =========================================================
   FIND FIRST EMPTY
========================================================= */

function findFirstEmpty(board) {

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {

            if (
                board[row][col] === 0
            ) {

                return {
                    row,
                    col
                };
            }
        }
    }

    return null;
}

/* =========================================================
   FIND MRV CELL
========================================================= */

function findMRVCell(board) {

    let best = null;
    let bestCount = Infinity;

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {

            if (
                board[row][col] !== 0
            ) {
                continue;
            }

            const candidates =
                getCandidates(
                    board,
                    row,
                    col
                );

            if (
                candidates.length <
                bestCount
            ) {

                bestCount =
                    candidates.length;

                best = {
                    row,
                    col,
                    candidates
                };

                if (
                    bestCount === 1
                ) {
                    return best;
                }
            }
        }
    }

    return best;
}

/* =========================================================
   SOLVED CHECK
========================================================= */

function isSolved(board) {

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {

            if (
                board[row][col] === 0
            ) {
                return false;
            }
        }
    }

    return true;
}

/* =========================================================
   SOLVABILITY CHECK
   (simple backtracking)
========================================================= */

function canSolve(board) {

    const working =
        cloneBoard(board);

    function dfs() {

        const empty =
            findFirstEmpty(
                working
            );

        if (!empty) {
            return true;
        }

        const {
            row,
            col
        } = empty;

        const candidates =
            getCandidates(
                working,
                row,
                col
            );

        for (
            const value
            of candidates
        ) {

            working[row][col] =
                value;

            if (dfs()) {
                return true;
            }

            working[row][col] = 0;
        }

        return false;
    }

    return dfs();
}

/* =========================================================
   SAMPLE PUZZLE
========================================================= */

const SAMPLE_PUZZLE = [

    [1,0,0,4],
    [0,4,1,0],
    [4,0,0,3],
    [0,2,0,1]

];

/* =========================================================
   LOAD SAMPLE
========================================================= */

function loadSamplePuzzle() {

    const inputs =
        inputBoardEl.querySelectorAll(
            "input"
        );

    let index = 0;

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {

            inputs[index++].value =
                SAMPLE_PUZZLE[row][col];
        }
    }
}

/* =========================================================
   CLEAR PUZZLE
========================================================= */

function clearPuzzle() {

    const inputs =
        inputBoardEl.querySelectorAll(
            "input"
        );

    inputs.forEach(input => {

        input.value = 0;
    });
}

/* =========================================================
   INITIALIZE VISUAL BOARDS
========================================================= */

createVisualBoard(
    naiveBoardEl
);

createVisualBoard(
    basicBoardEl
);

createVisualBoard(
    mrvBoardEl
);

/* =========================================================
   BUTTONS
========================================================= */

sampleBtn.addEventListener(
    "click",
    loadSamplePuzzle
);

clearBtn.addEventListener(
    "click",
    clearPuzzle
);

/* =========================================================
   PART 1 END
========================================================= */

/*
-------------------------------------------------------
NEXT PART (Part 2)

Contains:

1. Event Object Factory
2. Statistics Collector
3. Naive Backtracking Generator
4. Basic Backtracking Generator
5. MRV Generator
6. Event Streams
7. Depth Series Generation

At the end of Part 2:

naiveEvents
basicEvents
mrvEvents

will be fully generated and ready
for animation playback.
-------------------------------------------------------
*//* =========================================================
   APP.JS - PART 2
   Event Generation Engine
========================================================= */

/* =========================================================
   EVENT FACTORY
========================================================= */

function createEvent(type, payload = {}) {

    return {
        type,
        timestamp: performance.now(),
        ...payload
    };
}

/* =========================================================
   STATS FACTORY
========================================================= */

function createStats() {

    return {
        recursiveCalls: 0,
        backtracks: 0,
        maxDepth: 0,
        solved: false
    };
}

/* =========================================================
   DEPTH SERIES PUSH
========================================================= */

function pushDepth(
    arr,
    depth
){

    arr.push(
        {
            x: arr.length,
            y: depth
        }
    );

}

/* =========================================================
   EVENT HELPERS
========================================================= */

function pushSelectEvent(
    events,
    row,
    col,
    candidates,
    depth
) {

    events.push(
        createEvent(
            "select",
            {
                row,
                col,
                candidates: [...candidates],
                candidateCount:
                    candidates.length,
                depth
            }
        )
    );
}

function pushPlaceEvent(
    events,
    row,
    col,
    value,
    depth
) {

    events.push(
        createEvent(
            "place",
            {
                row,
                col,
                value,
                depth
            }
        )
    );
}

function pushBacktrackEvent(
    events,
    row,
    col,
    value,
    depth
) {

    events.push(
        createEvent(
            "backtrack",
            {
                row,
                col,
                value,
                depth
            }
        )
    );
}

function pushCompleteEvent(
    events,
    depth
) {

    events.push(
        createEvent(
            "complete",
            {
                depth
            }
        )
    );
}

/* =========================================================
   GENERATE NAIVE EVENTS
========================================================= */

function generateNaiveEvents(initialBoard) {
const callSeries=[];
    const board =
        cloneBoard(initialBoard);


    const events = [];

    const stats =
        createStats();

    const depthSeries = [];


    function dfs(index, depth) {


        stats.recursiveCalls++;

callSeries.push(
    stats.recursiveCalls
);
        stats.maxDepth =
            Math.max(
                stats.maxDepth,
                depth
            );


        pushDepth(
            depthSeries,
            depth
        );



        if(index === 16){

            stats.solved = true;

            pushCompleteEvent(
                events,
                depth
            );

            return true;
        }



        const row =
            Math.floor(index / 4);


        const col =
            index % 4;



        // 이미 채워진 칸
        if(board[row][col] !== 0){

            return dfs(
                index + 1,
                depth
            );
        }



        pushSelectEvent(
            events,
            row,
            col,
            [1,2,3,4],
            depth
        );



        for(
            let value = 1;
            value <= 4;
            value++
        ){



            events.push(
                createEvent(
                    "try",
                    {
                        row,
                        col,
                        value,
                        depth
                    }
                )
            );



            if(
                isSafe(
                    board,
                    row,
                    col,
                    value
                )
            ){


                board[row][col] =
                    value;



                pushPlaceEvent(
                    events,
                    row,
                    col,
                    value,
                    depth
                );



                // 성공하면 계속
                if(
                    dfs(
                        index + 1,
                        depth + 1
                    )
                ){

                    return true;

                }



                /*
                  여기서 복구하지 않음
                  (백트래킹 X)
                */


            }
            else {


                events.push(
                    createEvent(
                        "fail",
                        {
                            row,
                            col,
                            value,
                            depth
                        }
                    )
                );


            }

        }



        return false;

    }


    dfs(0,0);



    return {

 events,

 stats,

 depthSeries,

 callSeries

};
}

/* =========================================================
   GENERATE BASIC EVENTS
========================================================= */

function generateBasicEvents(initialBoard) {
const callSeries=[];
    const board =
        cloneBoard(initialBoard);

    const events = [];

    const stats =
        createStats();

    const depthSeries = [];

    function dfs(depth) {

        stats.recursiveCalls++;
callSeries.push(
    stats.recursiveCalls
);
        stats.maxDepth =
            Math.max(
                stats.maxDepth,
                depth
            );

        pushDepth(
            depthSeries,
            depth
        );

        const empty =
            findFirstEmpty(board);

        if (!empty) {

            stats.solved = true;

            pushCompleteEvent(
                events,
                depth
            );

            return true;
        }

        const {
            row,
            col
        } = empty;

        const candidates =
            getCandidates(
                board,
                row,
                col
            );

        pushSelectEvent(
            events,
            row,
            col,
            candidates,
            depth
        );

        for (
            const value
            of candidates
        ) {

            board[row][col] =
                value;

            pushPlaceEvent(
                events,
                row,
                col,
                value,
                depth
            );

            if (
                dfs(depth + 1)
            ) {
                return true;
            }

            board[row][col] = 0;

            stats.backtracks++;

            pushBacktrackEvent(
                events,
                row,
                col,
                value,
                depth
            );
        }

        return false;
    }

    dfs(0);

    return {

 events,

 stats,

 depthSeries,

 callSeries

};
}

/* =========================================================
   GENERATE MRV EVENTS
========================================================= */

function generateMRVEvents(initialBoard) {
const callSeries=[];
    const board =
        cloneBoard(initialBoard);

    const events = [];

    const stats =
        createStats();

    const depthSeries = [];

    function dfs(depth) {

        stats.recursiveCalls++;
        callSeries.push(
    stats.recursiveCalls
);

        stats.maxDepth =
            Math.max(
                stats.maxDepth,
                depth
            );

        pushDepth(
            depthSeries,
            depth
        );

        if (
            isSolved(board)
        ) {

            stats.solved = true;

            pushCompleteEvent(
                events,
                depth
            );

            return true;
        }

        const target =
            findMRVCell(board);

        if (!target) {
            return false;
        }

        const {
            row,
            col,
            candidates
        } = target;

        pushSelectEvent(
            events,
            row,
            col,
            candidates,
            depth
        );

        if (
            candidates.length === 0
        ) {

            stats.backtracks++;

            pushBacktrackEvent(
                events,
                row,
                col,
                null,
                depth
            );

            return false;
        }

        for (
            const value
            of candidates
        ) {

            board[row][col] =
                value;

            pushPlaceEvent(
                events,
                row,
                col,
                value,
                depth
            );

            if (
                dfs(depth + 1)
            ) {
                return true;
            }

            board[row][col] = 0;

            stats.backtracks++;

            pushBacktrackEvent(
                events,
                row,
                col,
                value,
                depth
            );
        }

        return false;
    }

    dfs(0);

    return {
        events,
        stats,
        depthSeries,
        callSeries
    };
}

/* =========================================================
   PREPARE ALGORITHMS
========================================================= */

function prepareAlgorithms(board) {
    

    const naive =
        generateNaiveEvents(board);

    const basic =
        generateBasicEvents(board);

    const mrv =
        generateMRVEvents(board);

        naiveCallSeries =
naive.callSeries;


basicCallSeries =
basic.callSeries;


mrvCallSeries =
mrv.callSeries;

    naiveEvents =
        naive.events;

    basicEvents =
        basic.events;

    mrvEvents =
        mrv.events;

    naiveStats =
        naive.stats;

    basicStats =
        basic.stats;

    mrvStats =
        mrv.stats;

    naiveDepthSeries =
        naive.depthSeries;

    basicDepthSeries =
        basic.depthSeries;

    mrvDepthSeries =
        mrv.depthSeries;

    console.log(
        "Naive Events:",
        naiveEvents.length
    );

    console.log(
        "Basic Events:",
        basicEvents.length
    );

    console.log(
        "MRV Events:",
        mrvEvents.length
    );
}

/* =========================================================
   SOLVE BUTTON ENTRY
========================================================= */

function startGeneration() {

    if (
        animationRunning
    ) {
        return;
    }

    if (
        !validateInputBoard()
    ) {
        return;
    }

    const board =
        getBoardFromInputs();

    if (
        hasInitialConflict(board)
    ) {

        alert(
            "행, 열 또는 2×2 박스 충돌이 있습니다."
        );

        return;
    }

    if (
        !canSolve(board)
    ) {

        alert(
            "이 스도쿠는 해답이 존재하지 않습니다."
        );

        return;
    }

    prepareAlgorithms(board);

    /*
       Part 3에서 구현됨

       startVisualization(board);
    */

    if (
        typeof startVisualization ===
        "function"
    ) {

        startVisualization(
            board
        );
    }
}

solveBtn.addEventListener(
    "click",
    startGeneration
);

/* =========================================================
   PART 2 END
========================================================= */

/*
PART 3 예정

1. Chart.js 초기화
2. 독립 포인터

   naivePointer
   basicPointer
   mrvPointer

3. Animation Scheduler

4. 실시간 보드 갱신

5. 실시간 통계 갱신

6. 실시간 로그 패널

7. 결과 분석 패널

8. startVisualization()

9. 알고리즘 종료 감지

10. 감소율 계산

11. 완료 애니메이션
*/
/* =========================================================
   APP.JS - PART 3
   Visualization Engine
========================================================= */


/* =========================================================
   RUNTIME STATE
========================================================= */

let naivePointer = 0;
let basicPointer = 0;
let mrvPointer = 0;


let naiveRuntimeBoard;
let basicRuntimeBoard;
let mrvRuntimeBoard;


let fixedMap;

let finishedCount = 0;


function checkAllFinished(){

    finishedCount++;


    if(
        finishedCount === 3
    ){

        animationRunning=false;

        showAnalysis();

    }

}

/* =========================================================
   ALGORITHM CONFIG
========================================================= */

const algorithmConfig = {

    naive: {

        name: "Naive",

        events: () =>
            naiveEvents,

        pointer: () =>
            naivePointer,

        board: () =>
            naiveRuntimeBoard,

        element:
            naiveBoardEl
    },


    basic: {

        name: "Basic",

        events: () =>
            basicEvents,

        pointer: () =>
            basicPointer,

        board: () =>
            basicRuntimeBoard,

        element:
            basicBoardEl
    },


    mrv: {

        name: "MRV",

        events: () =>
            mrvEvents,

        pointer: () =>
            mrvPointer,

        board: () =>
            mrvRuntimeBoard,

        element:
            mrvBoardEl
    }
};


/* =========================================================
   CHART INITIALIZATION
========================================================= */

function initChart() {


    const ctx =
        document
            .getElementById(
                "depthChart"
            )
            .getContext("2d");


    if (depthChart) {

        depthChart.destroy();
    }


    depthChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels: [],

                    datasets: [

                        {

                            label:
                                "Naive",

                            data: [],

                            borderColor:
                                "#3b82f6",

                            tension:
                                0.25

                        },


                        {

                            label:
                                "Basic",

                            data: [],

                            borderColor:
                                "#22c55e",

                            tension:
                                0.25

                        },


                        {

                            label:
                                "MRV",

                            data: [],

                            borderColor:
                                "#ef4444",

                            tension:
                                0.25

                        }

                    ]
                },


                options: {

                    responsive:true,

                    maintainAspectRatio:false,

                    plugins: {

                        title: {

                            display:true,

                            text:
                                "재귀 깊이 변화"

                        },

                        legend: {

                            position:
                                "bottom"

                        }
                    },


                    scales: {

                         x:{

    type:"linear",

    title:{
        display:true,
        text:"이벤트 번호"
    }
 },


                        y: {

                            title: {

                                display:true,

                                text:
                                    "재귀 깊이"

                            },

                            beginAtZero:true
                        }
                    }
                }
            }
        );
}


/* =========================================================
   UPDATE CHART
========================================================= */

function updateChart() {


    const maxLength =
        Math.max(

            naiveCallSeries.length,

            basicCallSeries.length,

            mrvCallSeries.length
        );


    const labels =
        Array.from(
            {
                length:maxLength
            },

            (_,i)=>i
        );


    depthChart.data.labels =
        labels;


    depthChart.data.datasets[0]
        .data =
        naiveCallSeries;


    depthChart.data.datasets[1]
        .data =
        basicCallSeries;


    depthChart.data.datasets[2]
        .data =
        mrvCallSeries;



    depthChart.update();
}


/* =========================================================
   LOG SYSTEM
========================================================= */

function clearLogs() {

    logPanel.innerHTML = "";
}


function addLog(
    algorithm,
    event
) {


    const box =
        document.createElement(
            "div"
        );


    box.className =
        `log-entry ${algorithm.toLowerCase()}`;


    let message = "";


    if (
        event.type === "select"
    ) {

        message =
            `
            선택 (${event.row}, ${event.col})
            <br>
            후보 =
            [${event.candidates.join(",")}]
            <br>
            후보 수 =
            ${event.candidateCount}
            `;

    }


    else if (
        event.type === "place"
    ) {

        message =
            `
            숫자 ${event.value}
            배치
            (${event.row},${event.col})
            `;
    }


    else if (
        event.type === "backtrack"
    ) {

        message =
            `
            백트래킹
            ${event.value ?? ""}
            (${event.row},${event.col})
            `;
    }


    else {

        message =
            "완료";
    }


    box.innerHTML =
        `
        <div class="log-title">
            [${algorithm}]
        </div>

        ${message}
        `;


    logPanel.prepend(box);
}


/* =========================================================
   UPDATE STAT PANEL
========================================================= */

function updateStats(
    algorithm,
    event
) {


    stats =
liveStats[algorithm];


    if (
        algorithm === "basic"
    ) {

        stats =
            basicStats;
    }


    if (
        algorithm === "mrv"
    ) {

        stats =
            mrvStats;
    }



    document
        .getElementById(
            `${algorithm}Depth`
        )
        .textContent =
            event.depth ?? 0;



    document
        .getElementById(
            `${algorithm}MaxDepth`
        )
        .textContent =
            stats.maxDepth;



    document
        .getElementById(
            `${algorithm}Calls`
        )
        .textContent =
            stats.recursiveCalls;



    document
        .getElementById(
            `${algorithm}Backtracks`
        )
        .textContent =
            stats.backtracks;



    document
        .getElementById(
            `${algorithm}CurrentCell`
        )
        .textContent =
        event.row !== undefined

            ?
            `(${event.row},${event.col})`

            :
            "-";



    document
        .getElementById(
            `${algorithm}Candidates`
        )
        .textContent =
            event.candidates
            ?
            `[${event.candidates.join(",")}]`
            :
            "-";



    document
        .getElementById(
            `${algorithm}CandidateCount`
        )
        .textContent =
            event.candidateCount ?? 0;



    document
        .getElementById(
            `${algorithm}Trying`
        )
        .textContent =
            event.value ?? "-";
}


/* =========================================================
   APPLY EVENT TO BOARD
========================================================= */

function applyEvent(
    algorithm,
    event
) {


    let board;


    if (
        algorithm === "naive"
    )
        board =
            naiveRuntimeBoard;


    if (
        algorithm === "basic"
    )
        board =
            basicRuntimeBoard;


    if (
        algorithm === "mrv"
    )
        board =
            mrvRuntimeBoard;



    let highlight = null;



    if (
        event.type === "place"
    ) {


        board[event.row][event.col] =
            event.value;


        highlight =
        {

            row:event.row,

            col:event.col,

            className:
                CELL_CLASS.SUCCESS
        };
    }



    if (
        event.type === "backtrack"
    ) {


        if (
            event.row !== undefined
        ) {

            board[event.row][event.col] =
                0;
        }


        highlight =
        {

            row:event.row,

            col:event.col,

            className:
                CELL_CLASS.BACKTRACK
        };
    }



    if (
        event.type === "select"
    ) {


        highlight =
        {

            row:event.row,

            col:event.col,

            className:
                CELL_CLASS.SELECT
        };
    }



    if (
        event.type === "complete"
    ) {

        return;
    }



    renderBoard(

        algorithmConfig[algorithm].element,

        board,

        fixedMap,

        highlight
    );
}



/* =========================================================
   SINGLE ALGORITHM STEP
========================================================= */

function stepAlgorithm(
    algorithm
) {


    let pointer;


    if (
        algorithm === "naive"
    )
        pointer =
            naivePointer;


    if (
        algorithm === "basic"
    )
        pointer =
            basicPointer;


    if (
        algorithm === "mrv"
    )
        pointer =
            mrvPointer;



    const events =
        algorithmConfig[algorithm]
            .events();



    if (
        pointer >= events.length
    ) {

        return false;
    }



    const event =
        events[pointer];



    applyEvent(
        algorithm,
        event
    );


    addLog(
        algorithmConfig[algorithm].name,
        event
    );


    updateStats(
        algorithm,
        event
    );
liveStats[algorithm].recursiveCalls++;

if(event.type==="backtrack"){

    liveStats[algorithm].backtracks++;

}


liveStats[algorithm].maxDepth =
Math.max(
    liveStats[algorithm].maxDepth,
    event.depth ?? 0
);


    if (
        algorithm === "naive"
    )
        naivePointer++;


    if (
        algorithm === "basic"
    )
        basicPointer++;


    if (
        algorithm === "mrv"
    )
        mrvPointer++;

    updateChartLive();

    return true;
}

function updateChartLive(){

    depthChart.data.labels =
        Array.from(
            {
                length:
                Math.max(
                    naivePointer,
                    basicPointer,
                    mrvPointer
                )
            },
            (_,i)=>i
        );


    depthChart.data.datasets[0]
        .data =
        naiveDepthSeries
        .slice(
            0,
            naivePointer
        );


    depthChart.data.datasets[1]
        .data =
        basicDepthSeries
        .slice(
            0,
            basicPointer
        );


    depthChart.data.datasets[2]
        .data =
        mrvDepthSeries
        .slice(
            0,
            mrvPointer
        );


    depthChart.update();
}

/* =========================================================
   ANIMATION LOOP
========================================================= */

function startVisualization(board) {

    liveStats = {

    naive:createStats(),

    basic:createStats(),

    mrv:createStats()

};
    finishedCount=0;

    animationRunning = true;


    clearLogs();


    naivePointer = 0;
    basicPointer = 0;
    mrvPointer = 0;


    naiveRuntimeBoard =
        cloneBoard(board);

    basicRuntimeBoard =
        cloneBoard(board);

    mrvRuntimeBoard =
        cloneBoard(board);



    fixedMap =
        createFixedMap(board);



    renderBoard(
        naiveBoardEl,
        naiveRuntimeBoard,
        fixedMap
    );


    renderBoard(
        basicBoardEl,
        basicRuntimeBoard,
        fixedMap
    );


    renderBoard(
        mrvBoardEl,
        mrvRuntimeBoard,
        fixedMap
    );



    initChart();


    updateChart();



    runIndependent(
        "naive"
    );


    runIndependent(
        "basic"
    );


    runIndependent(
        "mrv"
    );

}



/* =========================================================
   RESULT ANALYSIS
========================================================= */

function percentDecrease(
    original,
    current
){

    if(original===0){
        return 0;
    }


    return (
        (1 - current/original)
        *100
    ).toFixed(1);

}



function showAnalysis() {


    analysisContent.innerHTML =

    `

    <div class="analysis-grid">


        <div class="analysis-result">

            <h3>
            Naive
            </h3>

            <p>
            호출:
            ${liveStats.naive.recursiveCalls}
            </p>

            <p>
            백트래킹:
            ${liveStats.naive.backtracks}
            </p>

            <p>
            최대 깊이:
            ${liveStats.naive.maxDepth}
            </p>

        </div>



        <div class="analysis-result">

            <h3>
            Basic
            </h3>

            <p>
            호출:
            ${liveStats.basic.recursiveCalls}
            </p>

            <p>
            백트래킹:
            ${basicStats.backtracks}
            </p>


            <p class="reduction">

            감소율:
${percentDecrease(
    liveStats.basic.recursiveCalls,
    liveStats.mrv.recursiveCalls
)}%

            </p>

        </div>




        <div class="analysis-result">

            <h3>
            MRV
            </h3>

            <p>
            호출:
            ${liveStats.mrv.recursiveCalls}
            </p>


            <p>
            백트래킹:
            ${mrvStats.backtracks}
            </p>


            <p class="reduction">

            감소율:
            ${percentDecrease(
    liveStats.naive.recursiveCalls,
    liveStats.basic.recursiveCalls
)}%

            </p>

        </div>


    </div>

    `;
}

function runIndependent(
    algorithm
){

    const running =
        stepAlgorithm(
            algorithm
        );


    if(running){

        setTimeout(

            () => {

                runIndependent(
                    algorithm
                );

            },

            animationDelay

        );

    }
    else{

        checkAllFinished();

    }

}


/* =========================================================
   END
========================================================= */
