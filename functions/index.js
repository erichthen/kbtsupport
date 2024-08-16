const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true});

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "erich.then2@gmail.com",
    pass: "ogvw hxcu tohn sgzc",
  },
});

exports.sendMail = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const {email, subject, message, fileContent, fileName} = req.body;

    const mailOptions = {
      from: "erich.then2@gmail.com",
      to: email,
      subject: subject,
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
        console.error("Error sending email:", error);
        return res.status(500).send(error.toString());
      }
      return res.status(200).send("Email sent successfully");
    });
  });
});

exports.sendCancellationEmails = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    console.log("CORS middleware passed.");

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
    } else {
      const {email, subject, message} = req.body;

      const mailOptions = {
        from: "erich.then2@gmail.com",
        to: email,
        subject: subject,
        html: message,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.status(500).json({error: error.toString()});
        }
        return res.status(200).json({data: {message: "Email sent!"}});
      });
    }
  });
});

exports.sendReminderEmails = functions.pubsub
    .schedule("every hour")
    .onRun(async (context) => {
      const db = admin.firestore();
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const startTime = new Date(reminderTime);
      startTime.setMinutes(0, 0, 0); // Set time to the start of the hour
      const endTime = new Date(reminderTime);
      endTime.setMinutes(59, 59, 999); // Set time to the end of the hour

      console.log("Checking for sessions between:", startTime, "and", endTime);

      const sessionsQuerySnapshot = await db.collection("sessions")
          .where("session_time", ">=", startTime.toISOString())
          .where("session_time", "<=", endTime.toISOString())
          .get();

      const sessions = sessionsQuerySnapshot.docs.map((doc) => doc.data());

      console.log("Found sessions:", sessions);

      for (const session of sessions) {
        const parentId = session.parent_id;
        const sessionTime = new Date(session.session_time).toLocaleString();

        const parentDoc = await db.collection("parents").doc(parentId).get();
        if (!parentDoc.exists) {
          console.error(`Parent with ID ${parentId} not found.`);
          continue;
        }

        const parentEmail = parentDoc.data().email;

        const message = `
          Dear Parent,<br>
          This is a reminder for your child"s session on ${sessionTime}.<br>
          Please join the session using the following Zoom link: <a href="https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09">Join Zoom</a><br>
          Best Regards,<br>
          KBT Reading Support
      `;

        const mailOptions = {
          from: "erich.then2@gmail.com", // Use the appropriate email
          to: parentEmail,
          subject: "Session Reminder",
          html: message,
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`Sent to ${parentEmail} for session on ${sessionTime}`);
        } catch (error) {
          console.error("Error sending reminder email:", error);
        }
      }
      return null;
    });

exports.sendCancelEmail = functions.https.onCall(async (data, context) => {
  const {parentName, sessionDate, note} = data;

  const mailOptions = {
    from: "erich.then2@gmail.com",
    to: "erich.then2@gmail.com",
    subject: "Client Canceled Appointment",
    html: `
      <p><strong>${parentName}</strong> has canceled their appointment.</p>
      <p><strong>Date:</strong> ${sessionDate}</p>
      <p><strong>Note:</strong> ${note}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return {success: false, error: error.toString()};
  }
});

exports.sendRescheduleEmail = functions.https.onCall(async (data, context) => {
  const {parentName, oldSessionDate, oldTimeSlot,
    newSessionDate, newTimeSlot} = data;

  const mailOptions = {
    from: "erich.then2@gmail.com",
    to: "erich.then2@gmail.com",
    subject: "Client Rescheduled Session",
    html: `
      <p><strong>${parentName}</strong> has rescheduled their session.</p>
      <p><strong>Previous Date:</strong> ${oldSessionDate} at ${oldTimeSlot}</p>
      <p><strong>New Date:</strong> ${newSessionDate} at ${newTimeSlot}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error sending reschedule email:", error);
    return {success: false, error: error.toString()};
  }
});

exports.sendAdminReschedule = functions.https.onCall(async (data, context) => {
  const {parentEmail, parentName, oldSessionDate, oldTimeSlot,
    newSessionDate, newTimeSlot} = data;

  const mailOptions = {
    from: "erich.then2@gmail.com", // Admin email
    to: parentEmail, // Parent's email
    subject: `Session Rescheduled`,
    html: `
      <p>Dear ${parentName},</p>
      <p>Your child's session has been rescheduled.</p>
      <p><strong>Previous Date:</strong> ${oldSessionDate} at ${oldTimeSlot}</p>
      <p><strong>New Date:</strong> ${newSessionDate} at ${newTimeSlot}</p>
      <p>Thank you,<br>KBT Reading Support</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error sending reschedule email to parent:", error);
    return {success: false, error: error.toString()};
  }
});
