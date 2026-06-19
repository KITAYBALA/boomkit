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
const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
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

    new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Wager your tokens on a 50/50 coin flip')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of tokens to bet (Min: 100, Max: 10000)')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Start a trivia question and win 100 tokens! (5 runs per hour limit)'),

    new SlashCommandBuilder()
        .setName('claim-daily')
        .setDescription('Claim your daily token reward directly from Discord'),
        
    new SlashCommandBuilder()
        .setName('claim-code')
        .setDescription('Redeem a promo code for tokens')
        .addStringOption(option => 
            option.setName('code')
                .setDescription('The promo code to redeem')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('create-code')
        .setDescription('Create a new promo code (Staff Only)')
        .addStringOption(option => 
            option.setName('code')
                .setDescription('The code text (e.g. WELCOME100)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('reward')
                .setDescription('Tokens rewarded upon redemption')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('max_uses')
                .setDescription('Maximum number of times this code can be claimed overall')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('duration_hours')
                .setDescription('Number of hours before this code expires (leave empty for never)')
                .setRequired(false)),
                
    new SlashCommandBuilder()
        .setName('active-codes')
        .setDescription('View all currently active promo codes (Staff Only)'),

    new SlashCommandBuilder()
        .setName('auth')
        .setDescription('Authentication administration commands (Staff Only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Reset a player\'s password (Staff Only)')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('Boomkit username to update')
                        .setRequired(true))
        ),
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
// IN-MEMORY COOLDOWNS & STATIC DATA
// ==========================================
const coinflipCooldowns = new Map(); // discordUserId -> timestamp of next allowed flip
const triviaHostLimits = new Map();  // discordUserId -> array of timestamps of last runs

const TRIVIA_QUESTIONS = [
    {
        question: "Which rarity of Boom has a 0.01% drop rate?",
        options: ["A) Legendary", "B) Chroma", "C) Hidden", "D) Mystical"],
        correct: "D",
        correctText: "D) Mystical"
    },
    {
        question: "How many Booms are there in each Pack in the new update?",
        options: ["A) 6", "B) 8", "C) 10", "D) 12"],
        correct: "D",
        correctText: "D) 12"
    },
    {
        question: "What is the sell price of a Hidden rarity Boom?",
        options: ["A) 200 credits", "B) 500 credits", "C) 750 credits", "D) 1000 credits"],
        correct: "C",
        correctText: "C) 750 credits"
    },
    {
        question: "Which of these is NOT a pack in Boomkit?",
        options: ["A) Dino Pack", "B) Aquatic Pack", "C) Insect Pack", "D) Space Pack"],
        correct: "C",
        correctText: "C) Insect Pack (It is actually named 'Bug Pack')"
    },
    {
        question: "What is the drop rate percentage of a Hidden Boom?",
        options: ["A) 0.01%", "B) 0.09%", "C) 0.1%", "D) 0.9%"],
        correct: "B",
        correctText: "B) 0.09%"
    },
    {
        question: "What is the capital of France?",
        options: ["A) Berlin", "B) Madrid", "C) Paris", "D) Rome"],
        correct: "C",
        correctText: "C) Paris"
    },
    {
        question: "Which planet is closest to the Sun?",
        options: ["A) Venus", "B) Earth", "C) Mercury", "D) Mars"],
        correct: "C",
        correctText: "C) Mercury"
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["A) Atlantic Ocean", "B) Indian Ocean", "C) Arctic Ocean", "D) Pacific Ocean"],
        correct: "D",
        correctText: "D) Pacific Ocean"
    },
    {
        question: "Which element has the chemical symbol 'O'?",
        options: ["A) Osmium", "B) Oxygen", "C) Gold", "D) Helium"],
        correct: "B",
        correctText: "B) Oxygen"
    },
    {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["A) Charles Dickens", "B) William Shakespeare", "C) Mark Twain", "D) Jane Austen"],
        correct: "B",
        correctText: "B) William Shakespeare"
    },
    {
        question: "How many continents are there on Earth?",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correct: "C",
        correctText: "C) 7"
    },
    {
        question: "What is the boiling point of water in Celsius?",
        options: ["A) 50°C", "B) 90°C", "C) 100°C", "D) 120°C"],
        correct: "C",
        correctText: "C) 100°C"
    },
    {
        question: "Which gas do plants absorb from the atmosphere for photosynthesis?",
        options: ["A) Oxygen", "B) Nitrogen", "C) Hydrogen", "D) Carbon Dioxide"],
        correct: "D",
        correctText: "D) Carbon Dioxide"
    },
    {
        question: "How many legs does a spider typically have?",
        options: ["A) 6", "B) 8", "C) 10", "D) 12"],
        correct: "B",
        correctText: "B) 8"
    },
    {
        question: "What is the name of the wizard in the Medieval Pack?",
        options: ["A) Gandalf", "B) Harry", "C) Merlin", "D) Dumbledore"],
        correct: "C",
        correctText: "C) Merlin"
    },
    {
        question: "Which company created the game engine 'Unreal Engine'?",
        options: ["A) Unity Technologies", "B) Epic Games", "C) Valve", "C) EA"],
        correct: "B",
        correctText: "B) Epic Games"
    },
    {
        question: "What is the currency symbol used for tokens in Boomkit?",
        options: ["A) 🪙", "B) 💎", "C) 💵", "D) 💵"],
        correct: "B",
        correctText: "B) 💎 (Tokens are represented by gems/diamonds)"
    },
    {
        question: "In what year did the Titanic sink?",
        options: ["A) 1908", "B) 1912", "C) 1916", "D) 1920"],
        correct: "B",
        correctText: "B) 1912"
    },
    {
        question: "Which organ is responsible for pumping blood throughout the human body?",
        options: ["A) Lungs", "B) Brain", "C) Liver", "D) Heart"],
        correct: "D",
        correctText: "D) Heart"
    },
    {
        question: "What is the speed of light approximately?",
        options: ["A) 150,000 km/s", "B) 300,000 km/s", "C) 450,000 km/s", "D) 600,000 km/s"],
        correct: "B",
        correctText: "B) 300,000 km/s"
    }
];

// ==========================================
// HELPERS
// ==========================================

function cleanAndParseJSObject(str) {
    // 1. Remove comments
    let cleaned = str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    // 2. Convert single-quoted strings to double-quoted strings
    cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
    // 3. Quote keys
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    // 4. Remove trailing commas
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned);
}

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
                        const packObj = cleanAndParseJSObject(currentPackStr);
                        packs.push(packObj);
                    } catch (err) {
                        // ignore parse failure
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

// Hash password matching Next.js logic
async function hashPassword(password) {
    const ALGORITHM = 'scrypt';
    const KEY_LENGTH = 64;
    const SCRYPT_N = 16384;
    const SCRYPT_R = 8;
    const SCRYPT_P = 1;
    const SCRYPT_MAXMEM = 64 * 1024 * 1024;

    const salt = crypto.randomBytes(16).toString('hex');
    const key = await scryptAsync(password, salt, KEY_LENGTH, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: SCRYPT_MAXMEM,
    });

    return `${ALGORITHM}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${key.toString('hex')}`;
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

// Global Error Handlers to prevent crashes from WebSocket disconnections (e.g. ECONNRESET)
client.on('error', error => {
    console.error('Discord Client WebSocket Error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

client.once('ready', () => {
    console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
    console.log(`Verified Role ID set to: ${process.env.VERIFIED_ROLE_ID}`);
    const loaded = loadBoomsData();
    console.log(`Loaded ${loaded.length} packs from page.tsx config.`);
});

// Handle Interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('auth_update_modal:')) {
            const targetUsername = interaction.customId.split(':')[1];
            const newPassword = interaction.fields.getTextInputValue('new_password');

            await interaction.deferReply({ ephemeral: true });
            try {
                // Validate password strength according to L-02 password rules
                // Enforce minimum length, uppercase, lowercase, numbers, and special characters
                if (newPassword.length < 8) {
                    return interaction.editReply({ content: '🛑 **Invalid Password**: The password must be at least 8 characters long!' });
                }
                const hasUpper = /[A-Z]/.test(newPassword);
                const hasLower = /[a-z]/.test(newPassword);
                const hasNumber = /[0-9]/.test(newPassword);
                const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
                if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                    return interaction.editReply({ content: '🛑 **Weak Password**: Password must contain uppercase, lowercase, numbers, and special characters.' });
                }

                // Fetch target user
                const { data: userRecord, error: fetchErr } = await supabase
                    .from('users')
                    .select('id, username')
                    .ilike('username', targetUsername)
                    .maybeSingle();
                    
                if (fetchErr || !userRecord) {
                    return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
                }
                
                // Hash the new password
                const newHash = await hashPassword(newPassword);
                
                // Update in database
                const { error: updateErr } = await supabase
                    .from('users')
                    .update({ password_hash: newHash })
                    .eq('id', userRecord.id);
                    
                if (updateErr) {
                    console.error('[Auth Update DB] Error:', updateErr);
                    return interaction.editReply({ content: `❌ Failed to update password for user **${userRecord.username}** in database.` });
                }
                
                return interaction.editReply({ content: `🔒 **Password Reset Successful!**\n\nSuccessfully reset password for player **${userRecord.username}**.` });
            } catch (err) {
                console.error('[Interaction auth update modal] Error:', err);
                return interaction.editReply({ content: '⚠️ An unexpected error occurred while resetting the password.' });
            }
        }
        return;
    }
    
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

            const part1 = crypto.randomBytes(4).toString('hex').toUpperCase();
            const part2 = crypto.randomBytes(4).toString('hex').toUpperCase();
            const part3 = crypto.randomBytes(4).toString('hex').toUpperCase();
            const newKey = `BK-KEY-${part1}-${part2}-${part3}`;

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
            
            const { data: targetRecord, error: targetFetchErr } = await supabase
                .from('users')
                .select('username')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (targetFetchErr || !targetRecord) {
                return interaction.editReply({ content: `🛑 **User Not Found**: Recipient **${targetUsername}** does not exist in Boomkit!` });
            }

            const { error: rpcErr } = await supabase
                .rpc('transfer_tokens', {
                    p_sender_username: senderUsername,
                    p_receiver_username: targetRecord.username,
                    p_amount: amount
                });

            if (rpcErr) {
                console.error('[Gift DB RPC] Error:', rpcErr);
                return interaction.editReply({ content: `🛑 **Error**: ${rpcErr.message || 'Transaction failed.'}` });
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
                .select('username, last_ip, mac_address')
                .ilike('username', targetUsername)
                .maybeSingle();
                
            if (targetErr || !targetRecord) {
                return interaction.editReply({ content: `❌ **User Not Found**: Boomkit user **${targetUsername}** does not exist.` });
            }
            
            const mac = targetRecord.mac_address;
            const ip = targetRecord.last_ip;
            
            let queryField = '';
            let queryValue = '';
            let matchType = '';
            
            if (mac && mac.trim() !== '' && mac !== 'null') {
                queryField = 'mac_address';
                queryValue = mac;
                matchType = 'device ID';
            } else if (ip && ip !== '127.0.0.1') {
                queryField = 'last_ip';
                queryValue = ip;
                matchType = 'IP address';
            } else {
                return interaction.editReply({ content: `ℹ️ User **${targetRecord.username}** has no logged device ID or IP address (or is 127.0.0.1). Cannot check alts.` });
            }
            
            const { data: alts, error: altsErr } = await supabase
                .from('users')
                .select('username, is_banned, role, join_date')
                .eq(queryField, queryValue);
                
            if (altsErr || !alts) {
                return interaction.editReply({ content: '⚠️ Error querying for alt accounts.' });
            }
            
            const otherAlts = alts.filter(a => a.username.toLowerCase() !== targetRecord.username.toLowerCase());
            
            if (otherAlts.length === 0) {
                const redactedVal = queryField === 'last_ip' ? 'Redacted' : queryValue;
                return interaction.editReply({ content: `✅ **No alts found** for **${targetRecord.username}** (${matchType}: \`${redactedVal}\`).` });
            }
            
            const redactedVal = queryField === 'last_ip' ? 'Redacted' : queryValue;
            let altsListText = `Other accounts registered/logged under the same ${matchType} (\`${redactedVal}\`):\n\n`;
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

    // --- AUTH COMMAND ---
    if (commandName === 'auth') {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'update') {
            const targetUsername = interaction.options.getString('username').trim();
            
            const isOwner = interaction.guild?.ownerId === interaction.member.id;
            const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin && !isOwner) {
                return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
            }
            
            // Create and show password reset modal
            const modal = new ModalBuilder()
                .setCustomId(`auth_update_modal:${targetUsername}`)
                .setTitle(`Reset Password for ${targetUsername}`);

            const passwordInput = new TextInputBuilder()
                .setCustomId('new_password')
                .setLabel('New Password')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter the new secure password')
                .setMinLength(8)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(passwordInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
    }

    // --- COINFLIP COMMAND ---
    if (commandName === 'coinflip') {
        const amount = interaction.options.getInteger('amount');
        
        if (amount < 100 || amount > 10000) {
            return interaction.reply({
                content: '🛑 **Invalid Wager**: Coinflip wager must be between **100** and **10,000** tokens!',
                ephemeral: true
            });
        }
        
        const now = Date.now();
        const cooldownTime = coinflipCooldowns.get(user.id);
        if (cooldownTime && now < cooldownTime) {
            const timeLeft = Math.ceil((cooldownTime - now) / 1000 / 60);
            return interaction.reply({
                content: `⏳ **Cooldown**: You must wait **${timeLeft} minutes** before flipping again! (1-hour cooldown)`,
                ephemeral: true
            });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const boomkitUsername = await getLinkedUsername(user.id);
            if (!boomkitUsername) {
                return interaction.editReply({
                    content: '🛑 **Not Linked**: Your Discord account is not linked to any Boomkit username. Link it using `/link [username] [password]` first!'
                });
            }
            
            const { data: player, error: playerErr } = await supabase
                .from('users')
                .select('tokens, username')
                .eq('username', boomkitUsername)
                .single();
                
            if (playerErr || !player) {
                return interaction.editReply({
                    content: '🛑 **Error**: Could not retrieve your account data.'
                });
            }
            
            if (player.tokens < amount) {
                return interaction.editReply({
                    content: `🛑 **Insufficient Balance**: You only have **${player.tokens}** tokens (trying to bet **${amount}**).`
                });
            }
            
            const isWin = Math.random() < 0.5;
            const newBalance = isWin ? (player.tokens + amount) : (player.tokens - amount);
            
            const { error: updateErr } = await supabase
                .from('users')
                .update({ tokens: newBalance })
                .eq('username', player.username);
                
            if (updateErr) {
                console.error('[Coinflip DB Update] Error:', updateErr);
                return interaction.editReply({
                    content: '⚠️ Failed to record the coinflip in the database. Your balance was not changed.'
                });
            }
            
            coinflipCooldowns.set(user.id, now + 3600000); // 1 hour
            
            const resultText = isWin 
                ? `🎉 **YOU WON!** Heads! 🪙\n\n**${player.username}** successfully flipped **Heads** and won **${amount}** tokens!\n💎 **New Balance**: **${newBalance}** tokens.`
                : `💀 **YOU LOST!** Tails! 🪙\n\n**${player.username}** flipped **Tails** and lost **${amount}** tokens.\n💎 **New Balance**: **${newBalance}** tokens.`;
                
            return interaction.editReply({ content: resultText });
        } catch (err) {
            console.error('[Interaction coinflip] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred during the coinflip.' });
        }
    }

    // --- TRIVIA COMMAND ---
    if (commandName === 'trivia') {
        const now = Date.now();
        
        let userRuns = triviaHostLimits.get(user.id) || [];
        userRuns = userRuns.filter(time => now - time < 3600000);
        
        if (userRuns.length >= 5) {
            const oldestRun = userRuns[0];
            const minutesLeft = Math.ceil((3600000 - (now - oldestRun)) / 1000 / 60);
            return interaction.reply({
                content: `🛑 **Rate Limit**: You can only host 5 trivias per hour! Try again in **${minutesLeft} minutes**.`,
                ephemeral: true
            });
        }
        
        userRuns.push(now);
        triviaHostLimits.set(user.id, userRuns);
        
        const triviaObj = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
        const wrongAttempts = new Set();
        const expiresAt = Math.floor((Date.now() + 30000) / 1000);
        
        const buttons = triviaObj.options.map((option, idx) => {
            const customId = `trivia_${idx}_${now}`;
            const label = option.substring(0, 80);
            return new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(label)
                .setStyle(ButtonStyle.Secondary);
        });
        
        const row = new ActionRowBuilder().addComponents(buttons);
        
        const embed = {
            color: 0x9900ff,
            title: '🧠 Boomkit Interactive Trivia!',
            description: `**${triviaObj.question}**\n\n*Click the correct button below to win **100 tokens**!*\n\n⏰ **Time Limit**: Ends <t:${expiresAt}:R>`,
            footer: { text: `Hosted by ${user.username}` }
        };
        
        await interaction.reply({ embeds: [embed], components: [row] });
        
        const filter = () => true;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 30000
        });
        
        let answered = false;
        
        collector.on('collect', async buttonInteraction => {
            if (answered) return;
            
            const userId = buttonInteraction.user.id;
            if (wrongAttempts.has(userId)) {
                return buttonInteraction.reply({
                    content: '❌ **Incorrect!** You already answered this trivia incorrectly and cannot try again.',
                    ephemeral: true
                });
            }
            
            const selectedIdx = parseInt(buttonInteraction.customId.split('_')[1]);
            const selectedChoice = ['A', 'B', 'C', 'D'][selectedIdx];
            
            if (selectedChoice === triviaObj.correct) {
                answered = true;
                collector.stop('answered');
                
                await buttonInteraction.deferReply({ ephemeral: false });
                
                try {
                    const winnerUsername = await getLinkedUsername(buttonInteraction.user.id);
                    if (!winnerUsername) {
                        return buttonInteraction.editReply({
                            content: `🎉 **Correct!** **${buttonInteraction.user.username}** answered **${triviaObj.correctText}** first!\n\n⚠️ **Note**: Your Discord account is not linked to Boomkit. Link it using \`/link\` to claim rewards next time!`
                        });
                    }
                    
                    const { data: player, error: playerErr } = await supabase
                         .from('users')
                         .select('tokens, username')
                         .eq('username', winnerUsername)
                         .single();
                         
                    if (playerErr || !player) {
                        return buttonInteraction.editReply({
                            content: `🎉 **Correct!** **${buttonInteraction.user.username}** (Boomkit: **${winnerUsername}**) answered **${triviaObj.correctText}** first, but there was an error updating their balance.`
                        });
                    }
                    
                    const newBalance = player.tokens + 100;
                    const { error: updateErr } = await supabase
                         .from('users')
                         .update({ tokens: newBalance })
                         .eq('username', player.username);
                         
                    if (updateErr) {
                        return buttonInteraction.editReply({
                            content: `🎉 **Correct!** **${buttonInteraction.user.username}** (Boomkit: **${player.username}**) answered **${triviaObj.correctText}** first, but there was an error updating their balance.`
                        });
                    }
                    
                    return buttonInteraction.editReply({
                        content: `🎉 **Correct Answer!**\n\n**${buttonInteraction.user.username}** (Boomkit: **${player.username}**) answered **${triviaObj.correctText}** first and won **100 tokens**!\n💎 **New Balance**: **${newBalance}** tokens.`
                    });
                } catch (err) {
                    console.error('[Trivia Winner Update] Error:', err);
                    return buttonInteraction.editReply({
                        content: `🎉 **Correct!** **${buttonInteraction.user.username}** answered **${triviaObj.correctText}** first, but an error occurred.`
                    });
                }
            } else {
                wrongAttempts.add(userId);
                return buttonInteraction.reply({
                    content: '❌ **Incorrect!** That is not the right answer. Better luck next time!',
                    ephemeral: true
                });
            }
        });
        
        collector.on('end', (collected, reason) => {
            const disabledButtons = buttons.map(btn => ButtonBuilder.from(btn).setDisabled(true));
            const disabledRow = new ActionRowBuilder().addComponents(disabledButtons);
            
            if (reason === 'time') {
                const expiredEmbed = {
                    color: 0x555555,
                    title: '🧠 Boomkit Trivia - Closed',
                    description: `**${triviaObj.question}**\n\n⏰ **Time\'s Up!** No one got the correct answer in time.\n\n💡 **Correct Answer**: **${triviaObj.correctText}**`,
                    footer: { text: `Hosted by ${user.username}` }
                };
                
                interaction.editReply({ embeds: [expiredEmbed], components: [disabledRow] }).catch(console.error);
            } else {
                const endedEmbed = {
                    color: 0x555555,
                    title: '🧠 Boomkit Trivia - Answered',
                    description: `**${triviaObj.question}**\n\n💡 **Correct Answer**: **${triviaObj.correctText}**`,
                    footer: { text: `Hosted by ${user.username}` }
                };
                interaction.editReply({ embeds: [endedEmbed], components: [disabledRow] }).catch(console.error);
            }
        });
    }

    // --- CLAIM-DAILY COMMAND ---
    if (commandName === 'claim-daily') {
        await interaction.deferReply({ ephemeral: false });
        
        try {
            const boomkitUsername = await getLinkedUsername(user.id);
            if (!boomkitUsername) {
                return interaction.editReply({
                    content: '🛑 **Not Linked**: Your Discord account is not linked to any Boomkit username. Link it using `/link [username] [password]` first!'
                });
            }
            
            // Fetch player's current data
            const { data: player, error: playerErr } = await supabase
                .from('users')
                .select('tokens, last_daily_spin, username')
                .eq('username', boomkitUsername)
                .single();
                
            if (playerErr || !player) {
                return interaction.editReply({ content: '🛑 **Error**: Could not retrieve your account data.' });
            }
            
            const today = new Date().toDateString();
            if (player.last_daily_spin === today) {
                return interaction.editReply({ content: `⏳ **Already Claimed**: You have already claimed your daily reward today! Come back tomorrow.` });
            }
            
            // Update balance and daily spin date
            const dailyReward = 50; // Award 50 tokens
            const newBalance = player.tokens + dailyReward;
            
            const { error: updateErr } = await supabase
                .from('users')
                .update({
                    tokens: newBalance,
                    last_daily_spin: today
                })
                .eq('username', player.username);
                
            if (updateErr) {
                console.error('[Daily Claim DB Update] Error:', updateErr);
                return interaction.editReply({ content: '⚠️ Failed to record your claim in the database. Please try again.' });
            }
            
            return interaction.editReply({
                content: `🎁 **Daily Reward Claimed!**\n\n**${player.username}** successfully claimed their daily reward of **${dailyReward} tokens**!\n💎 **New Balance**: **${newBalance}** tokens.`
            });
        } catch (err) {
            console.error('[Interaction claim-daily] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while claiming your daily reward.' });
        }
    }

    // --- CREATE-CODE COMMAND ---
    if (commandName === 'create-code') {
        const code = interaction.options.getString('code').trim().toUpperCase();
        const reward = interaction.options.getInteger('reward');
        const maxUses = interaction.options.getInteger('max_uses');
        const durationHours = interaction.options.getInteger('duration_hours');
        
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: false });
        
        try {
            let expiresAt = null;
            if (durationHours) {
                const expDate = new Date();
                expDate.setHours(expDate.getHours() + durationHours);
                expiresAt = expDate.toISOString();
            }
            
            const { error: insertError } = await supabase
                .from('promo_codes')
                .insert({
                    code: code,
                    tokens_reward: reward,
                    max_uses: maxUses,
                    current_uses: 0,
                    expires_at: expiresAt
                });
                
            if (insertError) {
                console.error('[Create Code DB Insert] Error:', insertError);
                if (insertError.code === '23505') { // unique key violation
                    return interaction.editReply({ content: `❌ **Failed**: A promo code with the name \`${code}\` already exists.` });
                }
                return interaction.editReply({ content: '⚠️ Failed to create promo code in the database. Make sure the database schema is up-to-date.' });
            }
            
            const expiryText = durationHours ? `expires in **${durationHours} hours**` : 'does not expire';
            
            const embed = {
                color: 0x00ff00,
                title: '🎁 New Promo Code Created!',
                description: `A server promo code is now active!`,
                fields: [
                    { name: '🔑 Code', value: `\`${code}\``, inline: true },
                    { name: '💎 Reward', value: `**${reward} tokens**`, inline: true },
                    { name: '👥 Max Uses', value: `**${maxUses} times**`, inline: true },
                    { name: '⏳ Expiry', value: expiryText, inline: false }
                ],
                footer: { text: `Created by ${user.username}` },
                timestamp: new Date().toISOString()
            };
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('[Interaction create-code] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while creating the promo code.' });
        }
    }

    // --- CLAIM-CODE COMMAND ---
    if (commandName === 'claim-code') {
        const code = interaction.options.getString('code').trim().toUpperCase();
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const boomkitUsername = await getLinkedUsername(user.id);
            if (!boomkitUsername) {
                return interaction.editReply({
                    content: '🛑 **Not Linked**: Your Discord account is not linked to any Boomkit username. Link it using `/link [username] [password]` first!'
                });
            }
            
            // 1. Fetch code record
            const { data: codeRecord, error: codeErr } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', code)
                .maybeSingle();
                
            if (codeErr || !codeRecord) {
                return interaction.editReply({ content: '❌ **Invalid Code**: That promo code does not exist.' });
            }
            
            // 2. Check Expiry
            if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
                return interaction.editReply({ content: '❌ **Code Expired**: This promo code has expired!' });
            }
            
            // 3. Check Uses Limit
            if (codeRecord.current_uses >= codeRecord.max_uses) {
                return interaction.editReply({ content: '❌ **Limit Reached**: This promo code has already reached its maximum number of claims!' });
            }
            
            // 4. Check if already claimed by user
            const { data: redemptionRecord, error: redErr } = await supabase
                .from('promo_redemptions')
                .select('id')
                .eq('code', code)
                .eq('username', boomkitUsername)
                .maybeSingle();
                
            if (redemptionRecord) {
                return interaction.editReply({ content: '❌ **Already Claimed**: You have already redeemed this promo code!' });
            }
            
            // 5. Insert redemption
            const { error: redInsertErr } = await supabase
                .from('promo_redemptions')
                .insert({
                    code: code,
                    username: boomkitUsername
                });
                
            if (redInsertErr) {
                console.error('[Redemption DB Insert] Error:', redInsertErr);
                return interaction.editReply({ content: '⚠️ Failed to claim. An error occurred saving your redemption.' });
            }
            
            // 6. Update uses count on code
            await supabase
                .from('promo_codes')
                .update({ current_uses: codeRecord.current_uses + 1 })
                .eq('code', code);
                
            // 7. Update player tokens
            const { data: player, error: playerErr } = await supabase
                .from('users')
                .select('tokens')
                .eq('username', boomkitUsername)
                .single();
                
            if (playerErr || !player) {
                return interaction.editReply({ content: '🎉 **Code claimed**, but an error occurred checking your token balance.' });
            }
            
            const newBalance = player.tokens + codeRecord.tokens_reward;
            const { error: balanceErr } = await supabase
                .from('users')
                .update({ tokens: newBalance })
                .eq('username', boomkitUsername);
                
            if (balanceErr) {
                console.error('[Claim Tokens Update] Error:', balanceErr);
                return interaction.editReply({ content: '🎉 **Code claimed**, but an error occurred adding tokens to your balance.' });
            }
            
            // Post public success message in the channel so they can show off
            await interaction.channel.send({
                content: `🎉 **Promo Code Redeemed!**\n\n**${boomkitUsername}** successfully redeemed code \`${code}\` and received **${codeRecord.tokens_reward} tokens**!`
            }).catch(console.error);
            
            return interaction.editReply({ content: `🎉 **Success!** You received **${codeRecord.tokens_reward} tokens**! Your new balance is **${newBalance}**.` });
        } catch (err) {
            console.error('[Interaction claim-code] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while claiming the code.' });
        }
    }

    // --- ACTIVE-CODES COMMAND ---
    if (commandName === 'active-codes') {
        const isOwner = interaction.guild?.ownerId === interaction.member.id;
        const isAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && !isOwner) {
            return interaction.reply({ content: '🛑 **Permission Denied**: This is a staff-only command!', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const { data: codes, error } = await supabase
                .from('promo_codes')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error || !codes || codes.length === 0) {
                return interaction.editReply({ content: 'ℹ️ No promo codes exist in the database.' });
            }
            
            const now = new Date();
            let codesText = '';
            
            codes.forEach(code => {
                const isExpired = code.expires_at && new Date(code.expires_at) < now;
                const isExhausted = code.current_uses >= code.max_uses;
                
                let status = '✅ Active';
                if (isExpired) status = '❌ Expired';
                else if (isExhausted) status = '❌ Exhausted';
                
                const expDateText = code.expires_at ? new Date(code.expires_at).toLocaleString() : 'Never';
                
                codesText += `• **\`${code.code}\`** [${status}]\n`;
                codesText += `  💎 Reward: **${code.tokens_reward}** | Uses: **${code.current_uses}/${code.max_uses}**\n`;
                codesText += `  ⏳ Expiry: ${expDateText}\n\n`;
            });
            
            const embed = {
                color: 0x00ff00,
                title: '🔑 Boomkit Active Promo Codes',
                description: codesText,
                timestamp: new Date().toISOString()
            };
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('[Interaction active-codes] Error:', err);
            return interaction.editReply({ content: '⚠️ An unexpected error occurred while listing promo codes.' });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
