"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function isSameDay(a, b) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalDateTimeValue(date, time) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T${time}`;
}

function formatDisplay(value) {
  if (!value) return "Choose pickup date and time";

  const date = new Date(value);

  if (!isValidDate(date)) return "Choose pickup date and time";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ModernDateTimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const parsedValue = value ? new Date(value) : null;
  const hasValidValue = isValidDate(parsedValue);

  const [viewDate, setViewDate] = useState(() => {
    const base = hasValidValue ? parsedValue : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return hasValidValue ? parsedValue : null;
  });

  const [selectedTime, setSelectedTime] = useState(() => {
    return value && value.includes("T") ? value.slice(11, 16) : "09:00";
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!value) {
      setSelectedDate(null);
      setSelectedTime("09:00");
      return;
    }

    const nextDate = new Date(value);

    if (!isValidDate(nextDate)) return;

    setSelectedDate(nextDate);
    setSelectedTime(value.includes("T") ? value.slice(11, 16) : "09:00");
    setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const firstWeekday = firstDayOfMonth.getDay();

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstWeekday - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPreviousMonth - i),
        currentMonth: false,
      });
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        currentMonth: true,
      });
    }

    while (days.length < 42) {
      const nextDay = days.length - (firstWeekday + daysInCurrentMonth) + 1;

      days.push({
        date: new Date(year, month + 1, nextDay),
        currentMonth: false,
      });
    }

    return days;
  }, [viewDate]);

  function goToPreviousMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }

  function handleDateSelect(date) {
    setSelectedDate(date);
    onChange(toLocalDateTimeValue(date, selectedTime));
  }

  function handleTimeChange(time) {
    setSelectedTime(time);

    if (selectedDate) {
      onChange(toLocalDateTimeValue(selectedDate, time));
    }
  }

  function handleClear() {
    setSelectedDate(null);
    setSelectedTime("09:00");
    onChange("");
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-[260px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 border border-sky-100 rounded-full px-4 py-2.5 bg-white shadow-sm hover:bg-sky-50 transition text-left"
      >
        <Calendar className="w-4 h-4 text-sky-400" />

        <span className="flex-1 text-sm font-semibold text-slate-600 truncate">
          {formatDisplay(value)}
        </span>

        <Clock className="w-4 h-4 text-sky-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-[360px] max-w-[calc(100vw-32px)] rounded-[28px] border border-sky-100 bg-white p-5 shadow-2xl">
          {/* Calendar header */}
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="w-9 h-9 rounded-full hover:bg-sky-50 flex items-center justify-center text-slate-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-base font-semibold text-slate-900">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="w-9 h-9 rounded-full hover:bg-sky-50 flex items-center justify-center text-slate-600 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-semibold text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, currentMonth }) => {
              const selected = isSameDay(date, selectedDate);
              const today = isSameDay(date, new Date());

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`h-10 rounded-full text-sm transition flex items-center justify-center ${
                    selected
                      ? "bg-sky-600 text-white font-semibold shadow-sm"
                      : currentMonth
                        ? "text-slate-800 hover:bg-sky-50"
                        : "text-slate-300 hover:bg-slate-50"
                  } ${today && !selected ? "ring-1 ring-sky-300" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          <div className="mt-5 rounded-2xl bg-sky-50 border border-sky-100 p-4">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Pickup time
            </label>

            <input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-sky-300"
            />
          </div>

          {/* Footer buttons */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
