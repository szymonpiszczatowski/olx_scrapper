const notifier = require("node-notifier");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const opn = require("opn");
const argv = require("yargs").argv;
var nodemailer = require('nodemailer');

const defaultMaxPrice = 1800;
const interval = 5000;
const roomsEnum = ["", "one", "two", "three", "four"];
const previousIds = new Set();
const districtId = 37;

const user_name = '';
const refresh_token = '';
const access_token = '';
const client_id = '';
const client_secret = '';

const email_to = '';

let smtpTransport = nodemailer
    .createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            clientId: client_id,
            clientSecret: client_secret,
            refreshToken: refresh_token,
            accessToken: access_token
        }
    });
    smtpTransport.on('token', token => {
        console.log('A new access token was generated');
        console.log('User: %s', token.user);
        console.log('Access Token: %s', token.accessToken);
        console.log('Expires: %s', new Date(token.expires));
    });
    // setup e-mail data with unicode symbols
    
async function readPage(olxUrl) {
  const response = await fetch(olxUrl);
  const text = await response.text();

  const $ = cheerio.load(text);

  let firstOffer;
  try {
    firstOffer = readOfferData($, 1);

    if (!firstOffer.id) {
      throw Error(`Id is null ${JSON.stringify(firstOffer)}`);
    }
  } catch (e) {
    console.error("Parsing template failed!", e);
    return;
  }

  /* Program just started */
  if (previousIds.length === 0) {
    console.log(`${getTime()} Program Start!`);
    previousIds.add(firstOffer.id);
    return;
  }

  /* No new offer */
  if (previousIds.has(firstOffer.id)) {
    console.log(
      `${getTime()} [${firstOffer.name}#${firstOffer.id}] No new offer...`
    );
    return;
  }

  console.log(`${getTime()} New Offer!!! `, firstOffer);
  sendNotification(
    `${firstOffer.name} ${firstOffer.price}`,
    firstOffer.location,
    firstOffer.url
  );

  let mailOptions = {
    from    : user_name, // sender address
    to      : email_to, // list of receivers
    subject: 'Nowa oferta mieszkaniowa!',
    text: `${firstOffer.name} ${firstOffer.price}`,
    html: `${firstOffer.name} ${firstOffer.price}, ${firstOffer.location}, ${firstOffer.url}`,

    auth : {
        user         : user_name,
        refreshToken : refresh_token,
        accessToken  : access_token,
        expires      : 1494388182480
    }};

	  smtpTransport.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
		console.log('Message sent: ' + info.response);

});
  previousIds.add(firstOffer.id);
}

function readOfferData($, offerIndex) {
  const index = offerIndex + 2;
  return {
    name: $(
      `#offers_table > tbody > tr:nth-child(${index}) .space.rel > h3`
    ).text(),
    price: $(
      `#offers_table > tbody > tr:nth-child(${index}) .td-price .price`
    ).text(),
    location: $(`#offers_table > tbody > tr:nth-child(${index}) .space.rel > p`)
      .text()
      .trim(),
    url: $(
      `#offers_table > tbody > tr:nth-child(${index}) .space.rel > h3 a`
    ).attr("href"),
    id: $(
      `#offers_table > tbody > tr:nth-child(${index}) > td > div > table`
    ).attr("data-id")
  };
}

function sendNotification(title, message, url) {
  console.log(
    `Sending a notification: {title: '${title}', message: '${message}}'`
  );
  const options = {
    title,
    message,
    sound: true,
    wait: true,
    type: "info"
  };

  notifier.notify(options);

  notifier.on("click", function (notifierObject, options) {
    opn(url);
  });
}

function getTime() {
  return new Date(Date.now()).toLocaleString().split(" ")[1];
}

function startRead() {
  function generateRoomQuery(roomsNumber) {
    return Array(roomsNumber + 1)
      .fill()
      .map((_, i) => `&search[filter_enum_rooms][0]=${roomsEnum[i + 1]}`);
  }

  const roomsQueryUrl = `${
    argv.rooms && argv.rooms < 5
      ? generateRoomQuery(argv.rooms)
      : "`&search[filter_enum_rooms][0]=one"
    }"`;
  //const buildUrl = `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/bialystok/?search[filter_float_price:to]=${
    //argv.maxPrice ? argv.maxPrice : defaultMaxPrice
  //}${roomsQueryUrl},&search[district_id]=${districtId}`;
  const buildUrl = `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/bialystok/?search%5Bfilter_float_price%3Ato%5D=1800%2C&search%5Bfilter_enum_rooms%5D%5B0%5D=three&search%5Bdistrict_id%5D=37`;
  console.log(buildUrl);
  setTimeout(async () => {
    await readPage(buildUrl);
  });

  setInterval(async () => {
    await readPage(buildUrl);
  }, interval);
}

startRead();
