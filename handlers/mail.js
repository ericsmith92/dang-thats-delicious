const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

//use our SMTP credentials to setup and transport
const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    //inline our css with juice pkg so html email works in all email clients
    const inlined = juice(html);
    return inlined;
}

exports.send = async (options) => {
    //options object was passed to send() parent function in authController
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);

    const mailOptions = {
        from: `Bum Swizz <noreply@bumswizz.com`,
        to: options.user.email,
        subject: options.subject,
        html,
        text
    };

    //make transport sendMail method promise based and bind to transport object
    const sendMailPromisify = promisify(transport.sendMail, transport);
    return sendMailPromisify(mailOptions);
}

