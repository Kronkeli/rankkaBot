const { Telegraf } = require('telegraf')
const express = require('express')
const { Client } = require('pg')

const expressApp = express()


const PORT = process.env.PORT || 3000
const URL = process.env.URL || 'https://rankkabot.herokuapp.com/'
const BOT_TOKEN = process.env.BOT_TOKEN
const DATABASE_URL = process.env.DATABASE_URL

const admins = ['Kronkeli', 'sallapartanen']

const bot = new Telegraf(BOT_TOKEN)

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
})

// Tehtavat luokitellaan seuraavasti
// 1. Osallistu Murata-visaan bussissa
// 2. Kerro bussissa vitsi                                      (ADMIN)
// 3. Lähetä kuva itsestäsi/porukasta tg-ryhmään
// 4. Kirjoita python-komento, jolla tulostetaan "Hello world!" 
// 5. Ota kuva rubikin kuutiosta
// 6. Kellota kalja tai hiilihapollinen juoma
// 7. Arvo itsellesi random drinkki komennolla /random_drink tai /random_drink_holiton                                            (ADMIN)
// 8. Ota kuva toisen Resonanssin opiskelijan kanssa ja postaa ryhmään (ADMIN)
// 10. Selviä majoitukseen Helsingissä
// 11. Herää ennen klo 8:15, ja laita viesti "Huomenta kaikki!" ryhmään  (ADMIN)
// 12. Kirjoita anagrammi sanasta tanopuli botille privassa
// 13. Osallistu Vaisala-visaan
// 14. Osallistu Okmetic-visaan
// 15. Osallistu Smartbi-visaan
// 16. Ota kuva Hiukkasen värisestä esineestä (ei bussissa)
// 17. Ota kuva Prosessikillan opiskelijan kanssa
// 18. Ota kuva Ketekin opiskelijan kanssa
// 19. Tanssi 'hiukkastanssia' baarissa
// 20. Selviä majoitukseen Lappeenrannassa
// 21. 

const tehtava_kuvaukset = [
    "Osallistu Murata-visaan bussissa",
    "Kerro bussissa vitsi",                        
    "Lähetä kuva itsestäsi/porukasta tg-ryhmään",
    "Kirjoita python-komento, jolla tulostetaan 'Hello world!'", 
    "Ota kuva rubikin kuutiosta",
    "Kellota kalja tai hiilihapollinen juoma",
    "Arvo itsellesi random drinkki komennolla /random_drink tai /random_drink_holiton",
    "Ota kuva toisen Resonanssin opiskelijan kanssa ja postaa ryhmään",
    "Selviä majoitukseen Helsingissä",
    "Herää ennen klo 8:15, ja laita viesti 'Huomenta kaikki!'",
    "Osallistu Vaisala-visaan",
    "Osallistu Okmetic-visaan",
    "Osallistu Smartbi-visaan",
    "Ota kuva Hiukkasen värisestä esineestä (ei bussissa)",
    "Ota kuva Prosessikillan opiskelijan kanssa",
    "Ota kuva Ketekin opiskelijan kanssa",
    "Tanssi 'hiukkastanssia' baarissa",
    "Selviä majoitukseen Lappeenrannassa"
]


client.connect()

function isAdmin(username) {
    return admins.includes(username)
}

// Lisää pisteen pelaajalle 
function lisaa_piste(username, tehtava_id) {
    // TODO: Lisää pisteet-tauluun osallistujalle name 1 piste
    client
        .query('UPDATE pistetaulukko SET piste = 1 WHERE username = $1 AND tehtava_id = $2;', [username, tehtava_id])
        .then(console.log(`Succesfully added ${username}s point`))
        .catch(e => console.log(e.stack))
}

function laheta_tehtavat(tehtavalista, ctx) {
    var message = "EXCUPASSI v2021 \n\n";
    tehtavalista.rows.forEach( function (item) {
        message = message +  item.id + ": " + item.kuvaus + "\n"
    })
    ctx.telegram.sendMessage(ctx.message.chat.id, message)
}

bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`)
expressApp.use(bot.webhookCallback(`/bot${BOT_TOKEN}`))

function lisaa_pelaaja(username) {
    client
        .query(`INSERT INTO osallistujat VALUES ($1);`, [username])
        .then( console.log(`Succesfully added ${username}`))
        .catch(e => console.log(e.stack))    
    
    // Lisätään pelaaja pistetaulukkoon
    tehtava_kuvaukset.forEach( function (item, index) {
        client
            .query('INSERT INTO pistetaulukko (username, tehtava_id) VALUES ($1, $2)', [username, index])
            .catch(e => console.log(e.stack))
    })
}

function lisaa_tehtava(kuvausteksti, ctx) {
    client
        .query('INSERT INTO tehtavakuvaukset (kuvaus) VALUES ($1)', [kuvausteksti])
        .then(ctx.telegram.sendMessage(ctx.message.chat.id, "Kuin väärä rahe"))
        .catch(e => console.log(e.stack))
}

function laheta_tulokset_kaikki(tulostaulukko, ctx) {
    var message = "Pistetilanne tällä hetkellä: \n";
    tulostaulukko.rows.forEach( function (item) {
        message = message +  item.username + ": " + item.pisteet + "\n"
    })
    ctx.telegram.sendMessage(ctx.message.chat.id, message)
}

bot.command('alusta_tietokanta', (ctx) => {
    if (!isAdmin(ctx.message.from.username)) {
        ctx.telegram.sendMessage(ctx.message.chat.id, "Tämä vaati jumaloikeudet!")
    }
    else {

        // CREATE TABLES
        client
            .query(`CREATE TABLE IF NOT EXISTS osallistujat (username VARCHAR(40) PRIMARY KEY);`)
            .then(res => console.log(res.rows))
            .catch(e => console.log(e.stack))
        
        client
            .query('CREATE TABLE IF NOT EXISTS tehtavakuvaukset (id SERIAL, kuvaus VARCHAR(200), PRIMARY KEY (id))')
            .then(res => console.log(res.rows[0]))
            .catch(e => console.log(e.stack))

        client
            .query('CREATE TABLE IF NOT EXISTS pistetaulukko (username VARCHAR(40), tehtava_id INT, piste INT DEFAULT 0, FOREIGN KEY (username) REFERENCES osallistujat(username));')
            .then(res => console.log(res.rows[0]))
            .catch(e => console.log(e.stack))

        // POPULATE TABLES
        client
            .query('TRUNCATE TABLE tehtavakuvaukset;')
            .catch(e => console.log(e.stack))
        tehtava_kuvaukset.forEach( function (item) {
            client
                client.query('INSERT INTO tehtavakuvaukset (kuvaus) VALUES($1);', [item])
                .catch(e => console.log(e.stack))
        })
    }
})

// Tyhjennä tietokanta
bot.command('reset', (ctx) => {
    if (!isAdmin(ctx.message.from.username)) {
        ctx.telegram.sendMessage(ctx.message.chat.id, "Tämä vaati jumaloikeudet!")
    }
    else {
        client
            .query('DROP TABLE pistetaulukko;')
            .catch(e => console.log(e.stack))
        client
            .query('DROP TABLE tehtavakuvaukset;')
            .catch(e => console.log(e.stack))
        client
            .query('DROP TABLE osallistujat;')
            .catch(e => console.log(e.stack))
    }
})


// Lisää pelaajan tietokantaan    
bot.command('rankalle', (ctx) => {
    const username = ctx.message.from.username;

    // Tutkitaan ensin, onko pelaaja jo tietokannassa
    client
        .query('SELECT * FROM osallistujat WHERE username = $1', [username])
        .then(res => {
            console.log( JSON.stringify(res.rows))
            if (res.rowCount == 0) {
                lisaa_pelaaja(username)
                ctx.telegram.sendMessage(ctx.message.chat.id, `Tervetuloa Rankalle ${username}`)
            }
            else {
                bot.telegram.sendMessage(ctx.message.chat.id, "Sinä olet jo täällä. NANI?")
            }
        })
        .catch(e => console.log(e))
})

// Lähettää chattiin tämänhetkisen tilanteen
bot.command("tulokset_kaikki", (ctx) => {
    client
        .query('SELECT username, SUM(piste) pisteet FROM pistetaulukko GROUP BY username')
        .then(res => laheta_tulokset_kaikki(res, ctx))
})

// Listaa tehtävät (toimii vain ADMIN tai privassa)
bot.command("listaa_tehtavat", (ctx) => {
    if (!isAdmin(ctx.message.from.username)) {
        ctx.telegram.sendMessage(ctx.message.chat.id, "Tämä vaati jumaloikeudet, mutta käy kysymässä botilta privatessa ;)")
    }
    else {
    client
        .query('SELECT * FROM tehtavakuvaukset ORDER BY id;')
        .then( res => laheta_tehtavat(res, ctx) )
        .catch(e => console.log(e.stack))
    }
})

bot.on('text', (ctx) => {
    var message = ctx.message.text;
    const username = ctx.message.from.username;

    // Private chat stuff
    if ( ctx.chat.type == "private") {

        // Merkitse tehtavapiste
        if (message.includes('/tehtava_tehty')) {
            var msg_parsed = message.split(" ")
            if (msg_parsed.length > 1) {
                if (!isNaN(msg_parsed[1])) {
                    lisaa_piste(username, msg_parsed[1])
                }
            }
        }

        // Lisää uusi tehtävä tehtävälistalle (ADMIN)
        if (message.includes('/uusi_tehtava')) {
            if (!isAdmin(ctx.message.from.username)) {
                ctx.telegram.sendMessage(ctx.message.chat.id, "Tämä vaati jumaloikeudet!")
            }
            else {
                var msg_parsed = message.split(" ")
                var msg_kuvaus = message.replace('/uusi_tehtava', '')
                if (msg_parsed.length > 1) {
                    lisaa_tehtava(msg_kuvaus, ctx)
                }
            }
        }
        
    }
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// bot.launch()

// Start the server on PORT
expressApp.get('/', (req, res) => {
    res.send('Hello from rankkabot');
});

expressApp.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});