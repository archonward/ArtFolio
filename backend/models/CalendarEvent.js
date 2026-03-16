const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

calendarEventSchema.index({ date: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);