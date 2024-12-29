const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maplist') // コマンド名
        .setDescription('現在追加されているマップのリストを表示します'), // コマンドの説明
    async execute(interaction) {
        const filePath = "data/scores.json";  // マップのデータファイル

        try {
            // ファイルが存在するか確認
            if (!fs.existsSync(filePath)) {
                await interaction.reply({ content: 'マップリストは空です', ephemeral: true });
                return;
            }

            // ファイルの読み込みとパース
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const maps = JSON.parse(fileContent);

            // マップリストが空でない場合
            if (maps.length === 0) {
                await interaction.reply({ content: 'マップが追加されていません', ephemeral: true });
                return;
            }

            // マップリストを表示
            const mapList = maps.map(map => `ID: ${map.id}, Name: ${map.name}, Game Mode: ${map.characteristic}, Difficulty: ${map.difficulty}`).join('\n');
            await interaction.reply({ content: `現在追加されているマップ:\n${mapList}`, ephemeral: true });
        } catch (error) {
            console.error('Error reading maps.json:', error);
            await interaction.reply({ content: "マップリストの読み込み中にエラーが発生しました", ephemeral: true });
        }
    },
};
