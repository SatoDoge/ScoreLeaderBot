const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');  // fs モジュールのインポート

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletemap') // コマンド名
        .setDescription('ID とゲームモード、難易度を入力してマップを削除します') // コマンドの説明
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
                // ファイルが存在しない場合
                await interaction.reply({ content: 'スコアデータファイルが存在しません', ephemeral: true });
                return;
            }

            // ファイル読み込みとパース
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const scoreData = JSON.parse(fileContent);

            // 指定されたマップが存在するか確認
            const mapIndex = scoreData.findIndex(map => map.id === id && map.characteristic === gameMode && map.difficulty === difficulty);
            if (mapIndex === -1) {
                await interaction.reply({ content: '指定されたマップが存在しません', ephemeral: true });
                return;
            }

            // マップデータを削除
            scoreData.splice(mapIndex, 1);

            // ファイルを更新
            fs.writeFileSync(filePath, JSON.stringify(scoreData, null, 4), 'utf-8');

            // 削除完了メッセージ
            await interaction.reply({ content: '指定されたマップが削除されました', ephemeral: true });
        } catch (error) {
            console.error('Error handling scores.json:', error);
            await interaction.reply({
                content: "マップの削除中にエラーが発生しました",
                ephemeral: true
            });
        }
    },
};
