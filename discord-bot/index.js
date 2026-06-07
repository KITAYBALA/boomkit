/**
 * Boomkit Discord Access Key Registry Bot
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

// Define Slash Command
const commands = [
    new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Generate a single-use access key for Boomkit registration (Requires Verification)'),
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

// Initialize Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
    console.log(`Verified Role ID set to: ${process.env.VERIFIED_ROLE_ID}`);
});

// Handle Interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, member, user } = interaction;

    if (commandName === 'getkey') {
        try {
            // 1. Check if user is verified, admin, or owner
            const isOwner = interaction.guild?.ownerId === member.id;
            const isAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);
            const isVerified = member.roles.cache.has(process.env.VERIFIED_ROLE_ID);

            if (!isVerified && !isAdmin && !isOwner) {
                return interaction.reply({
                    content: '🛑 **Access Denied**: You must pass server verification first to generate an access key!',
                    ephemeral: true
                });
            }

            // 2. Check if user already has an unused key in the database to prevent spam
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

            // 3. Generate a new unique key (BK-KEY-XXXX-XXXX)
            const randomHex1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const randomHex2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const newKey = `BK-KEY-${randomHex1}-${randomHex2}`;

            // 4. Save key in the database
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

            // 5. Send key privately to user
            return interaction.reply({
                content: `🎉 **Verification Access Key Generated!**\n\nHere is your unique, single-use key to sign up for Boomkit. Do not share this key with anyone else:\n\`\`\`\n${newKey}\n\`\`\`\nPaste this in the **Discord Access Key** field on the signup page.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('[Bot Interaction] Error:', error);
            return interaction.reply({
                content: '⚠️ An unexpected error occurred. Please contact a moderator.',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
