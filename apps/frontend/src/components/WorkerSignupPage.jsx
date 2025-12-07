"use client";

import { useState, useEffect } from "react";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Droplets } from "lucide-react";

import { signupWorker, getServiceCatalog } from "../lib/apiClient";

export default function WorkerSignupPage({ onSignupComplete }) {
  // NEW: load services from backend
  const [serviceOptions, setServiceOptions] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const services = await getServiceCatalog();
        // services is an array of:
        // { service_code, display_name, unit, default_proximate_turnaround_hours, description, delicate_fabric }
        setServiceOptions(services);

        // initialise selection state: all false
        const initial = {};
        services.forEach((svc) => {
          initial[svc.service_code] = false;
        });
        // Example: mark basic wash as default selected if exists
        if (initial["WASH_BASIC"] !== undefined) {
          initial["WASH_BASIC"] = true;
        }
        setSelectedServices(initial);
      } catch (err) {
        console.error("Failed to load service catalog", err);
        // you could set an error here if you want
      } finally {
        setServicesLoading(false);
      }
    }

    loadServices();
  }, []);

  // Worker-specific fields (same as before)
  const [isProfessional, setIsProfessional] = useState(true);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [description, setDescription] = useState(
    "I provide reliable home laundry services."
  );
  const [pricePerWash, setPricePerWash] = useState("30");
  const [maxOrdersPerDay, setMaxOrdersPerDay] = useState("5");
  const [maxItemsPerWash, setMaxItemsPerWash] = useState("10");
  const [minNoticeMinutes, setMinNoticeMinutes] = useState("120");

  // CHANGED: selectedServices initialised later after we know the catalog
  const [selectedServices, setSelectedServices] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function toggleService(code) {
    setSelectedServices((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const chosenServices = serviceOptions
      .filter((s) => selectedServices[s.service_code])
      .map((s) => s.service_code);

    if (chosenServices.length === 0) {
      setError("Please select at least one service you offer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        is_professional: isProfessional,
        pickup_available: pickupAvailable,
        delivery_available: deliveryAvailable,
        description,
        price_per_wash: pricePerWash === "" ? undefined : Number(pricePerWash),
        max_orders_per_day:
          maxOrdersPerDay === "" ? undefined : Number(maxOrdersPerDay),
        max_items_per_wash:
          maxItemsPerWash === "" ? undefined : Number(maxItemsPerWash),
        min_notice_minutes:
          minNoticeMinutes === "" ? undefined : Number(minNoticeMinutes),
        service_codes: chosenServices, // later you handle linking in backend
      };

      const createdWorker = await signupWorker(payload);

      if (onSignupComplete) onSignupComplete(createdWorker);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Failed to complete worker signup. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] to-[#f3fbfc] flex flex-col">
      {/* header ... same as before */}

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-xl bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
          <div className="p-8 md:p-10">
            {/* title ... same as before */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* switches, description, pricing, notice – same as before */}

              {/* Services selection */}
              <div className="space-y-2">
                <Label className="text-slate-700">
                  Services you want to offer
                </Label>

                {servicesLoading ? (
                  <p className="text-sm text-slate-500">Loading services…</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serviceOptions.map((service) => (
                      <button
                        key={service.service_code}
                        type="button"
                        onClick={() => toggleService(service.service_code)}
                        className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                          selectedServices[service.service_code]
                            ? "border-[#26c6da] bg-[#e0f7fa]/70"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <Checkbox
                          checked={!!selectedServices[service.service_code]}
                          onCheckedChange={() =>
                            toggleService(service.service_code)
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm text-slate-800">
                            {service.display_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {service.description
                              ? service.description
                              : `Unit: ${service.unit}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* error + submit – same as before */}
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}
