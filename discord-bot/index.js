/**
 * Boomkit Discord Access Key Registry & Integration Bot
 * 
 * Dependencies:
 *   npm install discord.js @supabase/supabase-js dotenv
 * 
 * Setup:
 *   1. Create a .env file in this directory with the following variables:
 *      DISCORD_TOKEN=your_bot_token_here
 *      CLIENT_ID=your_bot_client_id_here
 *      GUILD_ID=your_discord_server_id_here
 *      VERIFIED_ROLE_ID=id_of_your_wick_verified_role_here
 *      SUPABASE_URL=your_supabase_project_url_here
 *      SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
 * 
 *   2. Register slash commands by running:
 *      node index.js --register
 * 
 *   3. Start the bot:
 *      node index.js
 */

require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Validate environment variables
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'VERIFIED_ROLE_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const env of requiredEnv) {
    if (!process.env[env]) {
        console.error(`Error: Missing required environment variable: ${env}`);
        process.exit(1);
    }
}

// Initialize Supabase Admin Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Define All Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Generate a single-use access key for Boomkit registration (Requires Verification)'),
        
    new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your Discord account to your Boomkit account')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Your Boomkit username')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('password')
                .setDescription('Your Boomkit password')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a player\'s Boomkit profile stats')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Boomkit username to view (defaults to linked account)')
                .setRequired(false)),
                
    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the top 10 Boomkit players')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Sort leaderboard by score or tokens')
                .setRequired(false)
                .addChoices(
                    { name: 'Boom Score', value: 'score' },
                    { name: 'Tokens', value: 'tokens' }
                )),
                
    new SlashCommandBuilder()
        .setName('search-boom')
        .setDescription('Search for a Boom\'s stats, rarity, and sell price')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The name of the Boom to search for')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('gift-tokens')
        .setDescription('Gift tokens to another player')
        .addStringOption(option => 
            option.setName('target')
                .setDescription('The Boomkit username of the recipient')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of tokens to gift')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user in-game (Staff Only)')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Boomkit username to ban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('Duration of ban in hours (leave empty for permanent)')
                .setRequired(false)),
                
    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user in-game (Staff Only)')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Boomkit username to unban')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user in-game (Staff Only)')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Boomkit username to mute')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('Duration of mute in hours (leave empty for permanent)')
                .setRequired(false)),
                
    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user in-game (Staff Only)')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Boomkit username to unmute')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('check-alts')
        .setDescription('Check other accounts sharing the same IP as a user (Staff Only)')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Boomkit username to check alts for')
                .setRequired(true)),
].map(command => command.toJSON());

// Slash Command Registration Helper
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Registering application (/) commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Successfully registered application (/) commands.');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}

// Check command line arguments for registration command
if (process.argv.includes('--register')) {
    registerCommands().then(() => process.exit(0));
    return;
}

// ==========================================
// HELPERS
// ==========================================

// Parse live page.tsx for PACKS config
function loadBoomsData() {
    try {
        const filePath = path.join(__dirname, '../app/page.tsx');
        if (!fs.existsSync(filePath)) {
            console.error('page.tsx does not exist at:', filePath);
            return [];
        }
        const content = fs.readFileSync(filePath, 'utf8');
        
        const startMarker = 'const PACKS: Pack[] = [';
        const startIndex = content.indexOf(startMarker);
        if (startIndex === -1) {
            console.error('Failed to locate PACKS array in page.tsx');
            return [];
        }
        
        let bracketCount = 1;
        let currentIndex = startIndex + startMarker.length;
        let arrayContentStr = '';
        
        while (bracketCount > 0 && currentIndex < content.length) {
            const char = content[currentIndex];
            if (char === '[') bracketCount++;
            else if (char === ']') bracketCount--;
            
            if (bracketCount > 0) {
                arrayContentStr += char;
            }
            currentIndex++;
        }
        
        const packs = [];
        let objectBracketCount = 0;
        let currentPackStr = '';
        let insideObject = false;
        
        for (let i = 0; i < arrayContentStr.length; i++) {
            const char = arrayContentStr[i];
            if (char === '{') {
                objectBracketCount++;
                insideObject = true;
            }
            
            if (insideObject) {
                currentPackStr += char;
            }
            
            if (char === '}') {
                objectBracketCount--;
                if (objectBracketCount === 0) {
                    insideObject = false;
                    try {
                        const packObj = eval(`(${currentPackStr})`);
                        packs.push(packObj);
                    } catch (err) {
                        // ignore eval failure
                    }
                    currentPackStr = '';
                }
            }
        }
        
        return packs;
    } catch (error) {
        console.error('Error parsing page.tsx for booms:', error);
        return [];
    }
}

// Timing safe hex comparison
function timingSafeHexEqual(leftHex, rightHex) {
    try {
        const left = Buffer.from(leftHex, 'hex');
        const right = Buffer.from(rightHex, 'hex');
        return left.length === right.length && crypto.timingSafeEqual(left, right);
    } catch {
        return false;
    }
}

// Async scrypt helper
function scryptAsync(password, salt, keyLength, options) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, keyLength, options, (error, derivedKey) => {
            if (error) reject(error);
            else resolve(derivedKey);
        });
    });
}

// Scrypt password verification matching Next.js logic
async function verifyPassword(password, storedHash) {
    if (!storedHash || typeof password !== 'string') {
        return { valid: false };
    }
    const ALGORITHM = 'scrypt';
    const SCRYPT_MAXMEM = 64 * 1024 * 1024;

    if (storedHash.startsWith(`${ALGORITHM}$`)) {
        const [algorithm, nRaw, rRaw, pRaw, salt, keyHex] = storedHash.split('$');
        const n = Number(nRaw);
        const r = Number(rRaw);
        const p = Number(pRaw);

        if (
            algorithm !== ALGORITHM ||
            !Number.isInteger(n) ||
            !Number.isInteger(r) ||
            !Number.isInteger(p) ||
            !salt ||
            !/^[a-f0-9]+$/i.test(keyHex)
        ) {
            return { valid: false };
        }

        const expectedKey = Buffer.from(keyHex, 'hex');
        const actualKey = await scryptAsync(password, salt, expectedKey.length, {
            N: n,
            r,
            p,
            maxmem: SCRYPT_MAXMEM,
        });

        const valid = expectedKey.length === actualKey.length && crypto.timingSafeEqual(expectedKey, actualKey);
        return { valid };
    }

    if (/^[a-f0-9]{64}$/i.test(storedHash)) {
        const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
        const valid = timingSafeHexEqual(legacyHash, storedHash);
        return { valid };
    }

    return { valid: false };
}

// Find Boomkit username linked to a Discord User ID
async function getLinkedUsername(discordUserId) {
    const { data, error } = await supabase
        .from('access_keys')
        .select('used_by_username')
        .eq('discord_user_id', discordUserId)
        .eq('is_used', true)
        .maybeSingle();
    
    if (error || !data) return null;
    return data.used_by_username;
}

// ==========================================
// INITIALIZE DISCORD CLIENT
// ==========================================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
    console.log(`Verified Role ID set to: ${process.env.VERIFIED_ROLE_ID}`);
    const loaded = loadBoomsData();
    console.log(`Loaded ${loaded.length} packs from page.tsx config.`);
});

// Handle Interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, member, user } = interaction;

    // --- GETKEY COMMAND ---
    if (commandName === 'getkey') {
        try {
            const isOwner = interaction.guild?.ownerId === member.id;
            const isAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);
            const isVerified = member.roles.cache.has(process.env.VERIFIED_ROLE_ID);

            if (!isVerified && !isAdmin && !isOwner) {
                return interaction.reply({
                    content: '🛑 **Access Denied**: You must pass server verification first to generate an access key!',
                    ephemeral: true
                });
            }

            const { data: existingKey, error: checkError } = await supabase
                .from('access_keys')
                .select('key')
                .eq('discord_user_id', user.id)
                .eq('is_used', false)
                .maybeSingle();

            if (checkError) {
                console.error('[Bot DB Check] Error:', checkError);
                return interaction.reply({
                    content: '⚠️ An error occurred while checking your status. Please try again later.',
                    ephemeral: true
                });
            }

            if (existingKey) {
                return interaction.reply({
                    content: `🔑 **You already have a key**: You have an unused access key available!\n\nUse this key on the signup form:\n\`\`\`\n${existingKey.key}\n\`\`\``,
                    ephemeral: true
                });
            }

            const randomHex1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const randomHex2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const newKey = `BK-KEY-${randomHex1}-${randomHex2}`;

            const { error: insertError } = await supabase
                .from('access_keys')
                .insert({
                    key: newKey,
                    discord_user_id: user.id,
                    is_used: false
                });

            if (insertError) {
                console.error('[Bot DB Insert] Error:', insertError);
                return interaction.reply({
                    content: '⚠️ Failed to generate your access key in the database. Please contact an admin.',
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: `🎉 **Verification Access Key Generated!**\n\nHere is your unique, single-use key to sign up for Boomkit. Do not share this key with anyone else:\n\`\`\`\n${newKey}\n\`\`\`\nPaste this in the **Discord Access Key** field on the signup page.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('[Bot Interaction getkey] Error:', error);
            return interaction.reply({
                content: '⚠️ An unexpected error occurred. Please contact a moderator.',
                ephemeral: true
            });
        }
    }

    // --- LINK COMMAND ---
    if (commandName === 'link') {
        const username = interaction.options.getString('username').trim();
        const password = interaction.options.getString('password');
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const { data: userRecord, error } = await supabase
                .from('users')
                .select('id, username, password_hash')
                .ilike('username', username)
                .maybeSingle();
                
            if (error || !userRecord) {
                return interaction.editReply({ content: '🛑 **User Not Found**: A Boomkit user with that username does not exist!' });
            }
            
            const passwordCheck = await verifyPassword(password, userRecord.password_hash);
            if (!passwordCheck.valid) {
                return interaction.editReply({ content: '🛑 **Invalid Password**: The password you entered is incorrect!' });
            }
            
            const { data: linkedByDiscord } = await supabase
                .from('access_keys')
                .select('used_by_username')
                .eq('discord_user_id', interaction.user.id)
                .eq('is_used', true)
                .maybeSingle();
                
            if (linkedByDiscord) {
                return interaction.editReply({ content: `⚠️ **Already Linked**: Your Discord account is already linked to Boomkit username **${linkedByDiscord.used_by_username}**!` });
            }
            
            const { data: linkedByUsername } = await supabase
                .from('access_keys')
                .select('discord_user_id')
                .eq('used_by_username', userRecord.username)
                .eq('is_used', true)
                .maybeSingle();
                
            if (linkedByUsername) {
                return interaction.editReply({ content: `⚠️ **Username Already Linked**: Boomkit username **${userRecord.username}** is already linked to a different Discord account!` });
            }
            
            const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
            const linkKey = `BK-LINK-${randomHex}`;
            
            const { error: insertError } = await supabase
                .from('access_keys')
                .insert({
                    key: linkKey,
                    discord_user_id: interaction.user.id,
                    is_used: true,
                    used_by_username: userRecord.username
                });
                
            if (insertError) {
                console.error('[Link DB Insert] Error:', insertError);
                return interaction.editReply({ content: '⚠️ Failed to link account in the database. Please contact an admin.' });
            }
            
            return interaction.editReply({ content: `🎉 **Success**: Your Discord account has been successfully linked to Boomkit user **${userRecord.username}**!` });
        } catch (err) {
            console.error('[Interaction link] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while linking.' });
        }
    }

    // --- PROFILE COMMAND ---
    if (commandName === 'profile') {
        const targetUsername = interaction.options.getString('username')?.trim();
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            let username = targetUsername;
            if (!username) {
                username = await getLinkedUsername(interaction.user.id);
                if (!username) {
                    return interaction.editReply({ content: '⚠️ **Not Linked**: You have not linked your Discord account yet. Please run `/link [username] [password]` first, or provide a username to view!' });
                }
            }
            
            const { data: userRecord, error } = await supabase
                .from('users')
                .select('*')
                .ilike('username', username)
                .maybeSingle();
                
            if (error || !userRecord) {
                return interaction.editReply({ content: `🛑 **User Not Found**: A Boomkit user with the username **${username}** does not exist!` });
            }
            
            const boomsObj = userRecord.booms || {};
            const uniqueBooms = Object.keys(boomsObj).length;
            const totalBooms = Object.values(boomsObj).reduce((sum, val) => sum + (val || 0), 0);
            
            const badges = userRecord.badges && userRecord.badges.length > 0
                ? userRecord.badges.join(' ')
                : 'None';
                
            const embed = {
                color: userRecord.is_owner ? 0xff0000 : (userRecord.role === 'admin' ? 0x9900ff : 0x00ff00),
                title: `${userRecord.profile_picture || '🎯'} ${userRecord.username}'s Boomkit Profile`,
                description: userRecord.reason ? `*"${userRecord.reason}"*` : null,
                fields: [
                    { name: '👤 Role', value: userRecord.role ? userRecord.role.toUpperCase() : 'PLAYER', inline: true },
                    { name: '⭐ Level', value: `Level ${userRecord.level || 1} (${userRecord.xp || 0} XP)`, inline: true },
                    { name: '💎 Tokens', value: `${userRecord.tokens || 0} tokens`, inline: true },
                    { name: '🏆 Boom Score', value: `${userRecord.boom_score || 0}`, inline: true },
                    { name: '📁 Total Value', value: `${userRecord.total_value || 0} credits`, inline: true },
                    { name: '🔥 Packs Opened', value: `${userRecord.packs_opened || 0}`, inline: true },
                    { name: '🎨 Unique Booms', value: `${uniqueBooms} unique (${totalBooms} total)`, inline: true },
                    { name: '📅 Join Date', value: userRecord.join_date || 'Unknown', inline: true },
                    { name: '🏷️ Badges', value: badges, inline: false }
                ],
                footer: { text: `User ID: ${userRecord.id}` },
                timestamp: new Date().toISOString()
            };
            
            if (userRecord.is_banned) {
                embed.fields.push({ name: '🛑 Ban Status', value: `**Banned**: ${userRecord.ban_reason || 'No reason specified'}` });
            }
            if (userRecord.is_muted) {
                embed.fields.push({ name: '🔇 Mute Status', value: `**Muted**` });
            }
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('[Interaction profile] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while fetching the profile.' });
        }
    }

    // --- LEADERBOARD COMMAND ---
    if (commandName === 'leaderboard') {
        const type = interaction.options.getString('type') || 'score';
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const orderByField = type === 'tokens' ? 'tokens' : 'boom_score';
            const titleText = type === 'tokens' ? 'Tokens' : 'Boom Score';
            
            const { data: topPlayers, error } = await supabase
                .from('users')
                .select('username, tokens, boom_score')
                .eq('is_banned', false)
                .order(orderByField, { ascending: false })
                .limit(10);
                
            if (error || !topPlayers || topPlayers.length === 0) {
                return interaction.editReply({ content: '⚠️ No players found or failed to query leaderboard.' });
            }
            
            let leaderboardText = '';
            topPlayers.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}.`));
                const scoreVal = type === 'tokens' ? `${player.tokens} tokens` : `${player.boom_score || 0} score`;
                leaderboardText += `${medal} **${player.username}** - ${scoreVal}\n`;
            });
            
            const embed = {
                color: 0x00aaff,
                title: `🏆 Boomkit Top 10 Leaderboard (${titleText})`,
                description: leaderboardText,
                timestamp: new Date().toISOString()
            };
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('[Interaction leaderboard] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while fetching the leaderboard.' });
        }
    }

    // --- SEARCH-BOOM COMMAND ---
    if (commandName === 'search-boom') {
        const boomName = interaction.options.getString('name').trim().toLowerCase();
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const packs = loadBoomsData();
            let foundBoom = null;
            let foundPack = null;
            
            for (const pack of packs) {
                if (!pack.booms) continue;
                const match = pack.booms.find(b => b.name && b.name.toLowerCase() === boomName);
                if (match) {
                    foundBoom = match;
                    foundPack = pack;
                    break;
                }
            }
            
            if (!foundBoom) {
                return interaction.editReply({ content: `❌ **Boom Not Found**: Could not find a Boom named "*${interaction.options.getString('name')}*" in the pack registry.` });
            }
            
            const rarityColors = {
                uncommon: 0xa8a8a8,
                rare: 0x00ccff,
                epic: 0xcc00ff,
                legendary: 0xffcc00,
                hidden: 0x333333,
                chroma: 0xff00aa,
                mystical: 0xff0000
            };
            
            const rarityPrice = {
                uncommon: 5,
                rare: 20,
                epic: 75,
                legendary: 200,
                hidden: 750,
                chroma: 1000,
                mystical: 5000
            };
            
            const color = rarityColors[foundBoom.rarity] || 0xffffff;
            const sellPrice = rarityPrice[foundBoom.rarity] || 'Unknown';
            
            const embed = {
                color: color,
                title: `${foundBoom.avatar && !foundBoom.avatar.startsWith('/') ? foundBoom.avatar : '🎈'} ${foundBoom.name}`,
                description: foundBoom.description || 'No description available.',
                fields: [
                    { name: '📦 Pack Name', value: foundPack.name || 'Unknown', inline: true },
                    { name: '💎 Rarity', value: foundBoom.rarity ? foundBoom.rarity.toUpperCase() : 'UNKNOWN', inline: true },
                    { name: '🪙 Sell Value', value: `${sellPrice} credits`, inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('[Interaction search-boom] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while searching for the Boom.' });
        }
    }

    // --- GIFT-TOKENS COMMAND ---
    if (commandName === 'gift-tokens') {
        const targetUsername = interaction.options.getString('target').trim();
        const amount = interaction.options.getInteger('amount');
        
        if (amount <= 0) {
            return interaction.reply({ content: '🛑 **Invalid Amount**: You must gift at least 1 token!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const senderUsername = await getLinkedUsername(interaction.user.id);
            if (!senderUsername) {
                return interaction.editReply({ content: '🛑 **Not Linked**: Your Discord account is not linked to any Boomkit username. Link it using `/link [username] [password]` first!' });
            }
            
            if (senderUsername.toLowerCase() === targetUsername.toLowerCase()) {
                return interaction.editReply({ content: '🛑 **Self-Gift**: You cannot gift tokens to yourself!' });
            }
            
            const { data: senderRecord, error: senderErr } = await supabase
                .from('users')
                .select('tokens')
                .eq('username', senderUsername)
                .single();
                
            if (senderErr || !senderRecord) {
                return interaction.editReply({ content: '🛑 **Error**: Could not retrieve your account data.' });
            }
            
            if (senderRecord.tokens < amount) {
                return interaction.editReply({ content: `🛑 **Insufficient Balance**: You only have **${senderRecord.tokens}** tokens (trying to gift **${amount}**).` });
            }
            
            const { data: targetRecord, error: targetErr } = await supabase
                .from('users')
                .select('tokens, username')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (targetErr || !targetRecord) {
                return interaction.editReply({ content: `🛑 **User Not Found**: Recipient **${targetUsername}** does not exist in Boomkit!` });
            }
            
            const { error: deductErr } = await supabase
                .from('users')
                .update({ tokens: senderRecord.tokens - amount })
                .eq('username', senderUsername);
                
            if (deductErr) {
                console.error('[Gift DB Deduct] Error:', deductErr);
                return interaction.editReply({ content: '⚠️ Failed to complete transaction. Balance deduction failed.' });
            }
            
            const { error: creditErr } = await supabase
                .from('users')
                .update({ tokens: targetRecord.tokens + amount })
                .eq('username', targetRecord.username);
                
            if (creditErr) {
                console.error('[Gift DB Credit] Error:', creditErr);
                await supabase.from('users').update({ tokens: senderRecord.tokens }).eq('username', senderUsername);
                return interaction.editReply({ content: '⚠️ Failed to complete transaction. Balance credit failed. Deduction reverted.' });
            }
            
            return interaction.editReply({ content: `💸 **Tokens Gifted!**\n\n**${senderUsername}** successfully gifted **${amount}** tokens to **${targetRecord.username}**!` });
        } catch (err) {
            console.error('[Interaction gift-tokens] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred during the transaction.' });
        }
    }

    // --- BAN COMMAND ---
    if (commandName === 'ban') {
        const targetUsername = interaction.options.getString('username').trim();
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getInteger('duration');
        
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const { data: userRecord, error: fetchErr } = await supabase
                .from('users')
                .select('id, username')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (fetchErr || !userRecord) {
                return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
            }
            
            const expiryTime = duration ? (Date.now() + duration * 3600000) : null;
            
            const { error: updateErr } = await supabase
                .from('users')
                .update({
                    is_banned: true,
                    ban_reason: reason,
                    ban_expiry: expiryTime
                })
                .eq('username', userRecord.username);
                
            if (updateErr) {
                console.error('[Ban DB Update] Error:', updateErr);
                return interaction.editReply({ content: `❌ Failed to ban user **${userRecord.username}** in database.` });
            }
            
            const durationText = duration ? `for **${duration} hours**` : '**permanently**';
            return interaction.editReply({ content: `🛑 **Player Banned!**\n\n**${userRecord.username}** has been banned ${durationText}.\n📝 **Reason**: ${reason}` });
        } catch (err) {
            console.error('[Interaction ban] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while banning.' });
        }
    }

    // --- UNBAN COMMAND ---
    if (commandName === 'unban') {
        const targetUsername = interaction.options.getString('username').trim();
        
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const { data: userRecord, error: fetchErr } = await supabase
                .from('users')
                .select('id, username')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (fetchErr || !userRecord) {
                return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
            }
            
            const { error: updateErr } = await supabase
                .from('users')
                .update({
                    is_banned: false,
                    ban_reason: null,
                    ban_expiry: null
                })
                .eq('username', userRecord.username);
                
            if (updateErr) {
                console.error('[Unban DB Update] Error:', updateErr);
                return interaction.editReply({ content: `❌ Failed to unban user **${userRecord.username}** in database.` });
            }
            
            return interaction.editReply({ content: `✅ **Player Unbanned!**\n\n**${userRecord.username}** has been unbanned and can log in again.` });
        } catch (err) {
            console.error('[Interaction unban] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while unbanning.' });
        }
    }

    // --- MUTE COMMAND ---
    if (commandName === 'mute') {
        const targetUsername = interaction.options.getString('username').trim();
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getInteger('duration');
        
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const { data: userRecord, error: fetchErr } = await supabase
                .from('users')
                .select('id, username')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (fetchErr || !userRecord) {
                return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
            }
            
            let expiryTime = null;
            if (duration) {
                const expDate = new Date();
                expDate.setHours(expDate.getHours() + duration);
                expiryTime = expDate.toISOString();
            }
            
            const { error: updateErr } = await supabase
                .from('users')
                .update({
                    is_muted: true,
                    mute_expiry: expiryTime
                })
                .eq('username', userRecord.username);
                
            if (updateErr) {
                console.error('[Mute DB Update] Error:', updateErr);
                return interaction.editReply({ content: `❌ Failed to mute user **${userRecord.username}** in database.` });
            }
            
            const durationText = duration ? `for **${duration} hours**` : '**permanently**';
            return interaction.editReply({ content: `🔇 **Player Muted!**\n\n**${userRecord.username}** has been muted in chat ${durationText}.\n📝 **Reason**: ${reason}` });
        } catch (err) {
            console.error('[Interaction mute] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while muting.' });
        }
    }

    // --- UNMUTE COMMAND ---
    if (commandName === 'unmute') {
        const targetUsername = interaction.options.getString('username').trim();
        
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const { data: userRecord, error: fetchErr } = await supabase
                .from('users')
                .select('id, username')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (fetchErr || !userRecord) {
                return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
            }
            
            const { error: updateErr } = await supabase
                .from('users')
                .update({
                    is_muted: false,
                    mute_expiry: null
                })
                .eq('username', userRecord.username);
                
            if (updateErr) {
                console.error('[Unmute DB Update] Error:', updateErr);
                return interaction.editReply({ content: `❌ Failed to unmute user **${userRecord.username}** in database.` });
            }
            
            return interaction.editReply({ content: `🔊 **Player Unmuted!**\n\n**${userRecord.username}** has been unmuted in chat.` });
        } catch (err) {
            console.error('[Interaction unmute] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while unmuting.' });
        }
    }

    // --- CHECK-ALTS COMMAND ---
    if (commandName === 'check-alts') {
        const targetUsername = interaction.options.getString('username').trim();
        
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const { data: targetRecord, error: targetErr } = await supabase
                .from('users')
                .select('username, last_ip')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (targetErr || !targetRecord) {
                return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
            }
            
            const ip = targetRecord.last_ip;
            if (!ip || ip === '127.0.0.1') {
                return interaction.editReply({ content: `ℹ️ User **${targetRecord.username}** has no logged IP address (or is 127.0.0.1). Cannot check alts.` });
            }
            
            const { data: alts, error: altsErr } = await supabase
                .from('users')
                .select('username, is_banned, role, join_date')
                .eq('last_ip', ip);
                
            if (altsErr || !alts) {
                return interaction.editReply({ content: '⚠️ Error querying for alt accounts.' });
            }
            
            const otherAlts = alts.filter(a => a.username.toLowerCase() !== targetRecord.username.toLowerCase());
            
            if (otherAlts.length === 0) {
                return interaction.editReply({ content: `✅ **No alts found** for **${targetRecord.username}** (IP: \`${ip}\`).` });
            }
            
            let altsListText = `Other accounts registered/logged under the same IP (\`${ip}\`):\n\n`;
            otherAlts.forEach(alt => {
                const status = alt.is_banned ? '❌ Banned' : '✅ Active';
                altsListText += `- **${alt.username}** [${alt.role}] - Status: ${status} (Joined: ${alt.join_date})\n`;
            });
            
            const embed = {
                color: 0xff5500,
                title: `🔍 Alt Account Check for ${targetRecord.username}`,
                description: altsListText,
                timestamp: new Date().toISOString()
            };
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('[Interaction check-alts] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while checking alts.' });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
