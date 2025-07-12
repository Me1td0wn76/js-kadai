import * as PIXI from 'pixi.js';

export class EnemyIcon {
    constructor(imageLoader, enemyType = 'trool') {
        this.imageLoader = imageLoader;
        this.enemyType = enemyType;
        this.container = new PIXI.Container();
        this.sprite = null;
        this.animationFrames = {};
        this.currentFrame = 0;
        this.direction = 'down';
        this.isAnimating = false;
        this.animationTween = null;
        
        this.setupSprite();
        this.setupAnimationFrames();
    }
    
    setupSprite() {
        if (this.imageLoader && this.imageLoader.isLoaded) {
            let enemyTexture = null;
            
            // 敵タイプに応じた画像を選択
            switch (this.enemyType) {
                case 'troll':
                case 'trool':
                    enemyTexture = this.imageLoader.getTexture('troll');
                    break;
                case 'dragon_red':
                    enemyTexture = this.imageLoader.getTexture('enemy_dragon_red');
                    break;
                case 'dragon_blue':
                    enemyTexture = this.imageLoader.getTexture('enemy_dragon_blue');
                    break;
                case 'skeleton':
                    enemyTexture = this.imageLoader.getTexture('enemy_skeleton');
                    break;
                case 'dark_angel':
                    enemyTexture = this.imageLoader.getTexture('enemy_dark_angel');
                    break;
                case 'dark_mage':
                    enemyTexture = this.imageLoader.getTexture('enemy_dark_mage');
                    break;
                default:
                    // デフォルトはトロール
                    enemyTexture = this.imageLoader.getTexture('troll');
            }
            
            if (enemyTexture) {
                this.sprite = new PIXI.Sprite(enemyTexture);
                this.sprite.anchor.set(0.5);
                
                // 画像サイズに基づいて適切なスケールを計算
                const targetHeight = 32; // ワールドマップでの目標高さ（ピクセル）
                const scale = targetHeight / enemyTexture.height;
                this.sprite.scale.set(scale);
                
                this.container.addChild(this.sprite);
                
                console.log(`敵スプライト（${this.enemyType}）: 元サイズ ${enemyTexture.width}x${enemyTexture.height}, スケール ${scale.toFixed(2)}`);
                return;
            }
        }
        
        // フォールバック：プロシージャル敵スプライト
        this.sprite = this.createFallbackEnemySprite();
        this.container.addChild(this.sprite);
    }
    
    setupAnimationFrames() {
        if (this.imageLoader && this.imageLoader.isLoaded) {
            const enemyTexture = this.imageLoader.getTexture('enemy');
            if (enemyTexture) {
                // trool_idlewalk_atack_die.png からアニメーションフレームを抽出
                this.animationFrames = this.imageLoader.createAnimationFrames('enemy', 32, 32);
            }
        }
    }
    
    createFallbackEnemySprite() {
        const enemyGraphics = new PIXI.Graphics();
        
        // トロールの基本形状
        // 体（大きめ）
        enemyGraphics.roundRect(-20, -30, 40, 60, 10);
        enemyGraphics.fill(0x8b4513); // 茶色
        
        // 頭（大きめ）
        enemyGraphics.circle(0, -45, 22);
        enemyGraphics.fill(0x654321); // 濃い茶色
        
        // 目（光る）
        enemyGraphics.circle(-8, -50, 3);
        enemyGraphics.fill(0xff0000); // 赤い目
        enemyGraphics.circle(8, -50, 3);
        enemyGraphics.fill(0xff0000);
        
        // 牙
        enemyGraphics.poly([-5, -35, -2, -30, -8, -30]);
        enemyGraphics.fill(0xffffff);
        enemyGraphics.poly([5, -35, 2, -30, 8, -30]);
        enemyGraphics.fill(0xffffff);
        
        // 腕（太い）
        enemyGraphics.roundRect(-35, -20, 15, 35, 7);
        enemyGraphics.fill(0x654321);
        enemyGraphics.roundRect(20, -20, 15, 35, 7);
        enemyGraphics.fill(0x654321);
        
        // 爪
        enemyGraphics.poly([-32, 10, -28, 18, -36, 18]);
        enemyGraphics.fill(0x2c2c2c);
        enemyGraphics.poly([32, 10, 28, 18, 36, 18]);
        enemyGraphics.fill(0x2c2c2c);
        
        // 足（太い）
        enemyGraphics.roundRect(-15, 25, 12, 25, 6);
        enemyGraphics.fill(0x2c3e50);
        enemyGraphics.roundRect(3, 25, 12, 25, 6);
        enemyGraphics.fill(0x2c3e50);
        
        // 胸の装飾（骨）
        enemyGraphics.rect(-8, -15, 16, 4);
        enemyGraphics.fill(0xeeeeee);
        enemyGraphics.circle(-12, -13, 3);
        enemyGraphics.fill(0xeeeeee);
        enemyGraphics.circle(12, -13, 3);
        enemyGraphics.fill(0xeeeeee);
        
        return enemyGraphics;
    }
    
    // 方向を設定
    setDirection(direction) {
        this.direction = direction;
        if (this.animationFrames[direction] && this.animationFrames[direction].length > 0) {
            this.sprite.texture = this.animationFrames[direction][0];
        }
        
        // 向きに応じて反転
        switch (direction) {
            case 'left':
                this.sprite.scale.x = -Math.abs(this.sprite.scale.x || 0.8);
                break;
            case 'right':
                this.sprite.scale.x = Math.abs(this.sprite.scale.x || 0.8);
                break;
            default:
                this.sprite.scale.x = Math.abs(this.sprite.scale.x || 0.8);
        }
    }
    
    // 攻撃アニメーション
    startAttackAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        if (this.animationFrames['attack'] && this.animationFrames['attack'].length > 0) {
            // スプライトベースの攻撃アニメーション
            this.animateAttackFrames();
        } else {
            // フォールバック攻撃アニメーション
            const originalScale = this.sprite.scale.x;
            const originalY = this.sprite.y;
            
            // 前に突進
            this.sprite.scale.x = originalScale * 1.3;
            this.sprite.y = originalY - 10;
            
            setTimeout(() => {
                this.sprite.scale.x = originalScale;
                this.sprite.y = originalY;
                this.isAnimating = false;
            }, 300);
        }
    }
    
    animateAttackFrames() {
        const attackFrames = this.animationFrames['attack'] || this.animationFrames[this.direction] || [];
        if (attackFrames.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        let frameIndex = 0;
        const animateFrame = () => {
            if (frameIndex < attackFrames.length) {
                this.sprite.texture = attackFrames[frameIndex];
                frameIndex++;
                setTimeout(animateFrame, 100);
            } else {
                // アイドル状態に戻る
                if (this.animationFrames[this.direction] && this.animationFrames[this.direction].length > 0) {
                    this.sprite.texture = this.animationFrames[this.direction][0];
                }
                this.isAnimating = false;
            }
        };
        
        animateFrame();
    }
    
    // ダメージアニメーション
    takeDamage() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // 赤く点滅
        this.sprite.tint = 0xff0000;
        
        setTimeout(() => {
            this.sprite.tint = 0xffffff;
            setTimeout(() => {
                this.sprite.tint = 0xff0000;
                setTimeout(() => {
                    this.sprite.tint = 0xffffff;
                    this.isAnimating = false;
                }, 100);
            }, 100);
        }, 100);
    }
    
    // 死亡アニメーション
    die() {
        if (this.animationFrames['die'] && this.animationFrames['die'].length > 0) {
            // スプライトベースの死亡アニメーション
            this.animateDeathFrames();
        } else {
            // フォールバック死亡アニメーション
            this.sprite.rotation = Math.PI / 2; // 横に倒れる
            this.sprite.alpha = 0.5;
        }
    }
    
    animateDeathFrames() {
        const deathFrames = this.animationFrames['die'] || [];
        if (deathFrames.length === 0) {
            this.sprite.alpha = 0.3;
            return;
        }
        
        let frameIndex = 0;
        const animateFrame = () => {
            if (frameIndex < deathFrames.length) {
                this.sprite.texture = deathFrames[frameIndex];
                frameIndex++;
                setTimeout(animateFrame, 150);
            } else {
                this.sprite.alpha = 0.3;
            }
        };
        
        animateFrame();
    }
    
    // 戦闘用バトルスプライト
    createBattleSprite() {
        if (this.imageLoader && this.imageLoader.isLoaded) {
            let enemyTexture = null;
            
            // 敵タイプに応じた画像を選択（setupSpriteと同じロジック）
            switch (this.enemyType) {
                case 'troll':
                case 'trool':
                    enemyTexture = this.imageLoader.getTexture('troll');
                    break;
                case 'dragon_red':
                    enemyTexture = this.imageLoader.getTexture('enemy_dragon_red');
                    break;
                case 'dragon_blue':
                    enemyTexture = this.imageLoader.getTexture('enemy_dragon_blue');
                    break;
                case 'skeleton':
                    enemyTexture = this.imageLoader.getTexture('enemy_skeleton');
                    break;
                case 'dark_angel':
                    enemyTexture = this.imageLoader.getTexture('enemy_dark_angel');
                    break;
                case 'dark_mage':
                    enemyTexture = this.imageLoader.getTexture('enemy_dark_mage');
                    break;
                default:
                    // デフォルトはトロール
                    enemyTexture = this.imageLoader.getTexture('troll');
            }
            
            if (enemyTexture) {
                const battleSprite = new PIXI.Sprite(enemyTexture);
                battleSprite.anchor.set(0.5);
                
                // 画像サイズに基づいて適切なスケールを計算
                const targetHeight = 80; // 戦闘画面での目標高さを小さく（120から80に）
                const scale = targetHeight / enemyTexture.height;
                battleSprite.scale.set(scale);
                
                console.log(`戦闘用敵スプライト（${this.enemyType}）: 元サイズ ${enemyTexture.width}x${enemyTexture.height}, スケール ${scale.toFixed(2)}`);
                return battleSprite;
            }
        }
        
        // フォールバック用の戦闘スプライト
        const battleGraphics = this.createFallbackEnemySprite();
        battleGraphics.scale.set(1.0); // フォールバックサイズも調整（2.0から1.0に）
        console.log(`フォールバック戦闘用敵スプライトを作成しました`);
        
        return battleGraphics;
    }
    
    // 後方互換性のためのstatic メソッド
    static createEnemy(type) {
        const enemyIcon = new EnemyIcon(null, 'trool');
        return enemyIcon.createBattleSprite();
    }
    
    destroy() {
        this.isAnimating = false;
        if (this.animationTween) {
            this.animationTween = false;
        }
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
}
