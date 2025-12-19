const {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  Events,
  Collection,
} = require("discord.js");
require("dotenv").config();

const { verifyUser, verifyUserData } = require("./verifyUser");

const commands = [
    verifyUserData.toJSON(),
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});


client.commands = new Collection();
client.commands.set("verifyuser", { execute: verifyUser });

client.on(Events.InteractionCreate, async (interaction) => {
  console.log("Interaction created");
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ Error executing command", ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);