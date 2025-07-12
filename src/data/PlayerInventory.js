import { ItemData } from './ItemData.js';
import { SpellData } from './SpellData.js';

export class PlayerInventory {
    constructor() {
        this.items = {}; // { itemId: quantity }
        this.learnedSpells = new Set(); // 習得済み魔法のID
        this.learnedScrolls = new Set(); // 習得済みスクロールの場所
        this.maxSlots = 20; // インベントリの最大スロット数
    }

    // アイテムを追加
    addItem(itemId, quantity = 1) {
        if (!this.items[itemId]) {
            this.items[itemId] = 0;
        }
        this.items[itemId] += quantity;
        
        console.log(`${ItemData.getItem(itemId).name} x${quantity} を入手した！`);
        return true;
    }

    // アイテムを使用（消費）
    useItem(itemId, quantity = 1) {
        if (!this.hasItem(itemId, quantity)) {
            return false;
        }

        this.items[itemId] -= quantity;
        if (this.items[itemId] <= 0) {
            delete this.items[itemId];
        }

        return true;
    }

    // アイテムを持っているかチェック
    hasItem(itemId, quantity = 1) {
        return (this.items[itemId] || 0) >= quantity;
    }

    // アイテムの所持数を取得
    getItemCount(itemId) {
        return this.items[itemId] || 0;
    }

    // インベントリの使用スロット数を取得
    getUsedSlots() {
        return Object.keys(this.items).length;
    }

    // インベントリに空きがあるかチェック
    hasSpace() {
        return this.getUsedSlots() < this.maxSlots;
    }

    // 所持アイテムのリストを取得（表示用）
    getItemList() {
        const itemList = [];
        
        for (const [itemId, quantity] of Object.entries(this.items)) {
            const itemData = ItemData.getItem(itemId);
            if (itemData) {
                itemList.push({
                    ...itemData,
                    quantity: quantity
                });
            }
        }

        // レアリティとタイプでソート
        itemList.sort((a, b) => {
            const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5 };
            const typeOrder = { 'healing': 1, 'buff': 2, 'attack': 3 };
            
            if (a.type !== b.type) {
                return typeOrder[a.type] - typeOrder[b.type];
            }
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        });

        return itemList;
    }

    // レベルに応じて魔法を習得
    learnSpellsByLevel(playerLevel) {
        const allSpells = SpellData.getAllSpells();
        const newSpells = [];

        for (const [spellId, spell] of Object.entries(allSpells)) {
            if (spell.learnType === 'level' && 
                spell.levelRequired <= playerLevel && 
                !this.learnedSpells.has(spellId)) {
                
                this.learnedSpells.add(spellId);
                newSpells.push(spell);
            }
        }

        return newSpells;
    }

    // スクロールから魔法を習得
    learnSpellFromScroll(location) {
        if (this.learnedScrolls.has(location)) {
            return []; // すでに習得済み
        }

        this.learnedScrolls.add(location);
        const spells = SpellData.getSpellsFromLocation(location);
        
        for (const spell of spells) {
            this.learnedSpells.add(spell.id);
        }

        return spells;
    }

    // 使用可能な魔法のリストを取得
    getAvailableSpells(playerLevel) {
        return SpellData.getAvailableSpells(playerLevel, Array.from(this.learnedScrolls));
    }

    // 特定の魔法を習得しているかチェック
    hasSpell(spellId) {
        return this.learnedSpells.has(spellId);
    }

    // 習得済み魔法のリストを取得（表示用）
    getSpellList() {
        const spellList = [];
        
        for (const spellId of this.learnedSpells) {
            const spellData = SpellData.getSpell(spellId);
            if (spellData) {
                spellList.push(spellData);
            }
        }

        // タイプとレベルでソート
        spellList.sort((a, b) => {
            const typeOrder = { 'attack': 1, 'healing': 2, 'buff': 3, 'debuff': 4, 'special': 5 };
            
            if (a.type !== b.type) {
                return typeOrder[a.type] - typeOrder[b.type];
            }
            return a.levelRequired - b.levelRequired;
        });

        return spellList;
    }

    // インベントリの状態をセーブデータ用に変換
    getSaveData() {
        return {
            items: { ...this.items },
            learnedSpells: Array.from(this.learnedSpells),
            learnedScrolls: Array.from(this.learnedScrolls),
            maxSlots: this.maxSlots
        };
    }

    // セーブデータからインベントリの状態を復元
    loadSaveData(data) {
        this.items = data.items || {};
        this.learnedSpells = new Set(data.learnedSpells || []);
        this.learnedScrolls = new Set(data.learnedScrolls || []);
        this.maxSlots = data.maxSlots || 20;
    }

    // デバッグ用：初期アイテムを追加
    addDebugItems() {
        this.addItem('small_potion', 5);
        this.addItem('medium_potion', 3);
        this.addItem('mana_potion', 3);
        this.addItem('fire_bomb', 2);
        this.addItem('strength_ring', 1);
        this.addItem('defense_armor', 1);
        
        console.log('デバッグ用アイテムを追加しました');
    }

    // デバッグ用：初期魔法を習得
    addDebugSpells() {
        // レベル1-5の魔法を習得
        const debugSpells = ['fire_bolt', 'heal', 'cure', 'ice_lance', 'strengthen'];
        
        for (const spellId of debugSpells) {
            this.learnedSpells.add(spellId);
        }
        
        console.log('デバッグ用魔法を習得しました');
    }
}
