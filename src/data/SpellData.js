export class SpellData {
    static SPELLS = {
        // 攻撃魔法（レベル制限あり）
        attack: {
            'fire_bolt': {
                id: 'fire_bolt',
                name: 'ファイアボルト',
                type: 'attack',
                element: 'fire',
                description: '敵単体に火属性の魔法ダメージ',
                mpCost: 8,
                damage: [30, 50],
                target: 'single',
                levelRequired: 1,
                learnType: 'level'
            },
            'ice_lance': {
                id: 'ice_lance',
                name: 'アイスランス',
                type: 'attack',
                element: 'ice',
                description: '敵単体に氷属性の魔法ダメージ',
                mpCost: 10,
                damage: [35, 55],
                target: 'single',
                levelRequired: 3,
                learnType: 'level'
            },
            'thunder_strike': {
                id: 'thunder_strike',
                name: 'サンダーストライク',
                type: 'attack',
                element: 'thunder',
                description: '敵単体に雷属性の魔法ダメージ',
                mpCost: 12,
                damage: [40, 60],
                target: 'single',
                levelRequired: 5,
                learnType: 'level'
            },
            'wind_blade': {
                id: 'wind_blade',
                name: 'ウィンドブレード',
                type: 'attack',
                element: 'wind',
                description: '敵単体に風属性の魔法ダメージ',
                mpCost: 9,
                damage: [32, 48],
                target: 'single',
                levelRequired: 4,
                learnType: 'scroll',
                scrollLocation: 'ancient_library'
            },
            'earth_spike': {
                id: 'earth_spike',
                name: 'アーススパイク',
                type: 'attack',
                element: 'earth',
                description: '敵単体に土属性の魔法ダメージ',
                mpCost: 11,
                damage: [38, 58],
                target: 'single',
                levelRequired: 6,
                learnType: 'scroll',
                scrollLocation: 'underground_cave'
            },
            'fireball': {
                id: 'fireball',
                name: 'ファイアボール',
                type: 'attack',
                element: 'fire',
                description: '敵全体に火属性の魔法ダメージ',
                mpCost: 20,
                damage: [50, 80],
                target: 'all',
                levelRequired: 8,
                learnType: 'level'
            },
            'blizzard': {
                id: 'blizzard',
                name: 'ブリザード',
                type: 'attack',
                element: 'ice',
                description: '敵全体に氷属性の魔法ダメージ',
                mpCost: 25,
                damage: [55, 85],
                target: 'all',
                levelRequired: 10,
                learnType: 'scroll',
                scrollLocation: 'ice_temple'
            },
            'lightning': {
                id: 'lightning',
                name: 'ライトニング',
                type: 'attack',
                element: 'thunder',
                description: '敵全体に雷属性の魔法ダメージ',
                mpCost: 22,
                damage: [60, 90],
                target: 'all',
                levelRequired: 12,
                learnType: 'level'
            }
        },

        // 回復魔法
        healing: {
            'heal': {
                id: 'heal',
                name: 'ヒール',
                type: 'healing',
                description: '自分のHPを回復する',
                mpCost: 5,
                healing: [40, 60],
                target: 'self',
                levelRequired: 1,
                learnType: 'level'
            },
            'cure': {
                id: 'cure',
                name: 'キュア',
                type: 'healing',
                description: '状態異常を回復する',
                mpCost: 8,
                target: 'self',
                statusCure: ['poison', 'freeze', 'sleep', 'paralysis'],
                levelRequired: 2,
                learnType: 'level'
            },
            'regenerate': {
                id: 'regenerate',
                name: 'リジェネレート',
                type: 'healing',
                description: '5ターンの間、毎ターンHPを回復',
                mpCost: 15,
                healing: [20, 30],
                target: 'self',
                duration: 5,
                levelRequired: 7,
                learnType: 'scroll',
                scrollLocation: 'healing_shrine'
            },
            'restore': {
                id: 'restore',
                name: 'リストア',
                type: 'healing',
                description: 'HPとMPを大幅に回復する',
                mpCost: 25,
                healing: [100, 150],
                manaRestore: [50, 80],
                target: 'self',
                levelRequired: 15,
                learnType: 'scroll',
                scrollLocation: 'holy_cathedral'
            }
        },

        // バフ魔法
        buff: {
            'strengthen': {
                id: 'strengthen',
                name: 'ストレングス',
                type: 'buff',
                description: '攻撃力を上昇させる（5ターン）',
                mpCost: 12,
                effect: { attack: 1.3 },
                duration: 5,
                target: 'self',
                levelRequired: 3,
                learnType: 'level'
            },
            'protect': {
                id: 'protect',
                name: 'プロテクト',
                type: 'buff',
                description: '防御力を上昇させる（5ターン）',
                mpCost: 10,
                effect: { defense: 1.4 },
                duration: 5,
                target: 'self',
                levelRequired: 4,
                learnType: 'level'
            },
            'haste': {
                id: 'haste',
                name: 'ヘイスト',
                type: 'buff',
                description: '素早さを大幅に上昇させる（3ターン）',
                mpCost: 15,
                effect: { speed: 1.5 },
                duration: 3,
                target: 'self',
                levelRequired: 6,
                learnType: 'scroll',
                scrollLocation: 'wind_tower'
            },
            'magic_boost': {
                id: 'magic_boost',
                name: 'マジックブースト',
                type: 'buff',
                description: '魔法攻撃力を上昇させる（4ターン）',
                mpCost: 18,
                effect: { magicAttack: 1.6 },
                duration: 4,
                target: 'self',
                levelRequired: 9,
                learnType: 'scroll',
                scrollLocation: 'magic_academy'
            }
        },

        // デバフ魔法
        debuff: {
            'weaken': {
                id: 'weaken',
                name: 'ウィークン',
                type: 'debuff',
                description: '敵の攻撃力を下げる（4ターン）',
                mpCost: 10,
                effect: { attack: 0.7 },
                duration: 4,
                target: 'enemy',
                levelRequired: 5,
                learnType: 'level'
            },
            'slow': {
                id: 'slow',
                name: 'スロウ',
                type: 'debuff',
                description: '敵の素早さを下げる（4ターン）',
                mpCost: 8,
                effect: { speed: 0.6 },
                duration: 4,
                target: 'enemy',
                levelRequired: 4,
                learnType: 'level'
            },
            'curse': {
                id: 'curse',
                name: 'カース',
                type: 'debuff',
                description: '敵の全能力値を下げる（3ターン）',
                mpCost: 20,
                effect: { 
                    attack: 0.8, 
                    defense: 0.8, 
                    speed: 0.8, 
                    magicAttack: 0.8 
                },
                duration: 3,
                target: 'enemy',
                levelRequired: 11,
                learnType: 'scroll',
                scrollLocation: 'dark_sanctum'
            }
        },

        // 特殊魔法
        special: {
            'sleep': {
                id: 'sleep',
                name: 'スリープ',
                type: 'special',
                description: '敵を眠らせる（3ターン）',
                mpCost: 12,
                statusEffect: 'sleep',
                duration: 3,
                target: 'enemy',
                levelRequired: 6,
                learnType: 'scroll',
                scrollLocation: 'dream_chamber'
            },
            'paralyze': {
                id: 'paralyze',
                name: 'パラライズ',
                type: 'special',
                description: '敵を麻痺させる（2ターン）',
                mpCost: 15,
                statusEffect: 'paralysis',
                duration: 2,
                target: 'enemy',
                levelRequired: 8,
                learnType: 'scroll',
                scrollLocation: 'electric_lab'
            },
            'teleport': {
                id: 'teleport',
                name: 'テレポート',
                type: 'special',
                description: '戦闘から確実に逃走する',
                mpCost: 20,
                effect: 'escape',
                target: 'self',
                levelRequired: 10,
                learnType: 'scroll',
                scrollLocation: 'mystic_portal'
            }
        }
    };

    // スクロールの場所データ
    static SCROLL_LOCATIONS = {
        'ancient_library': {
            name: '古代図書館',
            description: '風の魔法書が眠る場所',
            spells: ['wind_blade']
        },
        'underground_cave': {
            name: '地下洞窟',
            description: '大地の力を宿した巻物がある',
            spells: ['earth_spike']
        },
        'ice_temple': {
            name: '氷の神殿',
            description: '氷結の秘術が記された場所',
            spells: ['blizzard']
        },
        'healing_shrine': {
            name: '癒しの祠',
            description: '生命力を操る魔法を学べる',
            spells: ['regenerate']
        },
        'holy_cathedral': {
            name: '聖なる大聖堂',
            description: '最高位の回復魔法が眠る',
            spells: ['restore']
        },
        'wind_tower': {
            name: '風の塔',
            description: '迅速の魔法を習得できる',
            spells: ['haste']
        },
        'magic_academy': {
            name: '魔法学院',
            description: '魔力増強の奥義がある',
            spells: ['magic_boost']
        },
        'dark_sanctum': {
            name: '闇の聖域',
            description: '呪いの魔法が封印されている',
            spells: ['curse']
        },
        'dream_chamber': {
            name: '夢の間',
            description: '眠りの魔法を学べる神秘的な場所',
            spells: ['sleep']
        },
        'electric_lab': {
            name: '雷電研究所',
            description: '麻痺の秘術が研究されている',
            spells: ['paralyze']
        },
        'mystic_portal': {
            name: '神秘の扉',
            description: '空間移動の魔法が記された場所',
            spells: ['teleport']
        }
    };

    // 全ての魔法を取得
    static getAllSpells() {
        const allSpells = {};
        for (const category of Object.values(this.SPELLS)) {
            Object.assign(allSpells, category);
        }
        return allSpells;
    }

    // タイプ別の魔法を取得
    static getSpellsByType(type) {
        return this.SPELLS[type] || {};
    }

    // 特定の魔法データを取得
    static getSpell(spellId) {
        const allSpells = this.getAllSpells();
        return allSpells[spellId] || null;
    }

    // プレイヤーが使用可能な魔法を取得
    static getAvailableSpells(playerLevel, learnedScrolls = []) {
        const allSpells = this.getAllSpells();
        const availableSpells = {};

        for (const [spellId, spell] of Object.entries(allSpells)) {
            if (spell.learnType === 'level') {
                // レベル制限チェック
                if (playerLevel >= spell.levelRequired) {
                    availableSpells[spellId] = spell;
                }
            } else if (spell.learnType === 'scroll') {
                // スクロール習得チェック
                if (learnedScrolls.includes(spellId)) {
                    availableSpells[spellId] = spell;
                }
            }
        }

        return availableSpells;
    }

    // スクロールから学べる魔法を取得
    static getSpellsFromLocation(location) {
        const locationData = this.SCROLL_LOCATIONS[location];
        if (!locationData) return [];

        return locationData.spells.map(spellId => this.getSpell(spellId)).filter(Boolean);
    }

    // 魔法の効果を計算
    static calculateSpellEffect(spell, caster, target = null) {
        const results = [];

        // 攻撃魔法
        if (spell.type === 'attack' && spell.damage) {
            const [minDamage, maxDamage] = spell.damage;
            const baseDamage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
            
            // 魔法攻撃力によるダメージ補正
            const magicBonus = caster.magicAttack ? Math.floor(caster.magicAttack * 0.2) : 0;
            const finalDamage = baseDamage + magicBonus;

            return {
                damage: finalDamage,
                element: spell.element,
                messages: [`${spell.name}で${finalDamage}のダメージ！`]
            };
        }

        // 回復魔法
        if (spell.type === 'healing') {
            if (spell.healing) {
                const [minHeal, maxHeal] = spell.healing;
                const healAmount = Math.floor(Math.random() * (maxHeal - minHeal + 1)) + minHeal;
                results.push(`${spell.name}でHPが${healAmount}回復した！`);
                
                return {
                    healing: healAmount,
                    messages: results
                };
            }

            if (spell.statusCure) {
                results.push(`${spell.name}で状態異常が回復した！`);
                return {
                    statusCure: spell.statusCure,
                    messages: results
                };
            }
        }

        // バフ/デバフ魔法
        if ((spell.type === 'buff' || spell.type === 'debuff') && spell.effect) {
            const effectName = spell.type === 'buff' ? '強化' : '弱体化';
            results.push(`${spell.name}で${effectName}効果が発動！`);
            
            return {
                effect: spell.effect,
                duration: spell.duration,
                messages: results
            };
        }

        // 特殊魔法
        if (spell.type === 'special') {
            if (spell.statusEffect) {
                results.push(`${spell.name}で${spell.statusEffect}状態になった！`);
                return {
                    statusEffect: spell.statusEffect,
                    duration: spell.duration,
                    messages: results
                };
            }

            if (spell.effect === 'escape') {
                results.push(`${spell.name}で戦闘から脱出した！`);
                return {
                    escape: true,
                    messages: results
                };
            }
        }

        return { messages: ['魔法が発動した！'] };
    }

    // MP不足チェック
    static canCastSpell(spell, caster) {
        return caster.mp >= spell.mpCost;
    }

    // MP消費
    static consumeMana(spell, caster) {
        caster.mp = Math.max(0, caster.mp - spell.mpCost);
    }
}
