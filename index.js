require("dotenv").config();
const discord = require("discord.js");
const everest = require("./queries");
const database = require("./db");

const bot_token = process.env.BOT_TOKEN;
const client = new discord.Client();

const checkProjects = async () => {
  await database.isLoaded();

  let challenges;

  try {
    challenges = await everest.getChallenges().then((data) =>
      data.challenges.map((x) => {
        return { ...x.project };
      })
    );
  } catch (e) {
    if (!e.message.includes("ETIMEDOUT")) console.error(e);
    return setTimeout(() => checkProjects(), 10000);
  }

  if (database.getProjects().length === 0) {
    for (project of challenges) {
      await database.addProject(project).catch((e) => {
        if (!e.message.includes("Duplicate key")) throw e;
      });
    }
  } else {
    let expired = database.getProjects().filter((x) => {
      let exists = challenges.find((p) => p.project === x.project);
      if (exists) {
        return false;
      } else {
        client.guilds.cache.forEach((server) => {
          server.channels.cache
            .find((channel) => channel.name.includes("bot"))
            .send(`The challenge against ${x.name} has resolved!`);
        });
        return true;
      }
    });

    for (project of expired) {
      await database.removeProject(project);
    }

    for (c of challenges) {
      if (!database.getProjects().find((p) => p.project === c.project)) {
        client.guilds.cache.forEach((server) => {
          let channel = server.channels.cache.find((channel) =>
            channel.name.includes("bot")
          );
          broadcastChallenge(channel, c.project);
        });

        await database.addProject(c).catch((e) => {
          if (!e.message.includes("Duplicate key")) throw e;
        });
      }
    }
  }

  database.persist((e) => {
    if (e) console.error(e);
  });
  return setTimeout(() => checkProjects(), 1800000);
};

const broadcastChallenge = async (channel, projectID) => {
  try {
    let data = await everest.getProject(projectID);
    channel.send(`A new challenge has been posted!`);
    channel.send(richProject(data.project));
  } catch (e) {
    if (e.message.includes("ETIMEDOUT"))
      return setTimeout(() => broadcastChallenge(channel, projectID), 3000);
  }
};

const richProject = ({
  id,
  name,
  description,
  avatar,
  website,
  twitter,
  github,
  isOwner,
}) =>
  new discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(name)
    .setURL("https://everest.link/project/" + id)
    //.setAuthor("Some name")
    .setDescription(description)
    .setThumbnail("https://ipfs.io/ipfs/" + avatar)
    .addFields(
      { name: "Twitter", value: "@" + twitter, inline: true },
      { name: "Github", value: github ? github : "n/a", inline: true },
      { name: "Website", value: website ? website : "n/a", inline: true }
    )
    .setFooter(
      isOwner
        ? "This project belongs to its owner"
        : "This project is still unclaimed",
      "https://ipfs.io/ipfs/QmZZf61rjJ7pDXRKh3R9ekXEj2DnfC9yA43eDB21M8ggay"
    );

client.once("ready", () => {
  checkProjects();
  console.log("Ready!");
});

client.on("message", async (msg) => {
  if (msg.content.startsWith("!")) {
    let input = msg.content.split(" ");
    let command = input[0].substring(1);
    switch (command) {
      case "find":
        try {
          let data = await everest.findProject(input[1]);
          let result = data.projectSearch.filter((row) =>
            row.name.toLowerCase().includes(input[1])
          )[0];
          if (result) return msg.channel.send(richProject(result));
          msg.channel.send("Yeaahhh.. no that doesn't exist.");
        } catch (e) {
          msg.channel.send("Oops.. try again in a few seconds.");
        }
        break;
    }
  }
});

client.login(bot_token);
