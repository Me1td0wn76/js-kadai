import * as PIXI from 'pixi.js';
import { CompositeTilemap } from '@pixi/tilemap';

export class TilemapLoader {
    constructor() {
        this.tilemap = null;
        this.tileTextures = new Map();
        this.mapData = null;
    }
    
    async loadMap(mapPath) {
        try {
            // マップデータを読み込み
            const response = await fetch(mapPath);
            this.mapData = await response.json();
            
            // タイルテクスチャを作成（簡易版）
            await this.createTileTextures();
            
            // タイルマップを作成
            this.createTilemap();
            
            return this.tilemap;
        } catch (error) {
            console.error('マップの読み込みに失敗しました:', error);
            return this.createFallbackMap();
        }
    }
    
    async createTileTextures() {
        // 簡易的なタイルテクスチャを作成
        const tileSize = 32;
        
        // 草ブロック（ID: 1）
        const grassTexture = PIXI.RenderTexture.create({
            width: tileSize,
            height: tileSize
        });
        const grassGraphics = new PIXI.Graphics();
        grassGraphics.beginFill(0x27ae60);
        grassGraphics.drawRect(0, 0, tileSize, tileSize);
        grassGraphics.beginFill(0x2ecc71);
        grassGraphics.drawRect(0, 0, tileSize, 8);
        grassGraphics.endFill();
        
        const app = new PIXI.Application();
        app.renderer.render(grassGraphics, { renderTexture: grassTexture });
        this.tileTextures.set(1, grassTexture);
        
        // 土ブロック（ID: 2）
        const dirtTexture = PIXI.RenderTexture.create({
            width: tileSize,
            height: tileSize
        });
        const dirtGraphics = new PIXI.Graphics();
        dirtGraphics.beginFill(0x8b4513);
        dirtGraphics.drawRect(0, 0, tileSize, tileSize);
        dirtGraphics.beginFill(0xa0522d);
        for (let i = 0; i < 5; i++) {
            dirtGraphics.drawCircle(
                Math.random() * tileSize,
                Math.random() * tileSize,
                2 + Math.random() * 3
            );
        }
        dirtGraphics.endFill();
        
        app.renderer.render(dirtGraphics, { renderTexture: dirtTexture });
        this.tileTextures.set(2, dirtTexture);
        
        // コイン（ID: 3）
        const coinTexture = PIXI.RenderTexture.create({
            width: tileSize,
            height: tileSize
        });
        const coinGraphics = new PIXI.Graphics();
        coinGraphics.beginFill(0xffd700);
        coinGraphics.drawCircle(tileSize/2, tileSize/2, 12);
        coinGraphics.beginFill(0xffff00);
        coinGraphics.drawCircle(tileSize/2, tileSize/2, 8);
        coinGraphics.endFill();
        
        app.renderer.render(coinGraphics, { renderTexture: coinTexture });
        this.tileTextures.set(3, coinTexture);
    }
    
    createTilemap() {
        this.tilemap = new CompositeTilemap();
        
        if (!this.mapData || !this.mapData.layers) {
            return this.createFallbackMap();
        }
        
        const tileWidth = this.mapData.tilewidth || 32;
        const tileHeight = this.mapData.tileheight || 32;
        
        // 各レイヤーを処理
        this.mapData.layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.data) {
                this.renderLayer(layer, tileWidth, tileHeight);
            }
        });
        
        return this.tilemap;
    }
    
    renderLayer(layer, tileWidth, tileHeight) {
        const width = layer.width;
        const height = layer.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const tileId = layer.data[index];
                
                if (tileId > 0) {
                    const texture = this.tileTextures.get(tileId);
                    if (texture) {
                        this.tilemap.tile(
                            texture,
                            x * tileWidth,
                            y * tileHeight
                        );
                    }
                }
            }
        }
    }
    
    createFallbackMap() {
        // フォールバック用の簡易マップ
        this.tilemap = new CompositeTilemap();
        
        // 簡易的なテクスチャを作成
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x27ae60);
        graphics.drawRect(0, 0, 32, 32);
        graphics.endFill();
        
        const texture = PIXI.RenderTexture.create({ width: 32, height: 32 });
        const app = new PIXI.Application();
        app.renderer.render(graphics, { renderTexture: texture });
        
        // 地面を作成
        for (let x = 0; x < 25; x++) {
            this.tilemap.tile(texture, x * 32, 400);
            this.tilemap.tile(texture, x * 32, 432);
        }
        
        return this.tilemap;
    }
    
    getTilemap() {
        return this.tilemap;
    }
    
    getMapData() {
        return this.mapData;
    }
    
    // 衝突判定用のヘルパーメソッド
    getTileAt(x, y) {
        if (!this.mapData) return 0;
        
        const tileX = Math.floor(x / (this.mapData.tilewidth || 32));
        const tileY = Math.floor(y / (this.mapData.tileheight || 32));
        
        // 境界チェック
        if (tileX < 0 || tileX >= this.mapData.width || tileY < 0 || tileY >= this.mapData.height) {
            return 0;
        }
        
        // 地面レイヤーから取得
        const groundLayer = this.mapData.layers.find(layer => layer.name === 'Ground');
        if (groundLayer && groundLayer.data) {
            const index = tileY * this.mapData.width + tileX;
            return groundLayer.data[index] || 0;
        }
        
        return 0;
    }
    
    // オブジェクトレイヤーからアイテムを取得
    getObjectAt(x, y) {
        if (!this.mapData) return 0;
        
        const tileX = Math.floor(x / (this.mapData.tilewidth || 32));
        const tileY = Math.floor(y / (this.mapData.tileheight || 32));
        
        const objectLayer = this.mapData.layers.find(layer => layer.name === 'Objects');
        if (objectLayer && objectLayer.data) {
            const index = tileY * this.mapData.width + tileX;
            return objectLayer.data[index] || 0;
        }
        
        return 0;
    }
    
    // オブジェクトを削除
    removeObjectAt(x, y) {
        if (!this.mapData) return;
        
        const tileX = Math.floor(x / (this.mapData.tilewidth || 32));
        const tileY = Math.floor(y / (this.mapData.tileheight || 32));
        
        const objectLayer = this.mapData.layers.find(layer => layer.name === 'Objects');
        if (objectLayer && objectLayer.data) {
            const index = tileY * this.mapData.width + tileX;
            objectLayer.data[index] = 0;
            
            // タイルマップを再描画
            this.tilemap.clear();
            this.createTilemap();
        }
    }
}
