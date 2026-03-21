import { apiFetch } from './api';

export async function fetchCalendarEvents() {
  const res = await apiFetch('/api/calendar-events');

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load calendar events.');
  }

  return res.json();
}

export async function createCalendarEvent(eventData) {
  const res = await apiFetch('/api/calendar-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create calendar event.');
  }

  return data;
}

export async function updateCalendarEvent(eventId, eventData) {
  const res = await apiFetch(`/api/calendar-events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update calendar event.');
  }

  return data;
}

export async function deleteCalendarEvent(eventId) {
  const res = await apiFetch(`/api/calendar-events/${eventId}`, {
    method: 'DELETE',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete calendar event.');
  }

  return data;
}
