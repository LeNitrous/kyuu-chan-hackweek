exports.run = (client, message, args) => {
    if (!args || args.length > 1)
        return;

    if (!client.modules.has(args[0]))
        return;

    delete require.cache[require.resolve(`./${args[0]}.js`)];
    client.modules.delete(args[0]);

    const mod = require(`./${args[0]}.js`);
    client.modules.set(args[0], mod);

    message.reply(`Reloaded module \`${args[0]}\`.`);
}