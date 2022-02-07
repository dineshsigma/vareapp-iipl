const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var emailModule = require('./modules/email');
var cors = require('cors')


app.post('/contact-us', contactUs);

async function contactUs(req , res) {
    var form = req.body;
    var mailBody = '';
  
    mailBody += "\n\n========================================================\n"
  
    mailBody += `Name : ${form.strName}\n`;
    mailBody += `Email : ${form.strEmail}\n`;
    mailBody += `Phone Number : ${form.strPhoneNo}\n`;
    mailBody += `message : ${form.strMessage}\n`;
  
    mailBody += "========================================================\n"
  
  
    console.log(mailBody);
  
    var email = {
      to: ["nikitha@iipl.work", "rishab@iipl.work"],
      subject: `Get In Touch by : ${form.strName}`,
      body: mailBody,
      attachments: []
    };
  
    emailModule.send_mail(email.to, email.subject, email.body, email.attachments, function (err, result1) {
      console.log("Email Res", err, result1);
      if (err) {
        res.json({
          status: false,
          message: "Mail Sent Failed."
        });
        return;
      } else {
        res.json({
          status: true,
          message: "Mail Sent Successfully."
        });
  
      }
  
    });
  
  
  }


  module.exports.handler = serverless(app);