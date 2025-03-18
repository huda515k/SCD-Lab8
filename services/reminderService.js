const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // Configure your email service here
});

const scheduleReminder = async (event) => {
  const reminderTime = new Date(event.reminder).getTime();
  const now = new Date().getTime();
  const delay = reminderTime - now;

  if (delay > 0) {
    setTimeout(async () => {
      try {
        await sendReminderEmail(event);
      } catch (e) {
        console.error('Failed to send reminder:', e);
      }
    }, delay);
  }
};

const sendReminderEmail = async (event) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: event.owner.email,
    subject: `Reminder: ${event.name}`,
    text: `Don't forget about your event: ${event.name} on ${event.date}`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  scheduleReminder
};
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const router = new express.Router();

// Create event
router.post('/events', auth, async (req, res) => {
  const event = new Event({
    ...req.body,
    owner: req.user._id
  });

  try {
    await event.save();
    scheduleReminder(event);
    res.status(201).send(event);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get all events (with filters)
router.get('/events', auth, async (req, res) => {
  const match = { owner: req.user._id };
  const sort = {};

  if (req.query.category) {
    match.category = req.query.category;
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    const events = await Event.find(match).sort(sort);
    res.send(events);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;