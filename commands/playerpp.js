const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerpp') // コマンド名
        .setDescription('現在追加されているプレイヤーをPP順にソートしてCSVデータでダウンロードします'), // コマンドの説明
    async execute(interaction) {
        const filePath = "data/player.json";  // プレイヤーのデータファイル

        try {
            // ファイルが存在するか確認
            if (!fs.existsSync(filePath)) {
                await interaction.reply({ content: 'プレイヤーリストは空です', ephemeral: true });
                return;
            }

            // ファイルの読み込みとパース
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const players = JSON.parse(fileContent);

            // プレイヤーリストが空でない場合
            if (players.length === 0) {
                await interaction.reply({ content: 'プレイヤーがいません', ephemeral: true });
                return;
            }

            let playerDataCsv = "name,pp,global,local,country,url";

            // プレイヤーデータをCSV形式で生成
            for (const playerDataJson of players) {
                const playerSSData = await fetchData(`https://api.beatleader.xyz/player/${playerDataJson.id}`);
                if (playerSSData) {
                    playerDataCsv += `\n${playerDataJson.name},${playerSSData.pp},${playerSSData.rank},${playerSSData.countryRank},${playerSSData.country},https://beatleader.xyz/u/${playerDataJson.id}`;
                }
            }

            // CSVファイルを保存するためのパスを設定
            const csvFilePath = path.join(__dirname, '../data/player_pp_rankings.csv');

            // CSVをファイルとして保存
            fs.writeFileSync(csvFilePath, playerDataCsv, 'utf-8');

            // DiscordにCSVファイルを添付して返信
            await interaction.reply({
                content: 'プレイヤーのPPランキングCSVファイルです。',
                files: [{
                    attachment: csvFilePath,
                    name: 'player_pp_rankings.csv',
                }],
            });
        } catch (error) {
            console.error('Error reading players.json:', error);
            await interaction.reply({ content: "プレイヤーリストの読み込み中にエラーが発生しました", ephemeral: true });
        }
    },
};
