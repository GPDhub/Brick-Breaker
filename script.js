class BrickBreakerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // ゲーム状態
        this.gameState = 'stopped'; // 'stopped', 'running', 'paused', 'gameOver'
        this.score = 0;
        this.lives = 3;
        this.animationId = null;
        
        // パドル設定
        this.paddle = {
            width: 80,
            height: 12,
            x: this.canvas.width / 2 - 40,
            y: this.canvas.height - 30,
            speed: 6,
            dx: 0
        };
        
        // ボール設定
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            dx: 6,
            dy: 6,
            speed: 6
        };
        
        // ブロック設定
        this.bricks = [];
        this.brickRows = 6;
        this.brickCols = 8;
        this.brickWidth = 45;
        this.brickHeight = 20;
        this.brickPadding = 3;
        this.brickOffsetTop = 50;
        this.brickOffsetLeft = 10;
        
        // 入力状態
        this.keys = {};
        this.touchStartX = 0;
        
        this.initializeEventListeners();
        this.initializeBricks();
        this.draw();
    }
    
    initializeEventListeners() {
        // ボタンイベント
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // タッチイベント（モバイル対応）
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // マウスイベント（PC操作）
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    initializeBricks() {
        this.bricks = [];
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
        
        for (let r = 0; r < this.brickRows; r++) {
            for (let c = 0; c < this.brickCols; c++) {
                this.bricks.push({
                    x: c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
                    y: r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
                    width: this.brickWidth,
                    height: this.brickHeight,
                    color: colors[r],
                    visible: true,
                    points: (this.brickRows - r) * 10
                });
            }
        }
    }
    
    startGame() {
        if (this.gameState === 'stopped' || this.gameState === 'gameOver') {
            this.resetGame();
        }
        this.gameState = 'running';
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        this.gameLoop();
    }
    
    togglePause() {
        if (this.gameState === 'running') {
            this.gameState = 'paused';
            document.getElementById('pauseBtn').textContent = '再開';
        } else if (this.gameState === 'paused') {
            this.gameState = 'running';
            document.getElementById('pauseBtn').textContent = '一時停止';
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameState = 'stopped';
        this.score = 0;
        this.lives = 3;
        
        // パドルとボールの位置をリセット
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = 6;
        this.ball.dy = 6;
        
        // ブロックをリセット
        this.initializeBricks();
        
        // UIの更新
        this.updateUI();
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = 'ゲーム開始';
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '一時停止';
        
        // アニメーションをキャンセル
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.draw();
    }
    
    gameLoop() {
        if (this.gameState !== 'running') return;
        
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // パドルの移動
        this.updatePaddle();
        
        // ボールの移動
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // 壁との衝突判定
        this.checkWallCollision();
        
        // パドルとの衝突判定
        this.checkPaddleCollision();
        
        // ブロックとの衝突判定
        this.checkBrickCollision();
        
        // ゲームオーバー判定
        this.checkGameOver();
        
        // 勝利判定
        this.checkWin();
    }
    
    updatePaddle() {
        // キーボード入力
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.paddle.dx = -this.paddle.speed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.paddle.dx = this.paddle.speed;
        } else {
            this.paddle.dx = 0;
        }
        
        // パドルの移動
        this.paddle.x += this.paddle.dx;
        
        // 画面端での制限
        if (this.paddle.x < 0) {
            this.paddle.x = 0;
        } else if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }
    }
    
    checkWallCollision() {
        // 左右の壁
        if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= this.canvas.width) {
            this.ball.dx = -this.ball.dx;
        }
        
        // 上の壁
        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.dy = -this.ball.dy;
        }
        
        // 下の壁（ライフ減少）
        if (this.ball.y + this.ball.radius >= this.canvas.height) {
            this.lives--;
            this.resetBall();
            
            if (this.lives <= 0) {
                this.gameOver();
            }
        }
    }
    
    checkPaddleCollision() {
        if (this.ball.x >= this.paddle.x && 
            this.ball.x <= this.paddle.x + this.paddle.width &&
            this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height) {
            
            // パドルの中央からの距離に応じて角度を変更
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPos - 0.5) * Math.PI / 3; // -60度から60度
            
            this.ball.dx = Math.sin(angle) * this.ball.speed;
            this.ball.dy = -Math.abs(Math.cos(angle) * this.ball.speed);
        }
    }
    
    checkBrickCollision() {
        for (let brick of this.bricks) {
            if (!brick.visible) continue;
            
            if (this.ball.x + this.ball.radius >= brick.x &&
                this.ball.x - this.ball.radius <= brick.x + brick.width &&
                this.ball.y + this.ball.radius >= brick.y &&
                this.ball.y - this.ball.radius <= brick.y + brick.height) {
                
                brick.visible = false;
                this.score += brick.points;
                this.ball.dy = -this.ball.dy;
                
                // 速度は一定に保つ（速度アップ機能を無効化）
                
                break;
            }
        }
    }
    
    checkGameOver() {
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    checkWin() {
        if (this.bricks.every(brick => !brick.visible)) {
            this.gameState = 'gameOver';
            alert(`ゲームクリア！\nスコア: ${this.score}`);
            this.resetGame();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        alert(`ゲームオーバー\nスコア: ${this.score}`);
        this.resetGame();
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 100;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = -this.ball.speed;
    }
    
    draw() {
        // 背景をクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景色
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // パドルを描画
        this.drawPaddle();
        
        // ボールを描画
        this.drawBall();
        
        // ブロックを描画
        this.drawBricks();
        
        // UIを更新
        this.updateUI();
    }
    
    drawPaddle() {
        const gradient = this.ctx.createLinearGradient(0, this.paddle.y, 0, this.paddle.y + this.paddle.height);
        gradient.addColorStop(0, '#ecf0f1');
        gradient.addColorStop(1, '#bdc3c7');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // パドルの枠線
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    }
    
    drawBall() {
        const gradient = this.ctx.createRadialGradient(
            this.ball.x - 3, this.ball.y - 3, 0,
            this.ball.x, this.ball.y, this.ball.radius
        );
        gradient.addColorStop(0, '#f39c12');
        gradient.addColorStop(1, '#e67e22');
        
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#d35400';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.closePath();
    }
    
    drawBricks() {
        for (let brick of this.bricks) {
            if (!brick.visible) continue;
            
            // グラデーション効果
            const gradient = this.ctx.createLinearGradient(0, brick.y, 0, brick.y + brick.height);
            gradient.addColorStop(0, brick.color);
            gradient.addColorStop(1, this.darkenColor(brick.color, 0.3));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // 枠線
            this.ctx.strokeStyle = '#34495e';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
    }
    
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    updateUI() {
        document.getElementById('score').textContent = `スコア: ${this.score}`;
        document.getElementById('lives').textContent = `ライフ: ${this.lives}`;
    }
    
    // イベントハンドラー
    handleKeyDown(e) {
        this.keys[e.code] = true;
        e.preventDefault();
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        e.preventDefault();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchStartX) return;
        
        const touchX = e.touches[0].clientX;
        const diff = touchX - this.touchStartX;
        
        if (Math.abs(diff) > 10) {
            this.paddle.x += diff * 0.5;
            this.touchStartX = touchX;
            
            // 画面端での制限
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvas.width) {
                this.paddle.x = this.canvas.width - this.paddle.width;
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touchStartX = 0;
    }
    
    handleMouseMove(e) {
        if (this.gameState !== 'running') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.paddle.x = mouseX - this.paddle.width / 2;
        
        // 画面端での制限
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new BrickBreakerGame();
});