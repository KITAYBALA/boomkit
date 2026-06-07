require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function checkGuild() {
    try {
        console.log('Fetching bot user info via REST...');
        const user = await rest.get(Routes.user('@me'));
        console.log(`Bot user: ${user.username}#${user.discriminator} (ID: ${user.id})`);

        console.log(`Fetching guild ${process.env.GUILD_ID} via REST...`);
        const guild = await rest.get(Routes.guild(process.env.GUILD_ID));
        console.log(`Successfully fetched guild: "${guild.name}" (ID: ${guild.id})`);
    } catch (error) {
        console.error('Error fetching guild:', error);
    }
}

checkGuild();
