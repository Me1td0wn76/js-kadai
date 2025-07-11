import './style.css'
import { SceneManager } from './scenes/SceneManager.js'
import { WorldMapScene } from './scenes/WorldMapScene.js'
import { DungeonScene } from './scenes/DungeonScene.js'
import { BattleScene } from './scenes/BattleScene.js'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>女神転生風RPG</h1>
    <div id="gameContainer"></div>
    <div class="controls">
      <p>移動: WASD / 矢印キー</p>
      <p>決定: Enter / Space</p>
      <p>メニュー: M</p>
    </div>
  </div>
`

// ゲーム初期化
const gameContainer = document.querySelector('#gameContainer');
const sceneManager = new SceneManager(gameContainer);

// シーンを登録
sceneManager.registerScene('worldmap', WorldMapScene);
sceneManager.registerScene('dungeon', DungeonScene);
sceneManager.registerScene('battle', BattleScene);

// 初期シーンを開始
sceneManager.switchScene('worldmap');
