const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');
require("dotenv").config();


const roles = {
    male: {
        verifier: "",
        addRoles: [
            "1447620285997125722", // verified
            "1447668061569024050"], // male
        removeRoles: ["1447683142306496634"], //unverified
        welcomeChannelID: "1422705265215803472"
    },
    female: {
        verifier: "",
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

const verifyUser = async (client, interaction) => {
    const targetUser = interaction.options.getUser("userid");
    let gender = interaction.options.getString("gender");

    const staffer = interaction.member;
    const isAdmin = staffer.permissions.has(PermissionFlagsBits.Administrator) || staffer.id === interaction.guild.ownerId;
    // maybe add fetch for safety purposes
    const maleVerifier = staffer.roles.cache.has(roles.male.verifier);
    const femaleVerifier = staffer.roles.cache.has(roles.female.verifier);

    if (!isAdmin && !maleVerifier && !femaleVerifier) {
        return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    if (!gender)
        gender = maleVerifier && !femaleVerifier 
            ? "male"
            : femaleVerifier
                ? "female"
                : null; // has both roles

    if(!gender) { // has both roles or is just an Admin/Owner
        return interaction.reply({ content: "❌ Please specify a gender.", ephemeral: true });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
        return interaction.reply({ content: "❌ User not found in this guild.", ephemeral: true });
    }
    const specificRules = roles[gender];

    // Assign roles
    await targetMember.roles.add(specificRules.addRoles);
    await targetMember.roles.remove(specificRules.removeRoles);

    // Send welcome message
    const welcomeChannel = interaction.guild.channels.cache.get(specificRules.welcomeChannelID);
    if (welcomeChannel) {
        try {
            await welcomeChannel.send(`Welcome <@${targetMember.id}> to the server! 🎉`);
        } catch (err) {
            console.warn("Failed to send welcome message:", err);
            interaction.reply({ content: "❌ Failed to send welcome message.", ephemeral: true });
        }
    } else {
        console.warn(`Welcome channel with ID ${specificRules.welcomeChannelID} not found.`);
        interaction.reply({ content: "❌ Welcome channel not found.", ephemeral: true });
    }
    return interaction.reply({ content: `✅ Successfully verified <@${targetMember.id}>`, ephemeral: true });
}

module.exports = { verifyUser, verifyUserData };