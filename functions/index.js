const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true});

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kelli.b.then@gmail.com",
    pass: "gavo ebgy kxpb pabh",
  },
});

// invoices
exports.sendMail = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const {email, subject, message, fileContent, fileName} = req.body;

    const mailOptions = {
      from: "kelli.b.then@gmail.com",
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


const MEETING_ID = "882 193 2666";
const MEETING_PASSWORD = "689887";

exports.sendReminderEmails = functions.pubsub
    .schedule("every hour")
    .onRun(async (context) => {
      const db = admin.firestore();
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      const windowStart = new Date(
          reminderTime.getFullYear(),
          reminderTime.getMonth(),
          reminderTime.getDate(),
          reminderTime.getHours(),
          0,
          0,
      );
      const windowEnd = new Date(
          reminderTime.getFullYear(),
          reminderTime.getMonth(),
          reminderTime.getDate(),
          reminderTime.getHours(),
          59,
          59,
      );

      console.log("Checking for sessions from:", windowStart, "to", windowEnd);

      const sessionsQuerySnapshot = await db.collection("sessions")
          .where("session_time", ">=", windowStart.toISOString())
          .where("session_time", "<=", windowEnd.toISOString())
          .get();

      const sessions = sessionsQuerySnapshot.docs.map((doc) => doc.data());

      console.log("Found sessions:", sessions);

      for (const session of sessions) {
        const parentId = session.parent_id;
        const sessionTime = new Date(session.session_time)
            .toLocaleString("en-US", {
              timeZone: "America/New_York",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              month: "long",
              day: "numeric",
              year: "numeric",
            }) + " EST";

        const parentDoc = await db.collection("parents").doc(parentId).get();
        if (!parentDoc.exists) {
          console.error(`Parent with ID ${parentId} not found.`);
          continue;
        }

        const parentEmail = parentDoc.data().email;

        const message = `
          Dear Parent,<br>
          This is a reminder for your child's session on ${sessionTime}.<br>
          <a href="https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09">Join Zoom</a><br>
          Meeting ID: ${MEETING_ID}<br>
          Meeting Password: ${MEETING_PASSWORD}<br>
          Best Regards,<br>
          KBT Reading Support
      `;

        const mailOptions = {
          from: "kelli.b.then@gmail.com",
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


// admin cancel whole day of sessions
exports.sendCancelationEmails = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    console.log("CORS middleware passed.");

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
    } else {
      const {email, subject, message} = req.body;

      const mailOptions = {
        from: "kelli.b.then@gmail.com",
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

// client cancel session
exports.sendCancelEmail = functions.https.onCall(async (data, context) => {
  const {parentName, sessionDate, note} = data;

  const mailOptions = {
    from: "kelli.b.then@gmail.com",
    to: "kelli.b.then@gmail.com",
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

// client reschedule session
exports.sendRescheduleEmail = functions.https.onCall(async (data, context) => {
  const {parentName, oldSessionDate, oldTimeSlot,
    newSessionDate, newTimeSlot} = data;

  const mailOptions = {
    from: "kelli.b.then@gmail.com",
    to: "kelli.b.then@gmail.com",
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

// admin reschedule
exports.sendAdminReschedule = functions.https.onCall(async (data, context) => {
  const {parentEmail, parentName, oldSessionDate, oldTimeSlot,
    newSessionDate, newTimeSlot} = data;

  const mailOptions = {
    from: "kelli.b.then@gmail.com", // Admin email
    to: parentEmail, // Parent"s email
    subject: `Session Rescheduled`,
    html: `
      <p>Dear ${parentName},</p>
      <p>Your child"s session has been rescheduled.</p>
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

// admin cancel
exports.sendAdminCancel = functions.https.onCall(async (data, context) => {
  const {parentName, parentEmail, sessionDate} = data;

  const mailOptions = {
    from: "kelli.b.then@gmail.com",
    to: parentEmail,
    subject: "Your Session has been Canceled",
    html: `
      <p>Dear <strong>${parentName}</strong>,</p>
      <p>Your session on <strong>${sessionDate}</strong> has been canceled.</p>
      <p>If you need to reschedule, you may do so on the website.</p>
      <p>Best Regards,</p>
      <p>KBT Reading Support</p>
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

exports.resetInvoiceStatus = functions.pubsub
    .schedule("0 0 2 * *") // midnight 2nd day every month
    .timeZone("America/New_York")
    .onRun(async (context) => {
      const db = admin.firestore();
      const batch = db.batch();

      try {
        // get all docs for parents, loop and set each
        // invoice status to false
        const parentsSnapshot = await db.collection("parents").get();
        parentsSnapshot.forEach((doc) => {
          const parentRef = db.collection("parents").doc(doc.id);
          batch.update(parentRef, {invoice_status: false});
        });
        // commits update
        await batch.commit();
        console.log("All invoice statuses reset to false.");
      } catch (error) {
        console.error("Error resetting invoice statuses:", error);
      }

      return null;
    });

exports.reportIssue = functions.https.onCall(async (data, context) => {
  const myTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "erich.then2@gmail.com",
      pass: "ogvw hxcu tohn sgzc",
    },
  });

  const mailOptions = {
    from: "erich.then2@gmail.com",
    to: "erich.then2@gmail.com",
    subject: "Client has reported an issue",
    html: `
      <p>client_email: ${data.clientEmail}</p>
      <p>Issue reported: ${data.issue}</p>
    `,
  };

  try {
    await myTransporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error sending issue report email:", error);
    return {success: false};
  }
});

exports.sendCancelAllSession = functions.https.onCall(async (data, context) => {
  const {user} = data;

  const mailOptions = {
    from: "kelli.b.then@gmail.com",
    to: "kelli.b.then@gmail.com", // Can be your or another admin's email
    subject: `${user} has canceled all of their sessions`,
    text: `${user} has canceled all sessions from their dashboard.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error sending email:", error);
    return {success: false, error: error.message};
  }
});

exports.sendRescheduleAll = functions.https.onCall(async (data, context) => {
  const {parentName, rescheduledDay, rescheduledTime} = data;

  const mailOptions = {
    from: "kelli.b.then@gmail.com",
    to: "kelli.b.then@gmail.com",
    subject: `${parentName} has rescheduled all sessions`,
    text: `The parent ${parentName} has rescheduled all their sessions.
           New session day: ${rescheduledDay}.
           New session time: ${rescheduledTime}.`,
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error sending email:", error);
    return {success: false, error: error.message};
  }
});

