"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Droplets, Briefcase, DollarSign, Clock, Package } from "lucide-react";

import {
  createWorker,
  getServiceCatalog,
  addWorkerBusinessHoursBulk,
} from "../lib/apiClient";

export function WorkerSignupForm({ onSwitchToLogin }) {
  const [currentStep, setCurrentStep] = useState(1);

  // ------------------------------------------------------
  // SERVICE CATALOG
  // ------------------------------------------------------
  const [serviceOptions, setServiceOptions] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const data = await getServiceCatalog();
        setServiceOptions(data);

        const initial = {};
        data.forEach((svc) => {
          initial[svc.service_code] = {
            selected: false,
            price: formData.pricePerWash || "30",
          };
        });
        setSelectedServices(initial);
      } catch (err) {
        console.error("Failed loading services", err);
      } finally {
        setServicesLoading(false);
      }
    }
    load();
  }, []);

  const DAYS = [
    { id: 0, label: "Sunday" },
    { id: 1, label: "Monday" },
    { id: 2, label: "Tuesday" },
    { id: 3, label: "Wednesday" },
    { id: 4, label: "Thursday" },
    { id: 5, label: "Friday" },
    { id: 6, label: "Saturday" },
  ];

  const [businessHours, setBusinessHours] = useState(
    DAYS.reduce((acc, day) => {
      acc[day.id] = {
        enabled: false,
        ranges: [{ start: "09:00", end: "17:00" }],
      };
      return acc;
    }, {}),
  );

  // ------------------------------------------------------
  // WORKER FORM DATA
  // ------------------------------------------------------
  const [formData, setFormData] = useState({
    isProfessional: false,
    pickupAvailable: false,
    deliveryAvailable: false,
    workerDescription: "",
    maxOrdersPerDay: "5",
    minNoticeMinutes: "120",
    maxItemsPerWash: "10",
    pricePerWash: "30",
  });

  const updateField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleService = (code) =>
    setSelectedServices((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        selected: !prev[code]?.selected,
        price: prev[code]?.price || formData.pricePerWash || "30",
      },
    }));

  const isStep1Valid =
    formData.pricePerWash &&
    formData.maxItemsPerWash &&
    formData.maxOrdersPerDay &&
    formData.minNoticeMinutes;

  const isStep2Valid = () =>
    Object.values(selectedServices).some((v) => v.selected === true);

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  const handleSubmit = async () => {
    // Step 2 validation
    if (!isStep2Valid()) {
      alert("Please select at least one service.");
      return;
    }

    const chosenServices = serviceOptions
      .filter((svc) => selectedServices[svc.service_code]?.selected)
      .map((svc) => ({
        service_code: svc.service_code,
        base_price: Number(selectedServices[svc.service_code]?.price || 0),
      }));
    // Worker payload (unchanged)
    const payload = {
      is_professional: formData.isProfessional,
      pickup_available: formData.pickupAvailable,
      delivery_available: formData.deliveryAvailable,
      description: formData.workerDescription,
      max_orders_per_day: Number(formData.maxOrdersPerDay),
      min_notice_minutes: Number(formData.minNoticeMinutes),
      max_items_per_wash: Number(formData.maxItemsPerWash),
      price_per_wash: Number(formData.pricePerWash),
      services: chosenServices,
    };

    try {
      // 1️⃣ Create worker
      const worker = await createWorker(payload);
      const workerId = worker.id;

      // 2️⃣ Build business hours payload
      const hoursPayload = [];

      Object.entries(businessHours).forEach(([day, data]) => {
        if (!data.enabled) return;

        data.ranges.forEach((range) => {
          if (!range.start || !range.end) return;

          hoursPayload.push({
            day_of_week: Number(day),
            start_hhmm: range.start,
            end_hhmm: range.end,
          });
        });
      });

      // 3️⃣ Save business hours (only if any were selected)
      if (hoursPayload.length > 0) {
        await addWorkerBusinessHoursBulk(workerId, hoursPayload);
      }

      // 4️⃣ Redirect
      window.location.href = "/worker";
    } catch (err) {
      const msg = err.message || "";

      // Worker already exists → redirect
      if (msg.includes("Worker already exists")) {
        window.location.href = "/worker";
        return;
      }

      console.error(err);
      alert("Worker signup failed.");
    }
  };

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="w-full max-w-3xl mx-auto mt-10 mb-10">
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] flex items-center justify-center shadow-lg mb-3">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            Become a Worker
          </h1>
          <p className="text-slate-600 mt-1">Set up your service profile</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                    currentStep >= step
                      ? "bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {step}
                </div>

                <span
                  className={`mt-2 text-sm ${
                    currentStep >= step ? "text-[#26c6da]" : "text-slate-400"
                  }`}
                >
                  {step === 1
                    ? "Worker Info"
                    : step === 2
                      ? "Services"
                      : "Hours"}
                </span>
              </div>

              {/* Connector line */}
              {step < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded ${
                    currentStep > step
                      ? "bg-gradient-to-r from-[#4dd0e1] to-[#26c6da]"
                      : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* FORM */}
        <div className="space-y-4">
          {/* STEP 1 — Worker Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-3 bg-white/40 p-4 rounded-xl">
                {/* Professional Provider */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.isProfessional}
                    onCheckedChange={(v) => updateField("isProfessional", v)}
                  />
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">
                      Professional provider
                    </span>
                  </div>
                </div>

                {/* Pickup */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.pickupAvailable}
                    onCheckedChange={(v) => updateField("pickupAvailable", v)}
                  />
                  <span className="text-slate-700">Offer pickup service</span>
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.deliveryAvailable}
                    onCheckedChange={(v) => updateField("deliveryAvailable", v)}
                  />
                  <span className="text-slate-700">Offer delivery service</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Price Per Wash ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      value={formData.pricePerWash}
                      onChange={(e) =>
                        updateField("pricePerWash", e.target.value)
                      }
                      className="pl-11 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Max Items Per Wash</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      value={formData.maxItemsPerWash}
                      onChange={(e) =>
                        updateField("maxItemsPerWash", e.target.value)
                      }
                      className="pl-11 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Max Orders Per Day</Label>
                  <Input
                    type="number"
                    value={formData.maxOrdersPerDay}
                    onChange={(e) =>
                      updateField("maxOrdersPerDay", e.target.value)
                    }
                    className="h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Min Notice (minutes)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      value={formData.minNoticeMinutes}
                      onChange={(e) =>
                        updateField("minNoticeMinutes", e.target.value)
                      }
                      className="pl-11 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label>Service Description (optional)</Label>
                <Textarea
                  rows={3}
                  value={formData.workerDescription}
                  onChange={(e) =>
                    updateField("workerDescription", e.target.value)
                  }
                  placeholder="Describe your laundry service..."
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* STEP 2 — Services */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label className="text-slate-700">Services You Offer *</Label>

              {servicesLoading ? (
                <p className="text-slate-500">Loading services…</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceOptions.map((svc) => {
                    const serviceState = selectedServices[svc.service_code];
                    const isSelected = serviceState?.selected === true;

                    return (
                      <div
                        key={svc.service_code}
                        onClick={() => toggleService(svc.service_code)}
                        className={`flex gap-3 border rounded-xl px-3 py-3 cursor-pointer transition ${
                          isSelected
                            ? "bg-[#e0f7fa] border-[#26c6da]"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}}
                          />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {svc.display_name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {svc.description || `Unit: ${svc.unit}`}
                          </p>

                          {isSelected && (
                            <div
                              className="mt-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Label className="text-xs text-slate-600">
                                Service price ₪
                              </Label>

                              <Input
                                type="number"
                                min="0"
                                value={serviceState?.price || ""}
                                onChange={(e) =>
                                  setSelectedServices((prev) => ({
                                    ...prev,
                                    [svc.service_code]: {
                                      ...prev[svc.service_code],
                                      selected: true,
                                      price: e.target.value,
                                    },
                                  }))
                                }
                                className="mt-1 h-9 bg-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* STEP 3 — Business Hours */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label className="text-slate-700">Business Hours</Label>

              {DAYS.map((day) => {
                const data = businessHours[day.id];

                return (
                  <div key={day.id} className="bg-white/40 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        checked={data.enabled}
                        onCheckedChange={(v) =>
                          setBusinessHours((prev) => ({
                            ...prev,
                            [day.id]: { ...prev[day.id], enabled: v },
                          }))
                        }
                      />
                      <span className="text-slate-700">{day.label}</span>
                    </div>

                    {data.enabled &&
                      data.ranges.map((range, idx) => (
                        <div key={idx} className="flex gap-3">
                          <Input
                            type="time"
                            value={range.start}
                            onChange={(e) => {
                              const ranges = [...data.ranges];
                              ranges[idx].start = e.target.value;
                              setBusinessHours((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], ranges },
                              }));
                            }}
                          />

                          <Input
                            type="time"
                            value={range.end}
                            onChange={(e) => {
                              const ranges = [...data.ranges];
                              ranges[idx].end = e.target.value;
                              setBusinessHours((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], ranges },
                              }));
                            }}
                          />
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                if (currentStep === 1 && isStep1Valid) {
                  setCurrentStep(2);
                } else if (currentStep === 2 && isStep2Valid()) {
                  setCurrentStep(3);
                } else if (currentStep === 3) {
                  handleSubmit();
                }
              }}
              className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white"
            >
              {currentStep === 3 ? "Create Worker Account" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
