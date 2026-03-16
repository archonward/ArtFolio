import { useEffect, useMemo, useState } from 'react';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/calendarEventService';

function getMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function getMonthDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
}

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [editingEventId, setEditingEventId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setPageError('');
        const data = await fetchCalendarEvents();
        setEvents(data);
      } catch (err) {
        console.error(err);
        setPageError(err.message || 'Failed to load calendar events.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const selectedDateKey = formatDateKey(selectedDate);

  const eventsByDate = useMemo(() => {
    const map = new Map();

    events.forEach((event) => {
      const key = new Date(event.date).toISOString().split('T')[0];
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(event);
    });

    return map;
  }, [events]);

  const selectedDateEvents = eventsByDate.get(selectedDateKey) || [];
  const monthCells = getMonthDays(viewDate);

  const resetForm = () => {
    setEditingEventId(null);
    setTitle('');
    setBody('');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setPageError('Event title is required.');
      return;
    }

    try {
      setSaving(true);
      setPageError('');

      const payload = {
        title: title.trim(),
        body: body.trim(),
        date: selectedDateKey,
      };

      if (editingEventId) {
        const updated = await updateCalendarEvent(editingEventId, payload);
        setEvents((prev) =>
          prev.map((event) => (event._id === editingEventId ? updated : event))
        );
      } else {
        const created = await createCalendarEvent(payload);
        setEvents((prev) => [...prev, created]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setPageError(err.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEventId(event._id);
    setTitle(event.title);
    setBody(event.body || '');

    const eventDate = new Date(event.date);
    setSelectedDate(eventDate);
    setViewDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
  };

  const handleDelete = async (eventId) => {
    const confirmed = window.confirm('Delete this event?');
    if (!confirmed) {
      return;
    }

    try {
      setPageError('');
      await deleteCalendarEvent(eventId);
      setEvents((prev) => prev.filter((event) => event._id !== eventId));

      if (editingEventId === eventId) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setPageError(err.message || 'Failed to delete event.');
    }
  };

  const goToPreviousMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <section className="section-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Calendar</h2>
          <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>
            Add, view, edit, and delete simple day-based events.
          </p>
        </div>
      </div>

      {pageError && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            backgroundColor: '#fdecea',
            color: '#b42318',
            border: '1px solid #f5c2c7',
          }}
        >
          {pageError}
        </div>
      )}

      {loading ? (
        <div>Loading calendar...</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(280px, 1fr)',
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <button type="button" className="button button-muted" onClick={goToPreviousMonth}>
                ←
              </button>
              <h3 style={{ margin: 0 }}>{getMonthLabel(viewDate)}</h3>
              <button type="button" className="button button-muted" onClick={goToNextMonth}>
                →
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
                marginBottom: 8,
                fontWeight: 600,
                color: '#4b5563',
                fontSize: '0.9rem',
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  {label}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
              }}
            >
              {monthCells.map((dateCell, index) => {
                if (!dateCell) {
                  return <div key={`empty-${index}`} style={{ minHeight: 78 }} />;
                }

                const key = formatDateKey(dateCell);
                const isSelected = key === selectedDateKey;
                const hasEvents = (eventsByDate.get(key) || []).length > 0;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(dateCell)}
                    style={{
                      minHeight: 78,
                      borderRadius: 12,
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #dbeafe',
                      background: isSelected ? '#eff6ff' : 'rgba(255,255,255,0.9)',
                      cursor: 'pointer',
                      padding: 10,
                      textAlign: 'left',
                      boxShadow: hasEvents ? '0 4px 10px rgba(59,130,246,0.08)' : 'none',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{dateCell.getDate()}</div>
                    {hasEvents && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'inline-block',
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #dbeafe',
                borderRadius: 14,
                padding: 16,
                boxShadow: '0 6px 18px rgba(148, 184, 255, 0.08)',
                marginBottom: 18,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Events on {selectedDate.toLocaleDateString()}
              </h3>

              {selectedDateEvents.length === 0 ? (
                <p style={{ color: '#6b7280', marginBottom: 0 }}>No events for this date.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event._id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        padding: 12,
                        background: '#fff',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{event.title}</div>
                          {event.body && (
                            <div style={{ marginTop: 6, color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                              {event.body}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="button button-muted"
                            onClick={() => handleEdit(event)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => handleDelete(event._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #dbeafe',
                borderRadius: 14,
                padding: 16,
                boxShadow: '0 6px 18px rgba(148, 184, 255, 0.08)',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {editingEventId ? 'Edit Event' : 'Add Event'}
              </h3>

              <form onSubmit={handleSave}>
                <div className="form-row">
                  <label className="form-label" htmlFor="calendar-title">
                    Title:
                  </label>
                  <input
                    id="calendar-title"
                    className="form-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                    maxLength={120}
                    required
                  />
                </div>

                <div className="form-row">
                  <label className="form-label" htmlFor="calendar-body">
                    Body:
                  </label>
                  <textarea
                    id="calendar-body"
                    className="form-input"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Event notes"
                    maxLength={2000}
                    rows={5}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Selected day:</label>
                  <span>{selectedDate.toLocaleDateString()}</span>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingEventId ? 'Update Event' : 'Add Event'}
                  </button>

                  {editingEventId && (
                    <button
                      type="button"
                      className="button button-muted"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CalendarPage;