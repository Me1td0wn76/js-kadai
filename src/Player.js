import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export class Player {
    constructor(x = 100, y = 300) {
        this.sprite = new PIXI.Graphics();
        this.setupGraphics();
        
        this.sprite.x = x;
        this.sprite.y = y;
        
        // プレイヤーの物理設定
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.jumpPower = -15;
        this.gravity = 0.8;
        this.onGround = false;
        this.facingRight = true;
        
        // アニメーション状態
        this.isJumping = false;
        this.isMoving = false;
        
        this.setupAnimations();
    }
    
    setupGraphics() {
        // シンプルなプレイヤーグラフィックを作成
        this.sprite.beginFill(0x3498db);
        this.sprite.drawRoundedRect(-16, -24, 32, 48, 8);
        this.sprite.endFill();
        
        // 目を追加
        this.sprite.beginFill(0xffffff);
        this.sprite.drawCircle(-8, -12, 4);
        this.sprite.drawCircle(8, -12, 4);
        this.sprite.endFill();
        
        this.sprite.beginFill(0x000000);
        this.sprite.drawCircle(-6, -12, 2);
        this.sprite.drawCircle(10, -12, 2);
        this.sprite.endFill();
        
        // 足を追加
        this.sprite.beginFill(0x2c3e50);
        this.sprite.drawRoundedRect(-12, 20, 8, 12, 4);
        this.sprite.drawRoundedRect(4, 20, 8, 12, 4);
        this.sprite.endFill();
    }
    
    setupAnimations() {
        // アイドル状態のアニメーション（浮遊効果）
        this.idleAnimation = gsap.to(this.sprite, {
            y: this.sprite.y - 5,
            duration: 1.5,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1,
            paused: true
        });
    }
    
    update() {
        // 重力を適用
        if (!this.onGround) {
            this.velocity.y += this.gravity;
        }
        
        // 位置を更新
        this.sprite.x += this.velocity.x;
        this.sprite.y += this.velocity.y;
        
        // 床との衝突判定（簡易版）
        const groundLevel = 400;
        if (this.sprite.y >= groundLevel) {
            this.sprite.y = groundLevel;
            this.velocity.y = 0;
            this.onGround = true;
            this.isJumping = false;
        } else {
            this.onGround = false;
        }
        
        // 水平方向の摩擦
        this.velocity.x *= 0.8;
        
        // アニメーション状態を更新
        this.updateAnimations();
        
        // 向きを更新
        if (this.velocity.x > 0.1) {
            this.facingRight = true;
            this.sprite.scale.x = 1;
        } else if (this.velocity.x < -0.1) {
            this.facingRight = false;
            this.sprite.scale.x = -1;
        }
        
        this.isMoving = Math.abs(this.velocity.x) > 0.1;
    }
    
    updateAnimations() {
        if (this.onGround && !this.isMoving && !this.isJumping) {
            // アイドル状態
            if (this.idleAnimation.paused()) {
                this.idleAnimation.play();
            }
        } else {
            // 動いている状態
            if (!this.idleAnimation.paused()) {
                this.idleAnimation.pause();
            }
        }
        
        // ジャンプアニメーション
        if (this.isJumping && this.velocity.y < 0) {
            gsap.to(this.sprite.scale, {
                x: this.facingRight ? 1.2 : -1.2,
                y: 0.8,
                duration: 0.1,
                ease: "back.out(1.7)"
            });
        } else if (this.onGround) {
            gsap.to(this.sprite.scale, {
                x: this.facingRight ? 1 : -1,
                y: 1,
                duration: 0.2,
                ease: "back.out(1.7)"
            });
        }
    }
    
    moveLeft() {
        this.velocity.x -= this.speed;
        this.velocity.x = Math.max(this.velocity.x, -this.speed);
    }
    
    moveRight() {
        this.velocity.x += this.speed;
        this.velocity.x = Math.min(this.velocity.x, this.speed);
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
            this.isJumping = true;
            
            // ジャンプエフェクト
            gsap.to(this.sprite, {
                rotation: this.facingRight ? 0.2 : -0.2,
                duration: 0.3,
                ease: "power2.out",
                yoyo: true,
                repeat: 1
            });
        }
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }
    
    getBounds() {
        return this.sprite.getBounds();
    }
}
