const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors");

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "erich.then2@gmail.com",
    pass: "ogvw hxcu tohn sgzc",
  },
});

exports.sendMail = functions.https.onRequest((req, res) => {
  cors({origin: true})(req, res, () => {
    const {email, subject, message, fileContent, fileName} = req.body;

    const mailOptions = {
      from: "erich.then2@gmail.com",
      to: email,
      subject,
      html: message,
      attachments: [
        {
          filename: fileName,
          content: fileContent,
          encoding: "base64",
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send(error.toString());
      }
      return res.status(200).send("Email sent successfully");
    });
  });
});

exports.sendCancellationEmails = functions.https.onRequest((req, res) => {
  cors({origin: true})(req, res, async () => {
    const {parentIds, date} = req.body;
    const db = admin.firestore();

    const mailOptions = {
      from: "erich.then2@gmail.com",
      subject: "Session Cancellation Notification",
      html: `<p>Dear Parent,</p>
             <p>Your child's session on ${date} has been canceled.</p>
             <p>We apologize for any inconvenience this may cause.</p>
             <p>Best Regards,<br>KBT Reading Support</p>`,
    };

    try {
      for (const parentId of parentIds) {
        const parentDoc = await db.collection("parents").doc(parentId).get();
        if (parentDoc.exists) {
          const parentEmail = parentDoc.data().email;
          await transporter.sendMail({...mailOptions, to: parentEmail});
        }
      }
      res.status(200).send({success: true});
    } catch (error) {
      console.error("Error sending cancellation emails: ", error);
      res.status(500).send({success: false, error: error.toString()});
    }
  });
});

