class SudokuGame {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.selectedNumber = null;
        this.timer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.difficulty = 'easy';
        
        this.initializeElements();
        this.bindEvents();
        this.createGrid();
        this.newGame();
    }
    
    initializeElements() {
        this.gridElement = document.getElementById('sudoku-grid');
        this.timerElement = document.getElementById('timer');
        this.difficultyElement = document.getElementById('difficulty');
        this.messageElement = document.getElementById('message');
        this.messagePanelElement = document.getElementById('message-panel');
        
        this.difficultySelect = document.getElementById('difficulty-select');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.solutionBtn = document.getElementById('solution-btn');
        
        this.eraseBtn = document.getElementById('erase-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.validateBtn = document.getElementById('validate-btn');
        
        this.victoryModal = document.getElementById('victory-modal');
        this.finalTimeElement = document.getElementById('final-time');
        this.finalDifficultyElement = document.getElementById('final-difficulty');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');
    }
    
    bindEvents() {
        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.updateDifficultyDisplay();
        });
        
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.solutionBtn.addEventListener('click', () => this.showSolution());
        
        this.eraseBtn.addEventListener('click', () => this.eraseCell());
        this.hintBtn.addEventListener('click', () => this.giveHint());
        this.validateBtn.addEventListener('click', () => this.validateBoard());
        
        this.playAgainBtn.addEventListener('click', () => {
            this.victoryModal.style.display = 'none';
            this.newGame();
        });
        
        this.closeModalBtn.addEventListener('click', () => {
            this.victoryModal.style.display = 'none';
        });
        
        // 數字按鈕事件
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectNumber(parseInt(e.target.dataset.number));
            });
        });
    }
    
    createGrid() {
        this.gridElement.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => {
                    this.selectCell(row, col);
                });
                
                this.gridElement.appendChild(cell);
            }
        }
    }
    
    selectCell(row, col) {
        // 清除之前的選中狀態
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
        });
        
        this.selectedCell = { row, col };
        
        // 選中當前格子
        const currentCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        currentCell.classList.add('selected');
        
        // 高亮顯示同行、同列和同個3x3區塊
        this.highlightRelatedCells(row, col);
    }
    
    highlightRelatedCells(row, col) {
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                
                // 高亮同行
                if (r === row && c !== col) {
                    cell.classList.add('highlight-row');
                }
                
                // 高亮同列
                if (c === col && r !== row) {
                    cell.classList.add('highlight-col');
                }
                
                // 高亮同個3x3區塊
                if (r >= boxRow && r < boxRow + 3 && 
                    c >= boxCol && c < boxCol + 3 && 
                    (r !== row || c !== col)) {
                    cell.classList.add('highlight-box');
                }
            }
        }
    }
    
    selectNumber(number) {
        // 清除之前選中的數字按鈕
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 選中新的數字按鈕
        document.querySelector(`[data-number="${number}"]`).classList.add('selected');
        this.selectedNumber = number;
        
        // 只有在同時選中了格子且格子不是初始數字時，才填入數字
        if (this.selectedCell && !this.initialBoard[this.selectedCell.row][this.selectedCell.col]) {
            this.fillCell(this.selectedCell.row, this.selectedCell.col, number);
        } else if (!this.selectedCell) {
            this.showMessage('請先選擇一個格子', 'info');
            setTimeout(() => this.clearMessage(), 2000);
        } else if (this.initialBoard[this.selectedCell.row][this.selectedCell.col]) {
            this.showMessage('無法修改初始數字', 'error');
            setTimeout(() => this.clearMessage(), 2000);
        }
    }
    
    fillCell(row, col, number) {
        if (this.initialBoard[row][col]) return; // 不能修改初始數字
        
        this.board[row][col] = number;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = number;
        
        // 檢查是否有衝突
        if (this.hasConflict(row, col, number)) {
            cell.classList.add('error');
            this.showMessage('數字衝突！', 'error');
        } else {
            cell.classList.remove('error');
            this.clearMessage();
        }
        
        // 檢查是否完成遊戲
        if (this.isGameComplete()) {
            this.gameWin();
        }
    }
    
    eraseCell() {
        if (!this.selectedCell) {
            this.showMessage('請先選擇一個格子', 'info');
            return;
        }
        
        const { row, col } = this.selectedCell;
        
        if (this.initialBoard[row][col]) {
            this.showMessage('無法清除初始數字', 'error');
            return;
        }
        
        this.board[row][col] = 0;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = '';
        cell.classList.remove('error');
        this.clearMessage();
    }
    
    hasConflict(row, col, number) {
        // 檢查同行
        for (let c = 0; c < 9; c++) {
            if (c !== col && this.board[row][c] === number) {
                return true;
            }
        }
        
        // 檢查同列
        for (let r = 0; r < 9; r++) {
            if (r !== row && this.board[r][col] === number) {
                return true;
            }
        }
        
        // 檢查同個3x3區塊
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r !== row && c !== col && this.board[r][c] === number) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    isGameComplete() {
        // 檢查是否所有格子都填滿
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // 檢查是否有衝突
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.hasConflict(row, col, this.board[row][col])) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    gameWin() {
        this.stopTimer();
        this.finalTimeElement.textContent = this.timerElement.textContent;
        this.finalDifficultyElement.textContent = this.getDifficultyText();
        this.victoryModal.style.display = 'flex';
    }
    
    giveHint() {
        const emptyCells = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) {
            this.showMessage('遊戲已完成！', 'success');
            return;
        }
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;
        const correctNumber = this.solution[row][col];
        
        this.board[row][col] = correctNumber;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = correctNumber;
        cell.style.backgroundColor = '#c6f6d5';
        
        setTimeout(() => {
            cell.style.backgroundColor = '';
        }, 2000);
        
        this.showMessage('給了你一個提示！', 'success');
        
        if (this.isGameComplete()) {
            this.gameWin();
        }
    }
    
    validateBoard() {
        const errors = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] !== 0) {
                    if (this.hasConflict(row, col, this.board[row][col])) {
                        errors.push({ row, col });
                    }
                }
            }
        }
        
        // 清除之前的錯誤標記
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('error');
        });
        
        // 標記錯誤
        errors.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('error');
        });
        
        if (errors.length === 0) {
            this.showMessage('目前沒有錯誤！', 'success');
        } else {
            this.showMessage(`發現 ${errors.length} 個錯誤`, 'error');
        }
    }
    
    showSolution() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.board[row][col] = this.solution[row][col];
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.textContent = this.solution[row][col];
                cell.classList.remove('error');
            }
        }
        
        this.showMessage('已顯示完整答案', 'info');
        this.stopTimer();
    }
    
    generateSudoku() {
        // 重置棋盤
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        
        // 生成完整的數獨解答
        this.solveSudoku(this.solution);
        
        // 複製解答到棋盤
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.board[row][col] = this.solution[row][col];
            }
        }
        
        // 根據難度移除數字
        const cellsToRemove = this.getCellsToRemove();
        const cells = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                cells.push({ row, col });
            }
        }
        
        // 隨機打亂格子順序
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        
        // 移除指定數量的數字
        for (let i = 0; i < cellsToRemove && i < cells.length; i++) {
            const { row, col } = cells[i];
            this.board[row][col] = 0;
        }
        
        // 保存初始狀態
        this.initialBoard = this.board.map(row => [...row]);
    }
    
    solveSudoku(board) {
        const findEmpty = () => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        return { row, col };
                    }
                }
            }
            return null;
        };
        
        const isValid = (row, col, number) => {
            // 檢查同行
            for (let c = 0; c < 9; c++) {
                if (board[row][c] === number) {
                    return false;
                }
            }
            
            // 檢查同列
            for (let r = 0; r < 9; r++) {
                if (board[r][col] === number) {
                    return false;
                }
            }
            
            // 檢查同個3x3區塊
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    if (board[r][c] === number) {
                        return false;
                    }
                }
            }
            
            return true;
        };
        
        const empty = findEmpty();
        if (!empty) {
            return true; // 已完成
        }
        
        const { row, col } = empty;
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // 隨機打亂數字順序
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        for (let number of numbers) {
            if (isValid(row, col, number)) {
                board[row][col] = number;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }
    
    getCellsToRemove() {
        switch (this.difficulty) {
            case 'easy': return 40;
            case 'medium': return 50;
            case 'hard': return 55;
            default: return 40;
        }
    }
    
    getDifficultyText() {
        switch (this.difficulty) {
            case 'easy': return '簡單';
            case 'medium': return '中等';
            case 'hard': return '困難';
            default: return '簡單';
        }
    }
    
    updateDifficultyDisplay() {
        this.difficultyElement.textContent = this.getDifficultyText();
    }
    
    renderBoard() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const value = this.board[row][col];
                
                if (value !== 0) {
                    cell.textContent = value;
                    if (this.initialBoard[row][col] !== 0) {
                        cell.classList.add('fixed');
                    }
                } else {
                    cell.textContent = '';
                    cell.classList.remove('fixed');
                }
                
                cell.classList.remove('error', 'selected', 'highlight-row', 'highlight-col', 'highlight-box');
            }
        }
    }
    
    newGame() {
        this.generateSudoku();
        this.renderBoard();
        this.resetTimer();
        this.startTimer();
        this.selectedCell = null;
        this.selectedNumber = null;
        this.clearMessage();
        
        // 清除選中狀態
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.showMessage('新遊戲開始！', 'success');
        setTimeout(() => this.clearMessage(), 2000);
    }
    
    resetGame() {
        // 重置到初始狀態
        this.board = this.initialBoard.map(row => [...row]);
        this.renderBoard();
        this.resetTimer();
        this.startTimer();
        this.selectedCell = null;
        this.selectedNumber = null;
        this.clearMessage();
        
        // 清除選中狀態
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.showMessage('遊戲已重置', 'info');
        setTimeout(() => this.clearMessage(), 2000);
    }
    
    togglePause() {
        if (this.isPaused) {
            this.startTimer();
            this.pauseBtn.textContent = '暫停';
            this.showMessage('遊戲繼續', 'info');
        } else {
            this.stopTimer();
            this.pauseBtn.textContent = '繼續';
            this.showMessage('遊戲暫停', 'info');
        }
        
        this.isPaused = !this.isPaused;
        setTimeout(() => this.clearMessage(), 1000);
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    resetTimer() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
    }
    
    clearMessage() {
        this.messageElement.textContent = '';
        this.messageElement.className = 'message';
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});