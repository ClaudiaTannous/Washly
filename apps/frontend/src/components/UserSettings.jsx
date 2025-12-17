"use client";

import { useState } from "react";
import { ArrowLeft, Save, User, Phone, MapPin } from "lucide-react";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

import { updateUser } from "@/lib/apiClient";

export function UserSettings({ user, onBack }) {
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone: user.phone || "",
    country_name: user.country_name || "",
    city_name: user.city_name || "",
    street_name: user.street_name || "",
    building_number: user.building_number || "",
    apartment_house_number: user.apartment_house_number || "",
    floor_number: user.floor_number || "",
    description: user.description || "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handleSave() {
    try {
      setSaving(true);

      // 🚫 first_name & last_name intentionally NOT sent
      await updateUser(user.id, {
        phone: formData.phone,
        country_name: formData.country_name,
        city_name: formData.city_name,
        street_name: formData.street_name,
        building_number: Number(formData.building_number) || null,
        apartment_house_number: Number(formData.apartment_house_number) || null,
        floor_number: Number(formData.floor_number) || null,
        description: formData.description,
      });

      alert("Profile updated successfully");
      onBack();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-slate-800">
              Profile Settings
            </h1>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* PERSONAL INFO */}
        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Personal Information</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* 🔒 LOCKED */}
              <InputField
                label="First name"
                icon={User}
                value={formData.first_name}
                disabled
              />

              {/* 🔒 LOCKED */}
              <InputField
                label="Last name"
                icon={User}
                value={formData.last_name}
                disabled
              />

              <InputField
                label="Phone"
                icon={Phone}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* ADDRESS */}
        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Address</h2>

            <InputField
              label="Country"
              icon={MapPin}
              name="country_name"
              value={formData.country_name}
              onChange={handleChange}
            />
            <InputField
              label="City"
              icon={MapPin}
              name="city_name"
              value={formData.city_name}
              onChange={handleChange}
            />
            <InputField
              label="Street"
              icon={MapPin}
              name="street_name"
              value={formData.street_name}
              onChange={handleChange}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                name="building_number"
                placeholder="Building"
                value={formData.building_number}
                onChange={handleChange}
                className="border-2 border-slate-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition"
              />
              <Input
                name="apartment_house_number"
                placeholder="Apartment"
                value={formData.apartment_house_number}
                onChange={handleChange}
                className="border-2 border-slate-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition"
              />
              <Input
                name="floor_number"
                placeholder="Floor"
                value={formData.floor_number}
                onChange={handleChange}
                className="border-2 border-slate-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition"
              />
            </div>
          </div>
        </Card>

        {/* DESCRIPTION */}
        <Card>
          <div className="p-6 space-y-2">
            <h2 className="text-lg font-semibold">About You</h2>
            <Textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="border-2 border-slate-300 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition"
              placeholder="Tell us a bit about yourself..."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- SMALL REUSABLE ---------- */
function InputField({ label, icon: Icon, disabled, ...props }) {
  return (
    <div>
      <Label className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <Input
        {...props}
        disabled={disabled}
        className={`border-2 rounded-lg transition
          ${
            disabled
              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
              : "border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          }`}
      />
    </div>
  );
}
