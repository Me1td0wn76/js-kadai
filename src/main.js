import './style.css'
import { SceneManager } from './scenes/SceneManager.js'
import { MenuScene } from './scenes/MenuScene.js'
import { WorldMapScene } from './scenes/WorldMapScene.js'
import { DungeonScene } from './scenes/DungeonScene.js'
import { BattleScene } from './scenes/BattleScene.js'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>境界都市トウキョウ ～分岐の刻～</h1>
    <div id="gameContainer"></div>
    <div class="controls">
      <p>移動: WASD / 矢印キー</p>
      <p>決定: Enter / Space</p>
      <p>戻る: Escape</p>
    </div>
  </div>
`

// ゲーム初期化
async function initGame() {
    try {
        const gameContainer = document.querySelector('#gameContainer');
        
        if (!gameContainer) {
            throw new Error('ゲームコンテナが見つかりません');
        }
        
        console.log('ゲーム初期化開始...');
        
        const sceneManager = new SceneManager(gameContainer);
        
        // シーンを登録
        sceneManager.registerScene('menu', MenuScene);
        sceneManager.registerScene('worldmap', WorldMapScene);
        sceneManager.registerScene('dungeon', DungeonScene);
        sceneManager.registerScene('battle', BattleScene);
        
        console.log('シーン登録完了');
        
        // 初期シーンを開始（メニューから）
        await sceneManager.switchScene('menu');
        
        console.log('ゲーム開始完了');
        
        // グローバル参照（デバッグ用）
        window.sceneManager = sceneManager;
        
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
        
        // エラー表示
        const gameContainer = document.querySelector('#gameContainer');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="color: red; padding: 20px; text-align: center;">
                    <h2>ゲーム読み込みエラー</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">リロード</button>
                </div>
            `;
        }
    }
}

// デバッグ用のグローバル関数を追加
window.clearOverlay = function() {
    const overlay = document.getElementById('scene-transition');
    if (overlay) {
        overlay.remove();
        console.log('オーバーレイを手動削除しました');
    } else {
        console.log('オーバーレイが見つかりません');
    }
};

// DOM読み込み完了後に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
