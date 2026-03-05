"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Clock,
  Package,
  DollarSign,
  Truck,
  Briefcase,
} from "lucide-react";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

import {
  updateWorker,
  getWorkerBusinessHours,
  updateWorkerBusinessHours,
  addWorkerBusinessHoursBulk,
  getWorkerServices,
  createWorkerService,
  deleteWorkerService,
  getServiceCatalog,
} from "../lib/apiClient";

/* ---------- DAYS CONSTANT ---------- */
const DAYS = [
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
];

export default function WorkerUpdatePage({ worker }) {
  const router = useRouter();

  /* ---------- CORE WORKER FORM ---------- */
  const [form, setForm] = useState({
    is_professional: worker.is_professional ?? false,
    pickup_available: worker.pickup_available ?? false,
    delivery_available: worker.delivery_available ?? false,
    description: worker.description ?? "",
    max_orders_per_day: worker.max_orders_per_day ?? 5,
    min_notice_minutes: worker.min_notice_minutes ?? 120,
    max_items_per_wash: worker.max_items_per_wash ?? 10,
    price_per_wash: worker.price_per_wash ?? 30,
  });

  /* ---------- HOURS + SERVICES ---------- */
  const [hours, setHours] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [saving, setSaving] = useState(false);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    async function load() {
      const h = await getWorkerBusinessHours(worker.id);
      const s = await getWorkerServices(worker.id);
      const catalog = await getServiceCatalog();
      const catalogList = Array.isArray(catalog)
        ? catalog
        : (catalog.data ?? []);

      setSelectedServices(s.map((x) => x.service_code));

      setServices(
        catalogList.map((s) => ({
          // ← use catalogList, not catalog
          service_code: s.service_code,
          label: s.display_name,
        })),
      );

      setHours(
        (h || []).map((x) => ({
          ...x,
          original_start_hhmm: x.start_hhmm,
        })),
      );

      setSelectedServices(s.map((x) => x.service_code));

      setServices(
        catalog.map((s) => ({
          service_code: s.service_code,
          label: s.display_name, // Prisma field
        })),
      );
    }

    load();
  }, [worker.id]);

  function handleChange(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  /* ---------- HOURS HELPERS ---------- */

  function generateDefaultWeek() {
    setHours(
      DAYS.slice(1, 6).map((d) => ({
        day_of_week: d.id,
        start_hhmm: "09:00",
        end_hhmm: "17:00",
        original_start_hhmm: "09:00",
      })),
    );
  }

  function addEmptyDay() {
    const used = hours.map((h) => h.day_of_week);
    const next = DAYS.find((d) => !used.includes(d.id));
    if (!next) return;

    setHours((p) => [
      ...p,
      {
        day_of_week: next.id,
        start_hhmm: "09:00",
        end_hhmm: "17:00",
        original_start_hhmm: "09:00",
      },
    ]);
  }

  function removeDay(day) {
    setHours((p) => p.filter((h) => h.day_of_week !== day));
  }

  /* ---------- SAVE ---------- */
  async function handleSave() {
    try {
      setSaving(true);

      await updateWorker(worker.id, {
        ...form,
        max_orders_per_day: Number(form.max_orders_per_day),
        min_notice_minutes: Number(form.min_notice_minutes),
        max_items_per_wash: Number(form.max_items_per_wash),
        price_per_wash: Number(form.price_per_wash),
      });

      const existing = await getWorkerBusinessHours(worker.id);

      if (!existing || existing.length === 0) {
        await addWorkerBusinessHoursBulk(
          worker.id,
          hours.map((h) => ({
            day_of_week: h.day_of_week,
            start_hhmm: h.start_hhmm,
            end_hhmm: h.end_hhmm,
          })),
        );
      } else {
        for (const h of hours) {
          await updateWorkerBusinessHours(
            worker.id,
            {
              day_of_week: h.day_of_week,
              start_hhmm: h.original_start_hhmm,
            },
            {
              new_start_hhmm: h.start_hhmm,
              new_end_hhmm: h.end_hhmm,
            },
          );
        }
      }

      const existingServices = await getWorkerServices(worker.id);
      const existingCodes = existingServices.map((x) => x.service_code);

      for (const code of selectedServices) {
        if (!existingCodes.includes(code)) {
          await createWorkerService(worker.id, {
            service_code: code,
            base_price: form.price_per_wash,
          });
        }
      }

      for (const code of existingCodes) {
        if (!selectedServices.includes(code)) {
          await deleteWorkerService(worker.id, code);
        }
      }

      router.push("/worker");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3 items-center">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Update Worker Profile</h1>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* WORKER SETTINGS */}
        <Card className="mb-6">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Worker Settings</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Toggle
                label="Professional Worker"
                icon={Briefcase}
                value={form.is_professional}
                onChange={(v) => handleChange("is_professional", v)}
              />
              <Toggle
                label="Pickup Available"
                icon={Truck}
                value={form.pickup_available}
                onChange={(v) => handleChange("pickup_available", v)}
              />
              <Toggle
                label="Delivery Available"
                icon={Truck}
                value={form.delivery_available}
                onChange={(v) => handleChange("delivery_available", v)}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="border-2 border-slate-300 rounded-xl
             focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200
             transition"
              />
            </div>
          </div>
        </Card>

        {/* BUSINESS RULES */}
        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Business Rules</h2>
            <InputField
              label="Max orders per day"
              icon={Package}
              value={form.max_orders_per_day}
              onChange={(v) => handleChange("max_orders_per_day", v)}
            />
            <InputField
              label="Minimum notice (minutes)"
              icon={Clock}
              value={form.min_notice_minutes}
              onChange={(v) => handleChange("min_notice_minutes", v)}
            />
            <InputField
              label="Max items per wash"
              icon={Package}
              value={form.max_items_per_wash}
              onChange={(v) => handleChange("max_items_per_wash", v)}
            />
            <InputField
              label="Price per wash (₪)"
              icon={DollarSign}
              value={form.price_per_wash}
              onChange={(v) => handleChange("price_per_wash", v)}
            />
          </div>
        </Card>

        {/* BUSINESS HOURS */}
        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Business Hours</h2>

            {hours.length === 0 && (
              <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-4">
                <p>No business hours yet</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={generateDefaultWeek}>
                    Generate Mon–Fri
                  </Button>
                  <Button onClick={addEmptyDay}>Add First Day</Button>
                </div>
              </div>
            )}

            {hours.map((h) => (
              <div
                key={`${h.day_of_week}-${h.original_start_hhmm}`}
                className="grid grid-cols-4 gap-4 items-center border p-3 rounded-xl"
              >
                <span>{DAYS.find((d) => d.id === h.day_of_week)?.label}</span>
                <Input
                  type="time"
                  value={h.start_hhmm}
                  className="
    border-2 border-slate-300 rounded-lg
    focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200
    transition
  "
                  onChange={(e) =>
                    setHours((p) =>
                      p.map((x) =>
                        x.day_of_week === h.day_of_week
                          ? { ...x, start_hhmm: e.target.value }
                          : x,
                      ),
                    )
                  }
                />

                <Input
                  type="time"
                  value={h.end_hhmm}
                  onChange={(e) =>
                    setHours((p) =>
                      p.map((x) =>
                        x.day_of_week === h.day_of_week
                          ? { ...x, end_hhmm: e.target.value }
                          : x,
                      ),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  onClick={() => removeDay(h.day_of_week)}
                >
                  Remove
                </Button>
              </div>
            ))}

            {hours.length > 0 && hours.length < 7 && (
              <Button variant="outline" onClick={addEmptyDay}>
                Add another day
              </Button>
            )}
          </div>
        </Card>

        {/* SERVICES */}
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Services Offered</h2>

            {services.map((s) => {
              const enabled = selectedServices.includes(s.service_code);
              return (
                <div
                  key={s.service_code}
                  className={`flex justify-between items-center p-4 rounded-xl border transition
                  ${
                    enabled
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500 shadow"
                      : "bg-slate-50 text-slate-500 border-slate-300"
                  }`}
                >
                  <span>{s.label}</span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) =>
                      setSelectedServices((p) =>
                        v
                          ? [...p, s.service_code]
                          : p.filter((x) => x !== s.service_code),
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- REUSABLE ---------- */

function Toggle({ label, icon: Icon, value, onChange }) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-xl border transition
        ${
          value
            ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500 shadow"
            : "bg-slate-100 text-slate-500 border-slate-300"
        }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`w-4 h-4 ${value ? "text-white" : "text-slate-400"}`}
        />
        <span className="font-medium">{label}</span>
      </div>

      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function InputField({ label, icon: Icon, value, onChange }) {
  return (
    <div>
      <Label className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        className="border-2 border-slate-300 rounded-lg
             focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200
             transition"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
