require("dotenv").config();
const { getOrarioInformatica } = require("./parser");

const { Telegraf } = require("telegraf");

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply("Benvenuto!"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.hears("orario", (ctx) => {
  console.log("ok");
  getOrarioInformatica().then((data) => {
    let currentDate = data.filter((e) => isToday(e.date.parsed))[0];
    if (!currentDate.lessons.length) {
      return ctx.reply("Oggi non sono previste lezioni!");
    }
    ctx
      .reply(`Oggi ci sono ${currentDate.lessons.length} lezioni:`)
      .then(() => {
        currentDate.lessons.forEach((lesson) => {
          ctx.reply(
            `- Dalle ${lesson.start.string} alle ${lesson.end.string} con argomento: ${lesson.name}. La lezione sarà tenuta da ${lesson.teacherCode} e durerà ${lesson.duration}h.`
          );
        });
      });
  });
});
bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
