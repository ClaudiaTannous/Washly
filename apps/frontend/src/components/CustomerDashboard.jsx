"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Settings,
  LogOut,
  Search,
  TrendingUp,
  Droplets,
} from "lucide-react";

import {
  getCustomer,
  getCustomerOrders,
  checkIfUserIsWorker,
} from "../lib/apiClient";

const statusConfig = {
  REQUESTED: {
    label: "Requested",
    icon: Clock,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Package,
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  CANCELLED_BY_WORKER: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
  CANCELLED_BY_CUSTOMER: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
};

export function CustomerDashboard({
  onNavigateToSearch,
  onNavigateToWorkerDashboard,
  isAlsoWorker: isAlsoWorkerProp,
}) {
  const [activeTab, setActiveTab] = useState("active");
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isWorker, setIsWorker] = useState(isAlsoWorkerProp ?? false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: get this from auth / cookies later
  const userId = 1;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [customerData, ordersData, isWorkerData] = await Promise.all([
          getCustomer(userId),
          getCustomerOrders(userId),
          checkIfUserIsWorker(userId),
        ]);

        setCustomer(customerData);
        setOrders(ordersData || []);
        setIsWorker(isWorkerData?.isWorker ?? false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  // Derive groupings from real orders
  const activeOrders = orders.filter((o) =>
    ["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(o.status)
  );

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const cancelledOrders = orders.filter((o) =>
    ["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"].includes(o.status)
  );

  const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const OrderCard = ({ order }) => {
    const config = statusConfig[order.status] || statusConfig.REQUESTED;
    const StatusIcon = config.icon;

    // NOTE: adapt these fields to your real DTO
    const workerName = order.workerName || order.worker?.name || "Worker";
    const workerImage =
      order.workerImage ||
      order.worker?.avatarUrl ||
      "https://via.placeholder.com/80";

    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 hover:shadow-lg transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <img
                src={workerImage}
                alt={workerName}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-slate-800">Order #{order.id}</h3>
                <p className="text-slate-600">{workerName}</p>
              </div>
            </div>
            <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 py-4 border-y border-slate-200">
            <div>
              <p className="text-slate-500">Items</p>
              <p className="text-slate-800">{order.itemsCount} items</p>
            </div>
            <div>
              <p className="text-slate-500">Washes</p>
              <p className="text-slate-800">{order.washesCount} washes</p>
            </div>
            <div>
              <p className="text-slate-500">Payment</p>
              <p className="text-slate-800">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="text-slate-800">₪{order.amount}</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 text-slate-600">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-500">Pickup</p>
                <p className="text-slate-800">
                  {formatDate(order.scheduledPickup)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-500">Dropoff</p>
                <p className="text-slate-800">
                  {formatDate(order.scheduledDropoff)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-200 hover:bg-white/80 rounded-xl"
            >
              View Details
            </Button>
            {order.status === "COMPLETED" && (
              <Button className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] hover:from-[#26c6da] hover:to-[#00acc1] text-white rounded-xl">
                <Star className="w-4 h-4 mr-1" />
                Rate
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  /* --------- RENDER --------- */

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] flex items-center justify-center shadow-lg">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-slate-800">
              Welcome back, {customer ? customer.firstName : "..."}!
            </h1>
            <p className="text-slate-600">Manage your laundry orders</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isWorker && onNavigateToWorkerDashboard && (
            <Button
              onClick={onNavigateToWorkerDashboard}
              variant="outline"
              className="border-slate-200 hover:bg-white/80 rounded-xl"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Worker Dashboard
            </Button>
          )}
          <Button
            variant="outline"
            className="border-slate-200 hover:bg-white/80 rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            className="border-slate-200 hover:bg-white/80 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats cards, quick actions, tabs – keep exactly as you had,
          just replace mockOrders.reduce(...) with totalSpent and
          map over activeOrders / completedOrders / cancelledOrders as before */}
      {/* ... (you can keep your existing JSX here) ... */}
    </div>
  );
}
