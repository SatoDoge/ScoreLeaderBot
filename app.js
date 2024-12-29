// 必要なdiscord.jsクラスをインポート
const fs = require('node:fs').promises;
const path = require('node:path');
const { REST, Routes, Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// クライアントインスタンスの作成
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const commands = [];

// コマンドファイルを読み込む非同期関数
async function loadCommandFiles() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }

    return commandFiles;
}

// コマンドをDiscordに登録する非同期関数
async function registerCommands() {
    const rest = new REST().setToken(token);

    try {
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log(`Successfully registered ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// スコア処理関数
async function processScores() {
    const filePath = 'data/postData.json';
    console.log("呼び出されました");
    try {
        if (!(await fileExists(filePath))) return;

        const [postJson, mapJson, playerJson] = await Promise.all([
            readJson(filePath),
            readJson('data/scores.json'),
            readJson('data/player.json'),
        ]);
        if (!postJson.isPost) return;

        const channel = await client.channels.fetch(postJson.postChannelID);
        if (!channel || !channel.isTextBased()) return;

        const message = await channel.messages.fetch(postJson.postMessageID);

        for (const mapScore of mapJson) {
            for (const playerData of playerJson) {
                const fetchedData = await fetchData(
                    `https://api.beatleader.xyz/player/${playerData.id}/scorevalue/${mapScore.hash}/${mapScore.difficulty}/${mapScore.characteristic}`
                );

                if (!fetchedData || typeof fetchedData !== 'number') continue;

                const index = mapScore.scores.findIndex(score => score.id === playerData.id);
                const accuracy = Math.round((fetchedData / mapScore.maxScore) * 10000) / 100;

                if (index === -1) {
                    mapScore.scores.push({
                        id: playerData.id,
                        score: fetchedData,
                        acc: accuracy,
                        name: playerData.name,
                    });
                } else if (mapScore.scores[index].score !== fetchedData) {
                    mapScore.scores[index].score = fetchedData;
                    mapScore.scores[index].acc = accuracy;
                }
            }
            mapScore.scores.sort((a, b) => b.score - a.score);
        }

        await Promise.all([
            writeJson('data/scores.json', mapJson),
            writeJson('data/player.json', playerJson),
        ]);

        // テキストでランキングを生成
        const rankings = generateRankings(mapJson);
        await message.edit({ content: rankings });
    } catch (error) {
        console.error('Error processing scores:', error);
    } finally {
        setTimeout(processScores, 100000); // 次回実行
    }
}

// ユーティリティ関数群
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}
// 文字列の長さを正しくカウントする関数（全角文字は2文字としてカウント）
function getStringLength(str) {
    return Array.from(str).reduce((length, char) => {
        return length + (char.match(/[\u4e00-\u9faf]/) ? 2 : 1); // 全角文字は2文字としてカウント
    }, 0);
}


// テキストベースでランク付けを生成
function generateRankings(data) {
    let output = '';
    const overallScores = {};

    // 最大のプレイヤー名長さを計算
    let maxNameLength = 0;
    data.forEach(map => {
        map.scores.forEach(score => {
            const nameLength = getStringLength(score.name);
            if (nameLength > maxNameLength) {
                maxNameLength = nameLength;
            }
        });
    });
    maxNameLength += 2; // +2スペースを追加

    // 各マップのランキングを処理
    data.forEach(map => {
        output += `\n**${map.name}** [${map.difficulty}]\n`;
        map.scores.forEach((score, index) => {
            // プレイヤー名とスコアの列を揃える
            const paddedName = score.name.padEnd(maxNameLength, '   ');   // 最大長さ+2で名前部分を調整
            const paddedScore = String(score.score).padStart(7, '   ');  // スコア部分の調整
            const paddedAcc = String(score.acc).padStart(6, '  ');   // 精度部分の調整

            // 順位を表示
            const rank = index + 1;  // 順位を計算

            output += `${rank}. ${paddedName}${paddedScore} ${paddedAcc}%\n`;

            // 総合スコアを更新
            if (!overallScores[score.id]) {
                overallScores[score.id] = { name: score.name, totalScore: 0, mapsPlayed: 0 };
            }
            overallScores[score.id].totalScore += score.score;
            overallScores[score.id].mapsPlayed += 1;
        });
    });

    // 総合順位を処理
    output += '\n**TotalScore**\n';
    const players = Object.values(overallScores).sort((a, b) => b.totalScore - a.totalScore);
    players.forEach((player, index) => {
        // プレイヤー名とスコアの列を揃える
        const paddedName = player.name.padEnd(maxNameLength, ' ');
        const paddedTotalScore = String(player.totalScore).padStart(7, '  '); // スコア部分の調整
        const paddedMapsPlayed = String(player.mapsPlayed).padStart(3, '  '); // プレイしたマップ数の調整

        const rank = index + 1;  // 順位を計算

        output += `${rank}. ${paddedName}${paddedTotalScore} ${paddedMapsPlayed}\n`;
    });

    return output;
}

function generateMapRanking(map, overallScores) {
    const embed = new EmbedBuilder()
        .setTitle(`Ranking: ${map.name}`)
        .setDescription(`**Difficulty**: ${map.difficulty}`)
        .setColor('Blue');

    map.scores.forEach((score, index) => {
        embed.addFields({
            name: `${index + 1}. ${score.name}`,
            value: `Score: ${score.score}\nAcc: ${score.acc}%`,
            inline: false,
        });

        if (!overallScores[score.id]) {
            overallScores[score.id] = { name: score.name, totalScore: 0, mapsPlayed: 0 };
        }
        overallScores[score.id].totalScore += score.score;
        overallScores[score.id].mapsPlayed += 1;
    });

    return embed;
}

function generateOverallRanking(overallScores) {
    const embed = new EmbedBuilder()
        .setTitle('Overall Rankings')
        .setColor('Green');

    const players = Object.values(overallScores).sort((a, b) => b.totalScore - a.totalScore);

    players.forEach((player, index) => {
        embed.addFields({
            name: `${index + 1}. ${player.name}`,
            value: `Total Score: ${player.totalScore}\nMaps Played: ${player.mapsPlayed}`,
            inline: false,
        });
    });

    return embed;
}

async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

async function readJson(path) {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
}

async function writeJson(path, data) {
    await fs.writeFile(path, JSON.stringify(data, null, 4), 'utf-8');
}

// Discordクライアントのイベントハンドラ
client.once(Events.ClientReady, () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    processScores(); // 起動時にスコア処理開始
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// クライアントをDiscordにログイン
(async () => {
    try {
        await loadCommandFiles();
        await registerCommands();
        await client.login(token);
    } catch (error) {
        console.error('Error initializing bot:', error);
    }
})();
