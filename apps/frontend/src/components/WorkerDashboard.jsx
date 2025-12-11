"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Settings,
  LogOut,
  User,
  MapPin,
  Phone,
} from "lucide-react";

import { setWorkerOnlineStatus, uploadWorkerAvatar } from "../lib/apiClient";

const statusConfig = {
  REQUESTED: {
    label: "Requested",
    icon: Clock,
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle,
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Package,
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  CANCELLED_BY_WORKER: {
    label: "Cancelled",
    icon: XCircle,
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
  CANCELLED_BY_CUSTOMER: {
    label: "Cancelled",
    icon: XCircle,
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
};

/* ⬇ THIS LINE IS WHAT FIXES YOUR ERROR */
export function WorkerDashboard({
  worker = {},
  orders = [],
  onNavigateToCustomerDashboard,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const workerId = worker?.id; // now coming from props
  const [isOnline, setIsOnline] = useState(worker?.isOnline || false);
  const [onlineLoading, setOnlineLoading] = useState(false);

  const pendingOrders = orders.filter((o) => o.status === "REQUESTED");
  const activeOrders = orders.filter((o) =>
    ["CONFIRMED", "IN_PROGRESS"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.amount || 0),
    0
  );

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  async function handleToggleOnline(checked) {
    try {
      setOnlineLoading(true);
      setIsOnline(checked);
      await setWorkerOnlineStatus(workerId, checked);
    } catch (err) {
      setIsOnline((prev) => !checked);
      alert("Failed to update online status");
    } finally {
      setOnlineLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updatedWorker = await uploadWorkerAvatar(workerId, file);

      // Update worker state
      Object.assign(worker, updatedWorker);
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      fileInputRef.current.value = "";
    }
  }

  /* ------------------- UI ------------------- */

  const OrderCard = ({ order }) => {
    const config = statusConfig[order.status];
    const Icon = config.icon;

    return (
      <Card className="p-6 bg-white/70 backdrop-blur-xl">
        <div className="flex justify-between mb-4">
          <div className="flex gap-3">
            <img
              src={order.customerImage || "https://via.placeholder.com/80"}
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <h3>Order #{order.id}</h3>
              <p>{order.customerName}</p>
            </div>
          </div>
          <Badge className={`${config.bgColor} ${config.textColor}`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm mt-4">
          <div className="flex gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatDate(order.scheduledPickup)}
          </div>
          <div className="flex gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {order.pickupAddress}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src={
                worker.imageUrl ||
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
              }
              className="w-full h-full object-cover"
            />
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </div>

          <div>
            <h1 className="text-xl font-semibold">Worker Dashboard</h1>
            <p className="text-slate-600">Manage your orders</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="online"> {isOnline ? "Online" : "Offline"} </Label>
            <Switch
              id="online"
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              disabled={onlineLoading}
            />
          </div>

          <Button variant="outline">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white/70 backdrop-blur-xl">
          <p>Pending</p>
          <h2 className="text-2xl">{pendingOrders.length}</h2>
        </Card>
        <Card className="p-6 bg-white/70 backdrop-blur-xl">
          <p>Active</p>
          <h2 className="text-2xl">{activeOrders.length}</h2>
        </Card>
        <Card className="p-6 bg-white/70 backdrop-blur-xl">
          <p>Completed</p>
          <h2 className="text-2xl">{completedOrders.length}</h2>
        </Card>
        <Card className="p-6 bg-white/70 backdrop-blur-xl">
          <p>Revenue</p>
          <h2 className="text-2xl">₪{totalRevenue}</h2>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingOrders.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          ) : (
            <p className="text-slate-600 mt-6">No pending orders</p>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeOrders.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          ) : (
            <p className="text-slate-600 mt-6">No active orders</p>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedOrders.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedOrders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          ) : (
            <p className="text-slate-600 mt-6">No completed orders</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
