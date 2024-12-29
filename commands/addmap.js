const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');  // fs モジュールのインポート

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmap') // コマンド名
        .setDescription('マップを追加します') // コマンドの説明
        .addStringOption(option =>
            option.setName('id') // 最初のオプション名
                .setDescription('マップIDを入力してください') // オプションの説明
                .setRequired(true) // 必須
        )
        .addStringOption(option =>
            option.setName('game_mode') // 2番目のオプション名
                .setDescription('ゲームモードを選んでください') // オプションの説明
                .setRequired(true) // 必須
                .addChoices(
                    { name: 'Standard', value: 'Standard' },
                    { name: 'NoArrows', value: 'NoArrows' },
                    { name: 'OneSaber', value: 'OneSaber' },
                    { name: '360Degree', value: '360Degree' },
                    { name: '90Degree', value: '90Degree' },
                    { name: 'Lawless', value: 'Lawless' }
                )
        )
        .addStringOption(option =>
            option.setName('difficulty') // 3番目のオプション名
                .setDescription('難易度を選んでください') // オプションの説明
                .setRequired(true) // 必須
                .addChoices(
                    { name: 'Easy', value: 'Easy' },
                    { name: 'Normal', value: 'Normal' },
                    { name: 'Hard', value: 'Hard' },
                    { name: 'Expert', value: 'Expert' },
                    { name: 'ExpertPlus', value: 'ExpertPlus' }
                )
        ),
    async execute(interaction) {
        // 入力されたオプションの値を取得
        const id = interaction.options.getString('id');
        const gameMode = interaction.options.getString('game_mode');
        const difficulty = interaction.options.getString('difficulty');
        const filePath = "data/scores.json";

        try {
            // ファイルの存在確認
            if (!fs.existsSync(filePath)) {
                // ファイルが存在しない場合は初期データを作成
                fs.writeFileSync(filePath, JSON.stringify({ isPost: false }, null, 4), 'utf-8');
            }

            // ファイル読み込みとパース
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const scoreData = JSON.parse(fileContent);

            // 既に存在するか確認
            const existItem = scoreData.findIndex(map => map.id === id && map.characteristic === gameMode && map.difficulty === difficulty);
            if (existItem !== -1) {
                await interaction.reply({ content: '指定されたマップはすでに存在します', ephemeral: true });
                return;
            }

            // BeatSaver APIからプレイヤーデータを取得
            const url = `https://api.beatsaver.com/maps/id/${id}`;
            const mapJsonData = await fetchData(url);
            if (!mapJsonData || !mapJsonData.versions || !mapJsonData.versions[0].diffs) {
                await interaction.reply({ content: '指定されたマップが見つかりませんでした', ephemeral: true });
                return;
            }

            const selectDifficulty = mapJsonData.versions[0].diffs.find(diff => diff.characteristic === gameMode && diff.difficulty === difficulty);
            if (!selectDifficulty) {
                await interaction.reply({ content: '指定された難易度が見つかりません', ephemeral: true });
                return;
            }

            // 新しいマップデータを作成
            const newMapData = {
                "id": mapJsonData.id,
                "characteristic": gameMode,
                "difficulty": difficulty,
                "name": mapJsonData.name,
                "hash": mapJsonData.versions[0].hash,
                "maxScore": selectDifficulty.maxScore,
                "scores": []
            };

            // 新しいデータを追加してファイルに保存
            scoreData.push(newMapData);
            fs.writeFileSync(filePath, JSON.stringify(scoreData, null, 4), 'utf-8');

            // 完了メッセージ
            await interaction.reply({ content: 'マップが正常に追加されました', ephemeral: true });
        } catch (error) {
            console.error('Error handling postData.json:', error);
            await interaction.reply({
                content: "譜面の追加中にエラーが発生しました",
                ephemeral: true
            });
        }
    },
};

// 非同期でデータを取得する関数
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('ネットワークエラー');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}
