"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Droplets, Briefcase, DollarSign, Clock, Package } from "lucide-react";

import { createWorker, getServiceCatalog } from "../lib/apiClient";

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
        data.forEach((svc) => (initial[svc.service_code] = false));
        setSelectedServices(initial);
      } catch (err) {
        console.error("Failed loading services", err);
      } finally {
        setServicesLoading(false);
      }
    }
    load();
  }, []);

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
      [code]: !prev[code],
    }));

  const isStep1Valid =
    formData.pricePerWash &&
    formData.maxItemsPerWash &&
    formData.maxOrdersPerDay &&
    formData.minNoticeMinutes;

  const isStep2Valid = () =>
    Object.values(selectedServices).some((v) => v === true);

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  const handleSubmit = async () => {
    if (!isStep2Valid()) {
      alert("Please select at least one service.");
      return;
    }

    const chosenServices = serviceOptions
      .filter((svc) => selectedServices[svc.service_code])
      .map((svc) => svc.service_code);

    const payload = {
      is_professional: formData.isProfessional,
      pickup_available: formData.pickupAvailable,
      delivery_available: formData.deliveryAvailable,
      description: formData.workerDescription,
      max_orders_per_day: Number(formData.maxOrdersPerDay),
      min_notice_minutes: Number(formData.minNoticeMinutes),
      max_items_per_wash: Number(formData.maxItemsPerWash),
      price_per_wash: Number(formData.pricePerWash),
      service_codes: chosenServices,
    };

    try {
      await createWorker(payload);
      onSwitchToLogin?.();
    } catch (err) {
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
          {[1, 2].map((step) => (
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
                  {step === 1 ? "Worker Info" : "Services"}
                </span>
              </div>

              {step < 2 && (
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
                  {serviceOptions.map((svc) => (
                    <div
                      key={svc.service_code}
                      onClick={() => toggleService(svc.service_code)}
                      className={`flex gap-3 border rounded-xl px-3 py-2 cursor-pointer transition ${
                        selectedServices[svc.service_code]
                          ? "bg-[#e0f7fa] border-[#26c6da]"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      {/* Prevent double firing inside checkbox */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedServices[svc.service_code]}
                          onCheckedChange={() => {}}
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm">{svc.display_name}</p>
                        <p className="text-xs text-slate-500">
                          {svc.description || `Unit: ${svc.unit}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                } else if (currentStep === 2) {
                  handleSubmit();
                }
              }}
              className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white"
            >
              {currentStep === 2 ? "Create Worker Account" : "Continue"}
            </Button>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-4 text-center text-slate-600 text-sm">
          Already a worker?{" "}
          <button className="text-[#26c6da]" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
