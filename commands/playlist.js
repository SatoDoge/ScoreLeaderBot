const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerlist') // コマンド名
        .setDescription('現在追加されているプレイヤーのリストを表示します'), // コマンドの説明
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
                await interaction.reply({ content: 'プレイヤーが追加されていません', ephemeral: true });
                return;
            }

            // プレイヤーリストを表示
            const playerList = players.map(player => `ID: ${player.id}, Name: ${player.name}`).join('\n');
            await interaction.reply({ content: `現在追加されているプレイヤー:\n${playerList}`, ephemeral: true });
        } catch (error) {
            console.error('Error reading players.json:', error);
            await interaction.reply({ content: "プレイヤーリストの読み込み中にエラーが発生しました", ephemeral: true });
        }
    },
};
