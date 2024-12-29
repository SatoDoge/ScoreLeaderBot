const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs'); // fsモジュールをインポート

module.exports = {
    data: new SlashCommandBuilder()
        .setName('post') // コマンド名
        .setDescription('リーダーボードを設定していくチャンネルを設定します') // コマンドの説明
        .addChannelOption(option =>
            option.setName('channel') // オプション名
                .setDescription('テキストチャンネルを選択してください') // オプションの説明
                .setRequired(true) // 必須に設定
                .addChannelTypes(ChannelType.GuildText) // テキストチャンネルに制限
        ),
    async execute(interaction) {
        // 選択されたチャンネルを取得
        const channel = interaction.options.getChannel('channel');
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

            // メッセージを送信し、そのメッセージIDを取得
            const sentMessage = await channel.send('DefaultText');
            
            // メッセージIDをpostJsonに保存
            postJson.postMessageID = sentMessage.id;
            postJson.postChannelID = channel.id

            // JSONデータをファイルに保存
            fs.writeFileSync(filePath, JSON.stringify(postJson, null, 4), 'utf-8');

            // ユーザーに応答
            await interaction.reply({
                content: `デフォルトテキストを送信しました`,
                ephemeral: true // ユーザーにのみ見えるメッセージ
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
