const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteplayer') // コマンド名
        .setDescription('リーダーからプレイヤーを削除します') // コマンドの説明
        .addStringOption(option =>
            option.setName('id') // オプション名
                .setDescription('削除するプレイヤーのScoreSaber ID') // オプションの説明
                .setRequired(true) // 必須に設定
        ),
    async execute(interaction) {
        const inputId = interaction.options.getString('id'); // 入力されたID
        const filePath = 'data/player.json';

        try {
            // JSONファイルを読み込む（存在しない場合はエラー）
            if (!fs.existsSync(filePath)) {
                await interaction.reply({ content: 'プレイヤーデータファイルが存在しません。', ephemeral: true });
                return;
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const playerJson = JSON.parse(fileContent);

            // プレイヤーを検索
            const index = playerJson.findIndex(player => player.id === inputId);
            if (index === -1) {
                await interaction.reply({ content: '指定されたプレイヤーはデータに存在しません。', ephemeral: true });
                return;
            }

            // プレイヤーを削除
            playerJson.splice(index, 1);

            // JSONファイルに書き込み
            fs.writeFileSync(filePath, JSON.stringify(playerJson, null, 4), 'utf-8');
            await interaction.reply({ content: 'プレイヤーを削除しました。', ephemeral: true });
        } catch (error) {
            console.error('エラーが発生しました:', error);
            await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
        }
    },
};
