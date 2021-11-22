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

const isSameDate = (firstDate, secondDate) => {
  const today = new Date();
  return (
    firstDate.getDate() == secondDate.getDate() &&
    firstDate.getMonth() == secondDate.getMonth() &&
    firstDate.getFullYear() == secondDate.getFullYear()
  );
};

const isTomorrow = (someDate) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    someDate.getDate() == tomorrow.getDate() &&
    someDate.getMonth() == tomorrow.getMonth() &&
    someDate.getFullYear() == tomorrow.getFullYear()
  );
};

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Benvenuto!"));
bot.help((ctx) => ctx.reply("Send me a sticker"));

const sendOrario = (ctx, currentDate, when) => {
  if (!currentDate.lessons.length) {
    return ctx.reply("Oggi non sono previste lezioni!");
  }
  ctx
    .reply(`${when} ci sono ${currentDate.lessons.length} lezioni:`)
    .then(() => {
      currentDate.lessons.forEach((lesson) => {
        ctx.reply(
          `- Dalle ${lesson.start.string} alle ${lesson.end.string} con argomento: ${lesson.name}. La lezione sarà tenuta da ${lesson.teacherCode} e durerà ${lesson.duration}h.`
        );
      });
    });
};

bot.command("orario_oggi", (ctx) => {
  getOrarioInformatica().then((data) => {
    let currentDate = data.filter((e) =>
      isSameDate(e.date.parsed, new Date())
    )[0];
    sendOrario(ctx, currentDate, "Oggi");
  });
});

bot.command("orario_domani", (ctx) => {
  getOrarioInformatica().then((data) => {
    let currentDate = data.filter((e) =>
      isSameDate(
        e.date.parsed,
        new Date(new Date().setDate(new Date().getDate() + 1))
      )
    )[0];
    sendOrario(ctx, currentDate, "Domani");
  });
});

bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
