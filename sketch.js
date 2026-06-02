let stars = [];
let bombs = [];
let missiles = [];
let explosions = [];
const palette = ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'];
let lastSpawnTime = 0;
let lastBombSpawnTime = 0;
let score = 0;
let startTime;
const gameDuration = 30; // 遊戲時間 30 秒
let gameState = "PLAYING"; // 狀態：PLAYING, GAME_OVER, GAME_WIN, ENDED
let shakeIntensity = 0; // 畫面震動強度

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetGame();
}

function resetGame() {
  stars = [];
  bombs = [];
  missiles = [];
  explosions = [];
  score = 0;
  startTime = millis();
  lastSpawnTime = millis();
  lastBombSpawnTime = millis();
  shakeIntensity = 0;
  gameState = "PLAYING";
  for (let i = 0; i < 20; i++) {
    stars.push(new Star(random(width), random(height)));
  }
  for (let i = 0; i < 5; i++) {
    bombs.push(new Bomb(random(width), random(height)));
  }
  noStroke();
}

function draw() {
  if (gameState === "PLAYING") {
    // 背景淡淡的拖影效果
    background(10, 20, 40, 60); 

    // 處理畫面震動
    push();
    if (shakeIntensity > 0.1) {
      // 產生隨機位移
      translate(random(-shakeIntensity, shakeIntensity), random(-shakeIntensity, shakeIntensity));
      // 強度逐漸衰減
      shakeIntensity *= 0.9;
    }

    // 倒數計時邏輯
    let elapsed = (millis() - startTime) / 1000;
    let remaining = ceil(gameDuration - elapsed);
    if (remaining <= 0) {
      remaining = 0;
      gameState = "GAME_OVER";
    }

    // 分數達到 100 分通關
    if (score >= 100) {
      gameState = "GAME_WIN";
    }

    // 每隔三秒產生一個物件
    if (millis() - lastSpawnTime > 3000) {
      stars.push(new Star(random(width), random(height)));
      lastSpawnTime = millis();
    }

    // 每隔五秒產生一個陷阱炸彈
    if (millis() - lastBombSpawnTime > 5000) {
      bombs.push(new Bomb(random(width), random(height)));
      lastBombSpawnTime = millis();
    }

    // 處理爆炸粒子
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].update();
      explosions[i].display();
      if (explosions[i].lifespan <= 0) {
        explosions.splice(i, 1);
      }
    }

    // 處理飛彈發射與碰撞
    for (let i = missiles.length - 1; i >= 0; i--) {
      let m = missiles[i];
      m.update();
      m.display();
      let hit = false;

      // 檢查飛彈是否擊中星星
      for (let j = stars.length - 1; j >= 0; j--) {
        let s = stars[j];
        let d = dist(m.pos.x, m.pos.y, s.pos.x, s.pos.y);
        if (d < s.size * 0.5) {
          // 產生爆炸效果
          for (let k = 0; k < 20; k++) {
            explosions.push(new ExplosionParticle(s.pos.x, s.pos.y, s.color));
          }
          score += 10; // 打爆星星加10分
          stars.splice(j, 1); // 星星消失
          missiles.splice(i, 1); // 飛彈消失
          hit = true;
          break;
        }
      }

      if (hit) continue;

      // 檢查飛彈是否擊中陷阱炸彈
      for (let j = bombs.length - 1; j >= 0; j--) {
        let b = bombs[j];
        let d = dist(m.pos.x, m.pos.y, b.pos.x, b.pos.y);
        if (d < b.size * 0.5) {
          for (let k = 0; k < 30; k++) {
            explosions.push(new ExplosionParticle(b.pos.x, b.pos.y, '#ff0000'));
          }
          score -= 5; // 命中陷阱扣5分
          shakeIntensity = 15; // 設定震動強度
          bombs.splice(j, 1);
          missiles.splice(i, 1);
          break;
        }
      }

      // 移除超出螢幕的飛彈
      if (m && (m.pos.x < 0 || m.pos.x > width || m.pos.y < 0 || m.pos.y > height)) {
        missiles.splice(i, 1);
      }
    }

    // 處理炸彈更新與顯示
    for (let b of bombs) {
      b.update();
      b.display();
    }

    // 處理星星
    for (let i = 0; i < stars.length; i++) {
      let s = stars[i];
      for (let j = i + 1; j < stars.length; j++) {
        s.checkCollision(stars[j]);
      }
      s.update();
      s.display();
    }

    // 繪製中心旋轉砲台
    drawTurret();

    pop(); // 結束震動的影響範圍

    // 顯示 UI（分數與時間）
    drawUI(remaining);

  } else if (gameState === "GAME_OVER") {
    drawGameOver();
  } else if (gameState === "GAME_WIN") {
    drawGameWin();
  } else if (gameState === "ENDED") {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("遊戲結束，謝謝遊玩！", width / 2, height / 2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawUI(remaining) {
  push();
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 20, 20);
  text(`Time: ${remaining}s`, 20, 50);
  pop();
}

function drawGameOver() {
  push();
  background(10, 20, 40, 200); // 稍微暗化的背景
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(50);
  text("時間到！", width / 2, height / 2 - 80);
  textSize(30);
  text(`最終分數: ${score}`, width / 2, height / 2 - 20);
  
  // 繪製互動按鈕
  textSize(20);
  // 再玩一次按鈕
  fill(0, 119, 182);
  rectMode(CENTER);
  rect(width / 2 - 80, height / 2 + 60, 120, 40, 10);
  fill(255);
  text("再玩一次", width / 2 - 80, height / 2 + 60);
  
  // 結束遊戲按鈕
  fill(186, 0, 0);
  rect(width / 2 + 80, height / 2 + 60, 120, 40, 10);
  fill(255);
  text("結束遊戲", width / 2 + 80, height / 2 + 60);
  pop();
}

function drawGameWin() {
  push();
  background(10, 20, 40, 150); // 稍微透明的背景以觀察特效
  
  // 通關特效：隨機在畫面上產生慶祝用的煙火粒子
  if (frameCount % 15 === 0) {
    let rx = random(width);
    let ry = random(height);
    let rc = color(random(palette));
    for (let k = 0; k < 20; k++) {
      explosions.push(new ExplosionParticle(rx, ry, rc));
    }
  }

  // 更新並繪製所有粒子
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].display();
    if (explosions[i].lifespan <= 0) {
      explosions.splice(i, 1);
    }
  }

  fill(255, 215, 0); // 金色
  textAlign(CENTER, CENTER);
  textSize(64);
  text("★ 通關完成 ★", width / 2, height / 2 - 80);
  
  fill(0, 180, 216);
  rectMode(CENTER);
  rect(width / 2, height / 2 + 80, 200, 50, 15);
  fill(255);
  textSize(24);
  text("重新開始", width / 2, height / 2 + 80);
  pop();
}

function drawTurret() {
  push();
  translate(width / 2, height / 2);

  // 繪製砲台底座 (不隨滑鼠旋轉)
  stroke(150);
  strokeWeight(2);
  fill(60);
  ellipse(0, 0, 80, 80);

  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  
  // 繪製砲管 (隨滑鼠旋轉)
  fill(100);
  rect(0, -15, 60, 30, 5);
  
  // 繪製砲塔上方圓蓋
  fill(80);
  ellipse(0, 0, 50, 50);
  pop();
}

function mousePressed() {
  if (gameState === "PLAYING" && mouseButton === LEFT) {
    let angle = atan2(mouseY - height / 2, mouseX - width / 2);
    missiles.push(new Missile(width / 2, height / 2, angle));
  } else if (gameState === "GAME_OVER") {
    // 簡單的點擊範圍偵測
    if (mouseY > height / 2 + 40 && mouseY < height / 2 + 80) {
      // 再玩一次
      if (mouseX > width / 2 - 140 && mouseX < width / 2 - 20) {
        resetGame();
      } 
      // 結束遊戲
      else if (mouseX > width / 2 + 20 && mouseX < width / 2 + 140) {
        gameState = "ENDED";
      }
    }
  } else if (gameState === "GAME_WIN") {
    // 偵測「重新開始」按鈕點擊
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height / 2 + 55 && mouseY < height / 2 + 105) {
      resetGame();
    }
  }
}

class Star {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
    this.baseSize = random(40, 80);
    this.size = this.baseSize;
    this.color = color(random(palette));
    this.angle = random(TWO_PI);
    this.isScared = false;
  }

  update() {
    let mouse = createVector(mouseX, mouseY);
    let dir = p5.Vector.sub(this.pos, mouse);
    let distance = dir.mag();

    // 邊界檢查與反彈
    if (this.pos.x < 0 || this.pos.x > width) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, 0, width);
    }
    if (this.pos.y < 0 || this.pos.y > height) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, 0, height);
    }

    // 平時隨機移動
    if (!this.isScared) {
      this.vel.add(p5.Vector.random2D().mult(0.5));
      this.vel.limit(8);
    }

    // 判斷是否受驚嚇
    if (distance < 150) {
      this.isScared = true;
      // 向外跳開的推力
      dir.normalize();
      dir.mult(5); 
      this.vel.add(dir);
    } else {
      this.isScared = false;
    }

    this.pos.add(this.vel);
    this.vel.mult(0.99); // 極低阻力
  }

  // 檢查與另一個星星的碰撞
  checkCollision(other) {
    let distVect = p5.Vector.sub(other.pos, this.pos);
    let distMag = distVect.mag();
    let minDist = (this.size + other.size) * 0.4; // 碰撞半徑

    if (distMag < minDist) {
      // 簡單的彈性碰撞反彈邏輯
      let angle = distVect.heading();
      let targetX = this.pos.x + cos(angle) * minDist;
      let targetY = this.pos.y + sin(angle) * minDist;
      
      // 計算排斥力
      let push = p5.Vector.sub(this.pos, other.pos);
      push.normalize();
      this.vel.add(push);
      other.vel.sub(push);
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // 繪製圓弧星星主體
    fill(this.color);
    this.drawRoundedStar(0, 0, this.size * 0.5, this.size, 5);

    // 計算眼睛看向滑鼠的方向
    let angleToMouse = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
    let eyeDist = this.size * 0.15;
    let pupilSize = this.isScared ? this.size * 0.15 : this.size * 0.1;

    // 左眼
    this.drawEye(-this.size * 0.2, -this.size * 0.1, angleToMouse, pupilSize);
    // 右眼
    this.drawEye(this.size * 0.2, -this.size * 0.1, angleToMouse, pupilSize);

    // 繪製嘴巴
    if (this.isScared) {
      // 驚嚇時嘴巴打開：使用深色填充
      fill(0, 80);
      stroke(255, 180);
      strokeWeight(1);
      ellipse(0, this.size * 0.2, this.size * 0.15, this.size * 0.15);
    } else {
      noFill();
      stroke(255, 150);
      strokeWeight(2);
      // 平時的微笑
      arc(0, this.size * 0.15, this.size * 0.3, this.size * 0.2, 0, PI);
    }
    noStroke();

    pop();
  }

  // 繪製眼睛與轉動的眼球
  drawEye(x, y, angle, pSize) {
    push();
    translate(x, y);
    fill(255);
    ellipse(0, 0, this.size * 0.3, this.size * 0.3); // 眼白
    
    // 眼球位置跟隨滑鼠
    let offsetX = cos(angle) * (this.size * 0.05);
    let offsetY = sin(angle) * (this.size * 0.05);
    
    fill(0);
    ellipse(offsetX, offsetY, pSize, pSize); // 黑眼球
    pop();
  }

  // 自定義圓弧星星函數
  drawRoundedStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      // 外部頂點（使用二次貝茲曲線達到圓弧效果）
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      
      // 控制點與下一個內部頂點
      let cx = x + cos(a + halfAngle * 0.5) * radius2 * 1.1; 
      let cy = y + sin(a + halfAngle * 0.5) * radius2 * 1.1;
      
      let mx = x + cos(a + halfAngle) * radius1;
      let my = y + sin(a + halfAngle) * radius1;
      
      // 簡單的點連線改為曲線
      // 為了達到類似連結中的柔和感，我們稍微調整頂點邏輯
      vertex(mx, my);
      bezierVertex(cx, cy, cx, cy, sx, sy);
      
      // 對稱的另一邊
      let next_a = a + angle;
      let cx2 = x + cos(a + halfAngle * 1.5) * radius2 * 1.1;
      let cy2 = y + sin(a + halfAngle * 1.5) * radius2 * 1.1;
      let next_mx = x + cos(next_a + halfAngle) * radius1;
      let next_my = y + sin(next_a + halfAngle) * radius1;
      bezierVertex(cx2, cy2, cx2, cy2, next_mx, next_my);
    }
    endShape(CLOSE);
  }
}

// 飛彈類別
class Missile {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(angle).mult(12);
    this.history = [];
  }

  update() {
    // 儲存路徑產生拖影
    this.history.push(this.pos.copy());
    if (this.history.length > 8) {
      this.history.splice(0, 1);
    }
    this.pos.add(this.vel);
  }

  display() {
    // 繪製粉色拖影
    for (let i = 0; i < this.history.length; i++) {
      let alpha = map(i, 0, this.history.length, 0, 150);
      fill(255, 182, 193, alpha); // 粉紅色
      ellipse(this.history[i].x, this.history[i].y, 6);
    }
    // 飛彈頭
    fill(255, 105, 180);
    ellipse(this.pos.x, this.pos.y, 12);
  }
}

// 爆炸粒子類別
class ExplosionParticle {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 7));
    this.lifespan = 255;
    this.color = color;
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan -= 8;
  }

  display() {
    noStroke();
    let c = color(this.color);
    fill(red(c), green(c), blue(c), this.lifespan);
    ellipse(this.pos.x, this.pos.y, random(2, 6));
  }
}

// 陷阱炸彈類別
class Bomb {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 4));
    this.size = random(35, 55);
  }

  update() {
    this.pos.add(this.vel);
    // 邊界反彈
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    // 繪製炸彈主體
    fill(30);
    stroke(255, 0, 0);
    strokeWeight(2);
    ellipse(0, 0, this.size);
    // 繪製閃爍的核心
    noStroke();
    fill(255, 0, 0, 150 + 105 * sin(frameCount * 0.2));
    ellipse(0, 0, this.size * 0.4);
    pop();
  }
}