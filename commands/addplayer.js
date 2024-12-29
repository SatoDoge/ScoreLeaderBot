const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addplayer') // コマンド名
        .setDescription('リーダーにプレイヤーを追加します') // コマンドの説明
        .addStringOption(option =>
            option.setName('id') // オプション名
                .setDescription('ScoreSaberのID') // オプションの説明
                .setRequired(true) // 必須に設定
        ),
    async execute(interaction) {
        const input = interaction.options.getString('id');
        const filePath = 'data/player.json';

        try {
            // ファイルを読み込み（存在しない場合は空の配列を初期化）
            let playerJson = [];
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                playerJson = JSON.parse(fileContent);
            }

            // プレイヤーが既に存在するかチェック
            if (playerJson.some(player => player.id === input)) {
                await interaction.reply({ content: 'すでにプレイヤーが存在しています', ephemeral: true });
                return;
            }

            // ScoreSaber APIからプレイヤーデータを取得
            const url = `https://scoresaber.com/api/player/${input}/basic`;
            const playerScoreSaberData = await fetchData(url);

            if (!playerScoreSaberData || !playerScoreSaberData.id || !playerScoreSaberData.name) {
                await interaction.reply({ content: 'プレイヤーデータの取得に失敗しました', ephemeral: true });
                return;
            }

            // 新しいプレイヤーデータを追加
            const playerNewData = {
                id: playerScoreSaberData.id,
                name: playerScoreSaberData.name,
                playCount:0,
                playScore:0
            };
            playerJson.push(playerNewData);

            // JSONファイルに書き込み
            fs.writeFileSync(filePath, JSON.stringify(playerJson, null, 4), 'utf-8');
            await interaction.reply({ content: 'プレイヤーを追加しました', ephemeral: true });
        } catch (error) {
            console.error('エラーが発生しました:', error);
            await interaction.reply({ content: 'エラーが発生しました', ephemeral: true });
        }
    },
};

// 非同期でデータを取得する関数
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('データの取得に失敗しました:', error.message);
        return null;
    }
}
