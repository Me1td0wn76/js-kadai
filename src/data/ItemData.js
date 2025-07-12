export class ItemData {
    static ITEMS = {
        // 回復アイテム（5種類）
        healing: {
            'small_potion': {
                id: 'small_potion',
                name: '小さな回復薬',
                type: 'healing',
                description: 'HPを50回復する',
                effect: { hp: 50 },
                price: 100,
                rarity: 'common',
                iconImage: 'portion_02_orange.png'
            },
            'medium_potion': {
                id: 'medium_potion',
                name: '回復薬',
                type: 'healing',
                description: 'HPを150回復する',
                effect: { hp: 150 },
                price: 300,
                rarity: 'common',
                iconImage: 'portion_02_purple_01.png'
            },
            'large_potion': {
                id: 'large_potion',
                name: '大きな回復薬',
                type: 'healing',
                description: 'HPを300回復する',
                effect: { hp: 300 },
                price: 500,
                rarity: 'uncommon',
                iconImage: 'portion_02_orange.png'
            },
            'mana_potion': {
                id: 'mana_potion',
                name: 'マナポーション',
                type: 'healing',
                description: 'MPを100回復する',
                effect: { mp: 100 },
                price: 200,
                rarity: 'common',
                iconImage: 'portion_02_purple_01.png'
            },
            'elixir': {
                id: 'elixir',
                name: 'エリクサー',
                type: 'healing',
                description: 'HP・MPを完全回復する',
                effect: { hp: 9999, mp: 9999 },
                price: 2000,
                rarity: 'legendary',
                iconImage: 'crystal_red.png'
            }
        },

        // バフアイテム（5種類）
        buff: {
            'strength_ring': {
                id: 'strength_ring',
                name: '力の指輪',
                type: 'buff',
                description: '攻撃力を20%上昇（5ターン）',
                effect: { attack: 1.2, duration: 5 },
                price: 800,
                rarity: 'rare',
                iconImage: 'ring_gold_blue.png'
            },
            'defense_armor': {
                id: 'defense_armor',
                name: '守りの鎧',
                type: 'buff',
                description: '防御力を25%上昇（5ターン）',
                effect: { defense: 1.25, duration: 5 },
                price: 1000,
                rarity: 'rare',
                iconImage: 'armor_green.png'
            },
            'speed_boots': {
                id: 'speed_boots',
                name: '迅速のブーツ',
                type: 'buff',
                description: '素早さを30%上昇（3ターン）',
                effect: { speed: 1.3, duration: 3 },
                price: 600,
                rarity: 'uncommon',
                iconImage: 'armor_koshiate_green.png'
            },
            'magic_jewel': {
                id: 'magic_jewel',
                name: '魔力の宝石',
                type: 'buff',
                description: '魔法攻撃力を40%上昇（4ターン）',
                effect: { magicAttack: 1.4, duration: 4 },
                price: 1200,
                rarity: 'rare',
                iconImage: 'jewelry_round_pink.png'
            },
            'berserk_crystal': {
                id: 'berserk_crystal',
                name: 'バーサークの水晶',
                type: 'buff',
                description: '全能力値50%上昇、HP半減（3ターン）',
                effect: { 
                    attack: 1.5, 
                    magicAttack: 1.5, 
                    speed: 1.5, 
                    defense: 1.5,
                    hpReduce: 0.5, 
                    duration: 3 
                },
                price: 2500,
                rarity: 'legendary',
                iconImage: 'crystal_red.png'
            }
        },

        // 攻撃アイテム（5種類）
        attack: {
            'fire_bomb': {
                id: 'fire_bomb',
                name: '火炎弾',
                type: 'attack',
                description: '敵単体に火属性ダメージ（100-150）',
                effect: { 
                    damage: [100, 150], 
                    element: 'fire',
                    target: 'single'
                },
                price: 150,
                rarity: 'common',
                iconImage: 'hinotama_orange.png'
            },
            'poison_dart': {
                id: 'poison_dart',
                name: '毒の矢',
                type: 'attack',
                description: '敵単体にダメージ＋毒状態（3ターン）',
                effect: { 
                    damage: [80, 120], 
                    element: 'poison',
                    target: 'single',
                    status: 'poison',
                    duration: 3
                },
                price: 200,
                rarity: 'common',
                iconImage: 'doku_green.png'
            },
            'ice_shard': {
                id: 'ice_shard',
                name: '氷の破片',
                type: 'attack',
                description: '敵単体に氷属性ダメージ＋凍結（2ターン）',
                effect: { 
                    damage: [120, 180], 
                    element: 'ice',
                    target: 'single',
                    status: 'freeze',
                    duration: 2
                },
                price: 250,
                rarity: 'uncommon',
                iconImage: 'kirakira_01_blue.png'
            },
            'thunder_scroll': {
                id: 'thunder_scroll',
                name: '雷鳴の巻物',
                type: 'attack',
                description: '敵全体に雷属性ダメージ（150-200）',
                effect: { 
                    damage: [150, 200], 
                    element: 'thunder',
                    target: 'all'
                },
                price: 500,
                rarity: 'rare',
                iconImage: 'kirakira_01_green.png'
            },
            'dark_orb': {
                id: 'dark_orb',
                name: '闇の宝珠',
                type: 'attack',
                description: '敵単体に闇属性の強力なダメージ（300-400）',
                effect: { 
                    damage: [300, 400], 
                    element: 'dark',
                    target: 'single'
                },
                price: 1000,
                rarity: 'legendary',
                iconImage: 'jewelry_round_pink.png'
            }
        }
    };

    // アイテムの全リストを取得
    static getAllItems() {
        const allItems = {};
        for (const category of Object.values(this.ITEMS)) {
            Object.assign(allItems, category);
        }
        return allItems;
    }

    // カテゴリ別のアイテムを取得
    static getItemsByType(type) {
        return this.ITEMS[type] || {};
    }

    // 特定のアイテムデータを取得
    static getItem(itemId) {
        const allItems = this.getAllItems();
        return allItems[itemId] || null;
    }

    // レアリティ別の色を取得
    static getRarityColor(rarity) {
        const colors = {
            'common': 0xffffff,      // 白
            'uncommon': 0x00ff00,    // 緑
            'rare': 0x0080ff,        // 青
            'epic': 0x8000ff,        // 紫
            'legendary': 0xff8000     // オレンジ
        };
        return colors[rarity] || colors.common;
    }

    // アイテムの効果を適用
    static applyItemEffect(item, target, battleScene = null) {
        const effect = item.effect;
        const results = [];

        // 回復効果
        if (effect.hp) {
            const currentHp = Math.max(0, target.hp); // HPがマイナスの場合は0として計算
            const healAmount = Math.min(effect.hp, target.maxHp - currentHp);
            target.hp = Math.min(target.maxHp, Math.max(0, target.hp) + effect.hp);
            results.push(`${target.name}のHPが${healAmount}回復した！`);
        }

        if (effect.mp) {
            const currentMp = Math.max(0, target.mp); // MPがマイナスの場合は0として計算
            const manaAmount = Math.min(effect.mp, target.maxMp - currentMp);
            target.mp = Math.min(target.maxMp, Math.max(0, target.mp) + effect.mp);
            results.push(`${target.name}のMPが${manaAmount}回復した！`);
        }

        // バフ効果
        if (effect.attack || effect.defense || effect.speed || effect.magicAttack) {
            if (!target.buffs) target.buffs = [];
            
            const buff = {
                item: item.id,
                effects: {},
                duration: effect.duration || 1
            };

            if (effect.attack) buff.effects.attack = effect.attack;
            if (effect.defense) buff.effects.defense = effect.defense;
            if (effect.speed) buff.effects.speed = effect.speed;
            if (effect.magicAttack) buff.effects.magicAttack = effect.magicAttack;

            target.buffs.push(buff);
            results.push(`${target.name}に${item.name}の効果が付与された！`);
        }

        // HP減少効果（バーサーク等）
        if (effect.hpReduce) {
            const reduceAmount = Math.floor(target.hp * effect.hpReduce);
            target.hp -= reduceAmount;
            results.push(`${target.name}のHPが${reduceAmount}減少した！`);
        }

        return results;
    }

    // ダメージアイテムの効果を計算
    static calculateDamageItemEffect(item, user, target) {
        const effect = item.effect;
        const [minDamage, maxDamage] = effect.damage;
        
        // ランダムダメージ計算
        const baseDamage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        
        // 使用者の魔力によるダメージ補正
        const magicBonus = user.magicAttack ? Math.floor(user.magicAttack * 0.1) : 0;
        const finalDamage = baseDamage + magicBonus;

        const results = [`${item.name}で${finalDamage}のダメージ！`];

        // 状態異常付与
        if (effect.status && effect.duration) {
            if (!target.statusEffects) target.statusEffects = [];
            
            target.statusEffects.push({
                type: effect.status,
                duration: effect.duration,
                source: item.name
            });
            
            results.push(`${target.name}は${effect.status}状態になった！`);
        }

        return {
            damage: finalDamage,
            messages: results
        };
    }
}
