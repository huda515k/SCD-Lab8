const express = require('express');
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