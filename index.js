const Discord = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
const { prefix } =  require('./config.json');
dotenv.config();

const commandFiles = fs.readdirSync('./commands/').filter(file=>file.endsWith('.js'));
// register all of the commands
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
client.on('message', (message)=>{
    if(!message.content.startsWith(`${prefix}`) || message.author.bot) return;
    
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName) ||
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if(!command) return;
    
    if(command.args && !args.length){
        let reply = `You didn't provide any arguments, ${message.author}`;
        if(command.usage){
            reply += `\n The proper usage would be: \` ${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }

    if(command.guildOnly && message.channel.type !== 'text'){
        return message.reply('I can\'t execute that command inside DMs');
    }

    if(!cooldowns.has(command.name)){
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    console.log(args);
    try{
        command.execute(message, args);
    }
    catch(error){
        console.error(error);
        message.reply('there was an error trying to execute that command')
    }
});

client.login(process.env.AUTH_TOKEN);