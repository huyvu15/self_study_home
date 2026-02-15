import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Loading from './Loading';
import './Schedule.css';

const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function Schedule({ onBack }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, [current.month, current.year]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await api.getSchedule(current.month, current.year);
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrent((c) => {
      if (c.month === 1) return { month: 12, year: c.year - 1 };
      return { month: c.month - 1, year: c.year };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrent((c) => {
      if (c.month === 12) return { month: 1, year: c.year + 1 };
      return { month: c.month + 1, year: c.year };
    });
    setSelectedDate(null);
  };

  const firstDay = new Date(current.year, current.month - 1, 1);
  const lastDay = new Date(current.year, current.month, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays = [];
  for (let i = 0; i < startWeekday; i++) {
    calendarDays.push({ day: null, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${current.year}-${String(current.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, date: dateStr });
  }

  const getEventsForDate = (dateStr) => events.filter((e) => String(e.Date).slice(0, 10) === dateStr);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="schedule-page">
      <div className="schedule-container">
        <div className="schedule-header">
          <button type="button" className="schedule-back" onClick={onBack}>
            ← Quay lại
          </button>
          <h1>Lịch học</h1>
        </div>

        <div className="schedule-toolbar">
          <button type="button" className="schedule-nav-btn" onClick={prevMonth}>
            ‹ Tháng trước
          </button>
          <h2 className="schedule-title">
            {MONTH_NAMES[current.month - 1]} / {current.year}
          </h2>
          <button type="button" className="schedule-nav-btn" onClick={nextMonth}>
            Tháng sau ›
          </button>
        </div>

        {loading ? (
          <Loading text="Đang tải lịch..." />
        ) : (
          <>
            <div className="schedule-calendar">
              <div className="schedule-weekdays">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="schedule-weekday">
                    {w}
                  </div>
                ))}
              </div>
              <div className="schedule-grid">
                {calendarDays.map((cell, idx) => {
                  if (cell.day === null) {
                    return <div key={`empty-${idx}`} className="schedule-day schedule-day-empty" />;
                  }
                  const dayEvents = getEventsForDate(cell.date);
                  const isToday = cell.date === todayStr;
                  const isSelected = selectedDate === cell.date;
                  return (
                    <div
                      key={cell.date}
                      className={`schedule-day ${isToday ? 'schedule-day-today' : ''} ${isSelected ? 'schedule-day-selected' : ''}`}
                      onClick={() => setSelectedDate(selectedDate === cell.date ? null : cell.date)}
                    >
                      <span className="schedule-day-num">{cell.day}</span>
                      {dayEvents.length > 0 && (
                        <div className="schedule-day-events">
                          {dayEvents.slice(0, 2).map((evt) => (
                            <div key={evt.EventId} className="schedule-day-event" title={evt.Title}>
                              {evt.StartTime} {evt.Title || evt.CourseName}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="schedule-day-more">+{dayEvents.length - 2}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="schedule-detail">
                <h3>Lịch ngày {selectedDate}</h3>
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="schedule-no-events">Không có buổi học nào.</p>
                ) : (
                  <ul className="schedule-event-list">
                    {getEventsForDate(selectedDate)
                      .sort((a, b) => (a.StartTime || '').localeCompare(b.StartTime || ''))
                      .map((evt) => (
                        <li key={evt.EventId} className="schedule-event-item">
                          <span className="schedule-event-time">
                            {evt.StartTime || '?'} – {evt.EndTime || '?'}
                          </span>
                          <span className="schedule-event-title">{evt.Title || evt.CourseName}</span>
                          {evt.LessonName && (
                            <span className="schedule-event-lesson">{evt.LessonName}</span>
                          )}
                          {evt.Description && (
                            <span className="schedule-event-desc">{evt.Description}</span>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Schedule;
