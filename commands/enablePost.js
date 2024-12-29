const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settingpost')
        .setDescription('リーダーボードを更新するかどうかを設定します')
        .addBooleanOption(option =>
            option.setName('isupdate') // オプション名
                .setDescription('更新を有効化するかどうか') // オプションの説明
                .setRequired(true) // 必須に設定
        ),
    async execute(interaction) {
        const confirm = interaction.options.getBoolean('isupdate');
        const filePath = "data/postData.json";

        try {
            // ファイルの存在確認
            if (!fs.existsSync(filePath)) {
                // ファイルが存在しない場合は初期データを作成
                fs.writeFileSync(filePath, JSON.stringify({ isPost: false }, null, 4), 'utf-8');
            }

            // ファイル読み込みとパース
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const postJson = JSON.parse(fileContent);

            // 値を更新
            postJson.isPost = confirm;

            // ファイル書き込み
            fs.writeFileSync(filePath, JSON.stringify(postJson, null, 4), 'utf-8');

            // ユーザーに返信
            await interaction.reply({
                content: confirm ? "有効化しました" : "無効化しました",
                ephemeral: true
            });
        } catch (error) {
            console.error('Error handling postData.json:', error);
            await interaction.reply({
                content: "設定の更新中にエラーが発生しました。",
                ephemeral: true
            });
        }
    },
};
