class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // パドルの設定
        this.paddle = {
            x: this.canvas.width / 2 - 50,
            y: this.canvas.height - 20,
            width: 100,
            height: 10,
            speed: 7,
            dx: 0
        };

        // ボールの設定
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 30,
            radius: 8,
            speedX: 4,
            speedY: -4
        };

        // ブロックの設定
        this.blocks = [];
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;

        this.initializeBlocks();
        this.attachEventListeners();
    }

    initializeBlocks() {
        const rows = 5;
        const cols = 10;
        const blockWidth = 60;
        const blockHeight = 20;
        const padding = 10;
        const offsetX = (this.canvas.width - (blockWidth * cols + padding * (cols - 1))) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.blocks.push({
                    x: offsetX + col * (blockWidth + padding),
                    y: row * (blockHeight + padding) + 50,
                    width: blockWidth,
                    height: blockHeight,
                    visible: true
                });
            }
        }
    }

    attachEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.paddle.dx = -this.paddle.speed;
                    break;
                case 'ArrowRight':
                    this.paddle.dx = this.paddle.speed;
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.gameStarted) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.paddle.dx = 0;
            }
        });

        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('restartGame').addEventListener('click', () => this.restartGame());
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        this.initializeBlocks();
        this.updateScore();
        
        // ゲーム開始画面を非表示
        const startScreen = document.querySelector('.start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }
        
        this.gameLoop();
    }

    restartGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        
        // ゲームオーバースクリーンを非表示
        const gameOverScreen = document.querySelector('.game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        this.initializeBlocks();
        this.updateScore();
        
        // パドルとボールを初期位置に戻す
        this.paddle.x = this.canvas.width / 2 - 50;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 30;
        this.ball.speedX = 4;
        this.ball.speedY = -4;
        
        this.gameLoop();
    }

    updateScore() {
        document.getElementById('scoreValue').textContent = this.score;
    }

    update() {
        // パドルの移動
        this.paddle.x += this.paddle.dx;

        // パドルが画面外に出ないように
        if (this.paddle.x < 0) {
            this.paddle.x = 0;
        } else if (this.paddle.x > this.canvas.width - this.paddle.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }

        // ボールの移動
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;

        // ボールの壁との衝突判定
        if (this.ball.x + this.ball.radius > this.canvas.width || 
            this.ball.x - this.ball.radius < 0) {
            this.ball.speedX *= -1;
        }

        if (this.ball.y - this.ball.radius < 0) {
            this.ball.speedY *= -1;
        }

        // ボールが下に落ちた場合
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.gameOver = true;
            this.gameOverScreen();
        }

        // パドルとの衝突判定
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y + this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            this.ball.speedY *= -1;
            // パドルの位置に応じてボールの角度を調整
            const paddleCenter = this.paddle.x + this.paddle.width / 2;
            const ballCenter = this.ball.x;
            const distanceFromCenter = ballCenter - paddleCenter;
            const angle = (distanceFromCenter / (this.paddle.width / 2)) * 0.5;
            this.ball.speedX = this.ball.speedX + angle;
        }

        // ブロックとの衝突判定
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            if (block.visible && 
                this.ball.x + this.ball.radius > block.x &&
                this.ball.x - this.ball.radius < block.x + block.width &&
                this.ball.y + this.ball.radius > block.y &&
                this.ball.y - this.ball.radius < block.y + block.height) {
                
                // スコアを更新
                this.score += 10;
                this.updateScore();
                
                // ブロックを非表示にする
                block.visible = false;

                // 衝突角度による反転
                const ballCenterX = this.ball.x;
                const blockCenterX = block.x + block.width / 2;
                const ballCenterY = this.ball.y;
                const blockCenterY = block.y + block.height / 2;

                const dx = ballCenterX - blockCenterX;
                const dy = ballCenterY - blockCenterY;

                if (Math.abs(dx) > Math.abs(dy)) {
                    this.ball.speedX *= -1;
                } else {
                    this.ball.speedY *= -1;
                }

                break;
            }
        }

        // 全てのブロックを破壊した場合
        if (this.blocks.every(block => !block.visible)) {
            this.gameOver = true;
            this.gameOverScreen();
        }
    }

    draw() {
        // 背景をクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // パドルを描画
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        // ボールを描画
        this.ctx.fillStyle = '#FF9800';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // ブロックを描画
        this.ctx.fillStyle = '#4CAF50';
        for (let block of this.blocks) {
            if (block.visible) {
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
            }
        }
    }

    gameLoop() {
        if (!this.gameOver && this.gameStarted) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    gameOverScreen() {
        const gameOverScreen = document.querySelector('.game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'block';
            document.getElementById('finalScore').textContent = this.score;
            this.gameStarted = false;
        }
    }
}

// ゲームの初期化
const game = new Game();

// ゲーム開始画面の表示
const startScreen = document.querySelector('.start-screen');
if (startScreen) {
    startScreen.style.display = 'block';
}

// ゲーム開始ボタンのイベントリスナー
document.getElementById('startGame').addEventListener('click', () => {
    game.startGame();
});

// ゲーム再試行ボタンのイベントリスナー
document.getElementById('restartGame').addEventListener('click', () => {
    game.restartGame();
});
