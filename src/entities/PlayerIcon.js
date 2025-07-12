import * as PIXI from 'pixi.js';
import { ImageLoader } from '../assets/ImageLoader.js';

export class PlayerIcon {
    constructor(imageLoader) {
        this.container = new PIXI.Container();
        this.sprite = null;
        this.imageLoader = imageLoader;
        this.animationFrames = [];
        this.currentFrame = 0;
        this.animationSpeed = 0.1;
        this.direction = 'down'; // up, down, left, right
        this.createPlayerSprite();
    }
    
    createPlayerSprite() {
        if (this.imageLoader && this.imageLoader.isLoaded) {
            // 複数のプレイヤー画像から選択
            const playerTextures = [
                this.imageLoader.getTexture('player'),
                this.imageLoader.getTexture('player_scientist'),
                this.imageLoader.getTexture('player_warrior'),
                this.imageLoader.getTexture('player_mage'),
                this.imageLoader.getTexture('player_priest')
            ];
            
            // 最初に利用可能なテクスチャを使用
            const availableTexture = playerTextures.find(texture => texture !== undefined);
            
            if (availableTexture) {
                this.sprite = new PIXI.Sprite(availableTexture);
                this.sprite.anchor.set(0.5);
                
                // 画像サイズに基づいて適切なスケールを計算
                const targetHeight = 40; // ワールドマップでの目標高さを少し小さく（48から40に）
                const scale = targetHeight / availableTexture.height;
                this.sprite.scale.set(scale);
                
                console.log(`プレイヤースプライト（画像）: 元サイズ ${availableTexture.width}x${availableTexture.height}, スケール ${scale.toFixed(2)}`);
            } else {
                this.createFallbackSprite();
            }
        } else {
            this.createFallbackSprite();
        }
        
        this.container.addChild(this.sprite);
    }

    setupAnimationFrames() {
        // human1.pngから歩行アニメーションフレームを抽出
        // 仮定：32x48ピクセルのキャラクター、4方向x3フレーム
        if (this.imageLoader) {
            const frameWidth = 32;
            const frameHeight = 48;
            
            // 下向き歩行
            this.animationFrames.down = this.imageLoader.createAnimationFrames('player', frameWidth, frameHeight, 3, 3);
            // 上向き歩行  
            this.animationFrames.up = this.imageLoader.createAnimationFrames('player', frameWidth, frameHeight, 3, 3);
            // 左向き歩行
            this.animationFrames.left = this.imageLoader.createAnimationFrames('player', frameWidth, frameHeight, 3, 3);
            // 右向き歩行
            this.animationFrames.right = this.imageLoader.createAnimationFrames('player', frameWidth, frameHeight, 3, 3);
        }
    }

    createFallbackSprite() {
        // フォールバック用のGraphicsスプライト
        const graphics = new PIXI.Graphics();
        
        // 体（青色の服）
        graphics.roundRect(-15, -30, 30, 60, 8);
        graphics.fill(0x3498db);
        
        // 頭（肌色）  
        graphics.circle(0, -45, 18);
        graphics.fill(0xfdbcb4);
        
        // 髪（茶色）
        graphics.ellipse(0, -55, 20, 15);
        graphics.fill(0x8b4513);
        
        // 目
        graphics.circle(-6, -48, 2);
        graphics.fill(0x000000);
        graphics.circle(6, -48, 2);
        graphics.fill(0x000000);
        
        // 口
        graphics.ellipse(0, -38, 3, 1);
        graphics.fill(0x000000);
        
        // 腕
        graphics.roundRect(-25, -20, 10, 25, 5);
        graphics.fill(0xfdbcb4);
        graphics.roundRect(15, -20, 10, 25, 5);
        graphics.fill(0xfdbcb4);
        
        // 足
        graphics.roundRect(-12, 25, 10, 20, 3);
        graphics.fill(0x2c3e50);
        graphics.roundRect(2, 25, 10, 20, 3);
        graphics.fill(0x2c3e50);
        
        // 武器（剣）
        graphics.rect(20, -40, 3, 30);
        graphics.fill(0xc0c0c0);
        
        graphics.rect(18, -15, 7, 8);
        graphics.fill(0x8b4513);
        
        this.sprite = graphics;
    }
    
    // 方向に応じてスプライトを変更
    setDirection(direction) {
        this.direction = direction;
        if (this.animationFrames[direction] && this.animationFrames[direction].length > 0) {
            this.sprite.texture = this.animationFrames[direction][0];
        }
        
        // 向きに応じて反転
        switch (direction) {
            case 'left':
                this.sprite.scale.x = -Math.abs(this.sprite.scale.x || 1);
                break;
            case 'right':
                this.sprite.scale.x = Math.abs(this.sprite.scale.x || 1);
                break;
            default:
                this.sprite.scale.x = Math.abs(this.sprite.scale.x || 1);
        }
    }
    
    // アニメーション状態を設定
    setAnimationState(state) {
        if (state === 'walking') {
            this.startWalkingAnimation();
        } else {
            this.stopWalkingAnimation();
        }
    }

    startWalkingAnimation() {
        if (!this.walkingTween && this.animationFrames[this.direction]) {
            this.walkingTween = true;
            this.animateWalking();
        }
    }

    stopWalkingAnimation() {
        this.walkingTween = false;
        if (this.animationFrames[this.direction] && this.animationFrames[this.direction].length > 0) {
            this.sprite.texture = this.animationFrames[this.direction][0]; // アイドル状態
        }
    }
    
    animateWalking() {
        if (!this.walkingTween || !this.animationFrames[this.direction]) {
            // フォールバック：上下移動アニメーション
            if (this.walkingTween && this.sprite) {
                const originalY = this.sprite.y;
                this.sprite.y = originalY - 2;
                
                setTimeout(() => {
                    if (this.walkingTween) {
                        this.sprite.y = originalY + 2;
                        setTimeout(() => {
                            if (this.walkingTween) {
                                this.sprite.y = originalY;
                                setTimeout(() => this.animateWalking(), 200);
                            }
                        }, 100);
                    }
                }, 100);
            }
            return;
        }
        
        const frames = this.animationFrames[this.direction];
        if (frames.length === 0) return;
        
        this.currentFrame = (this.currentFrame + 1) % frames.length;
        this.sprite.texture = frames[this.currentFrame];
        
        setTimeout(() => {
            if (this.walkingTween) {
                this.animateWalking();
            }
        }, 200); // 200msごとにフレーム更新
    }
    
    // 戦闘用のバトルスプライト
    createBattleSprite() {
        if (this.imageLoader && this.imageLoader.isLoaded) {
            const playerTexture = this.imageLoader.getTexture('player');
            if (playerTexture) {
                const battleSprite = new PIXI.Sprite(playerTexture);
                battleSprite.anchor.set(0.5);
                
                // 画像サイズに基づいて適切なスケールを計算
                const targetHeight = 80; // 戦闘画面での目標高さを敵と同じに（100から80に）
                const scale = targetHeight / playerTexture.height;
                battleSprite.scale.set(scale);
                
                console.log(`戦闘用プレイヤースプライト: 元サイズ ${playerTexture.width}x${playerTexture.height}, スケール ${scale.toFixed(2)}`);
                return battleSprite;
            }
        }
        
        // フォールバック用の描画バトルスプライト
        const battleGraphics = new PIXI.Graphics();
        
        // より適切なサイズで描画
        const scale = 0.8; // スケールを小さく（1.5から0.8に）
        
        // 体
        battleGraphics.roundRect(-15 * scale, -30 * scale, 30 * scale, 60 * scale, 8 * scale);
        battleGraphics.fill(0x3498db);
        
        // 頭
        battleGraphics.circle(0, -45 * scale, 18 * scale);
        battleGraphics.fill(0xfdbcb4);
        
        // 髪
        battleGraphics.ellipse(0, -55 * scale, 20 * scale, 15 * scale);
        battleGraphics.fill(0x8b4513);
        
        // 目
        battleGraphics.circle(-6 * scale, -48 * scale, 2 * scale);
        battleGraphics.fill(0x000000);
        battleGraphics.circle(6 * scale, -48 * scale, 2 * scale);
        battleGraphics.fill(0x000000);
        
        // 口
        battleGraphics.ellipse(0, -38 * scale, 3 * scale, 1 * scale);
        battleGraphics.fill(0x000000);
        
        // 腕
        battleGraphics.roundRect(-25 * scale, -20 * scale, 10 * scale, 25 * scale, 5 * scale);
        battleGraphics.fill(0xfdbcb4);
        battleGraphics.roundRect(15 * scale, -20 * scale, 10 * scale, 25 * scale, 5 * scale);
        battleGraphics.fill(0xfdbcb4);
        
        // 足
        battleGraphics.roundRect(-12 * scale, 25 * scale, 10 * scale, 20 * scale, 3 * scale);
        battleGraphics.fill(0x2c3e50);
        battleGraphics.roundRect(2 * scale, 25 * scale, 10 * scale, 20 * scale, 3 * scale);
        battleGraphics.fill(0x2c3e50);
        
        // 剣（より詳細）
        battleGraphics.rect(20 * scale, -40 * scale, 3 * scale, 35 * scale);
        battleGraphics.fill(0xc0c0c0);
        
        battleGraphics.rect(18 * scale, -15 * scale, 7 * scale, 10 * scale);
        battleGraphics.fill(0x8b4513);
        
        // 鎧の装飾
        battleGraphics.rect(-5 * scale, -25 * scale, 10 * scale, 3 * scale);
        battleGraphics.fill(0xffd700);
        
        return battleGraphics;
    }
    
    destroy() {
        this.walkingTween = false;
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
}
