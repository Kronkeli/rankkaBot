import { Telegraf } from 'telegraf'
import express from 'express'

const expressApp = express()


const PORT = process.env.PORT || 3000
const URL = process.env.URL || 'https://rankkabot.herokuapp.com'
const BOT_TOKEN = process.env.BOT_TOKEN

admin = 'kronkeli'

const bot = new Telegraf(BOT_TOKEN)

bot.command('alusta_tietokanta', (ctx) => {
    if (ctx.message.from.username != 'kronkeli') {
        console.log("invalid access to admin command")
    }
    else {

        // Yhdistä db ja tee taulu pisteistä
        // SQL: 
        var alusta_pistetaulu = 'CREATE TABLE IF NOT EXISTS pisteet (VARCHAR(30) username PRIMARY KEY, int pisteet)'
    }
})

function lisaa_piste(name) {
    // TODO: Lisää pisteet-tauluun osallistujalle name 1 piste
}

bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`)
expressApp.use(bot.webhookCallback(`/bot${BOT_TOKEN}`))

bot.command('gg', (ctx) => {
  // Explicit usage
//   ctx.telegram.leaveChat(ctx.message.chat.id)

  // Using context shortcut
  ctx.leaveChat()
})


bot.command('morota', (ctx) => {
    // Tallennetaan pelaajan nimi tietokantaan
    // TODO: Tallena pelaajan nimi tietokantaan
    ctx.telegram.sendMessage( ctx.message.chat.id,`Tervetuloa Rankalle ${ctx.message.from.username}!`),
    (error) => console.log(error)
})



bot.command("start", (msg) => {
    msg.reply(`Hello ${msg.from.username}!`)
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Start the server on PORT
expressApp.get('/', (req, res) => {
    res.send('Hello from rankkabot');
});

expressApp.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});