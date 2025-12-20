const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
require("dotenv").config();


const roles = {
    male: {
        verifier: "1451328987337855069",
        addRoles: [
            "1447620285997125722", // verified
            "1447668061569024050"], // male
        removeRoles: ["1447683142306496634"], //unverified
        welcomeChannelID: "1422705265215803472"
    },
    female: {
        verifier: "1451329048117641257",
        addRoles: [
            "1447620285997125722", // verified
            "1447668127495356526"], // female
        removeRoles: ["1447683142306496634"], //unverified
        welcomeChannelID: "1441982531195895859"
    }
}

const verifyUserData = new SlashCommandBuilder()
    .setName("verifyuser")
    .setDescription("Verify a user")
    // .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // i need to look into this later
    .addUserOption((option) =>
        option
            .setName("userid")
            .setDescription("The id/tag of the user to verify")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("gender")
            .setDescription("The gender of the user")
            .setRequired(false) // i can recognize it by the role 
            .addChoices(
                { name: "Male", value: "male" },
                { name: "Female", value: "female" }
            )
    );

const verifyUser = async (interaction) => {
    const targetUser = interaction.options.getUser("userid");
    let gender = interaction.options.getString("gender");

    console.log(
        `VerifyUser: processing ${gender} verification by ${interaction.user.tag} (${interaction.user.id}) to ${targetUser.tag} (${targetUser.id})`
    );

    const staffer = interaction.member;
    const isAdmin = staffer.permissions.has(PermissionFlagsBits.Administrator) || staffer.id === interaction.guild.ownerId;
    // maybe add fetch for safety purposes
    const maleVerifier = staffer.roles.cache.has(roles.male.verifier);
    const femaleVerifier = staffer.roles.cache.has(roles.female.verifier);

    if (!isAdmin && !maleVerifier && !femaleVerifier) {
        return interaction.reply({ content: "❌ You do not have permission to use this command.", flags: MessageFlags.Ephemeral });
    }

    if (!gender)
        gender = maleVerifier && !femaleVerifier 
            ? "male"
            : femaleVerifier
                ? "female"
                : null; // has both roles

    if(!gender) { // has both roles or is just an Admin/Owner
        return interaction.reply({ content: "❌ Please specify a gender.", flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({content: "Processing verification...", flags: MessageFlags.Ephemeral});

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
        return interaction.editReply({ content: "❌ User not found in this guild.", flags: MessageFlags.Ephemeral });
    }
    const specificRules = roles[gender];

    // Assign roles
    await targetMember.roles.add(specificRules.addRoles);
    await targetMember.roles.remove(specificRules.removeRoles);
    
    // Send welcome message
    const welcomeChannel = interaction.guild.channels.cache.get(specificRules.welcomeChannelID);
    if (welcomeChannel) {
        try {
            await welcomeChannel.send(`Assalamu alaikum wa rahmatullahi wa barakatuh <@${targetMember.id}>!`);
            interaction.editReply({ content: `✅ Successfully verified <@${targetMember.id}>`, flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.warn("Failed to send welcome message:", err);
            interaction.editReply({ content: "❌ Failed to send welcome message.", flags: MessageFlags.Ephemeral });
        }
    } else {
        console.warn(`Welcome channel with ID ${specificRules.welcomeChannelID} not found.`);
        interaction.editReply({ content: "❌ Welcome channel not found.", flags: MessageFlags.Ephemeral });
    }
}

module.exports = { verifyUser, verifyUserData };