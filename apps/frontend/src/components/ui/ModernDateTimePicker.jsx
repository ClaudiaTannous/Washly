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

const DEFAULT_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isBeforeToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);

  return copy < today;
}

export default function ModernDateTimePicker({
  value,
  onChange,
  availability = null,
}) {
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

  function getSlotsForDate(date) {
    const dateKey = toDateKey(date);

    if (availability) {
      return availability?.[dateKey] || [];
    }

    return DEFAULT_TIME_SLOTS;
  }

  function handleDateSelect(date) {
    if (isBeforeToday(date)) return;

    const slots = getSlotsForDate(date);
    const firstSlot = slots[0] || selectedTime || "09:00";

    setSelectedDate(date);
    setSelectedTime(firstSlot);
    onChange(toLocalDateTimeValue(date, firstSlot));
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

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, currentMonth }) => {
              const selected = isSameDay(date, selectedDate);
              const today = isSameDay(date, new Date());
              const slots = getSlotsForDate(date);

              const disabled =
                !currentMonth ||
                isBeforeToday(date) ||
                (availability && slots.length === 0);

              const isAvailable = !disabled;

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDateSelect(date)}
                  className={`relative h-10 rounded-full text-sm transition flex items-center justify-center ${
                    selected
                      ? "bg-sky-600 text-white font-semibold shadow-sm"
                      : isAvailable
                        ? "text-slate-800 hover:bg-sky-50"
                        : "text-slate-300 opacity-40 cursor-not-allowed"
                  } ${today && !selected ? "ring-1 ring-sky-300" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-sky-50 border border-sky-100 p-4">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Pickup time
            </label>

            <div className="grid grid-cols-3 gap-2">
              {(selectedDate ? getSlotsForDate(selectedDate) : []).map(
                (slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeChange(slot)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      selectedTime === slot
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white text-slate-700 border-sky-100 hover:bg-sky-50"
                    }`}
                  >
                    {slot}
                  </button>
                ),
              )}

              {selectedDate && getSlotsForDate(selectedDate).length === 0 && (
                <div className="col-span-3 text-sm text-slate-500">
                  No available times for this day.
                </div>
              )}

              {!selectedDate && (
                <div className="col-span-3 text-sm text-slate-500">
                  Choose a date first.
                </div>
              )}
            </div>
          </div>

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
