"use client";

import { useState, useEffect, useRef } from "react";
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

import {
  getWorker,
  getWorkerOrders,
  setWorkerOnlineStatus,
  uploadWorkerAvatar,
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

export function WorkerDashboard({ onNavigateToCustomerDashboard }) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("pending");
  const [worker, setWorker] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // TODO: later replace with real logged-in worker id from auth
  const workerId = 1;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        let workerData;
        let ordersData;

        try {
          // Try to load worker + orders
          [workerData, ordersData] = await Promise.all([
            getWorker(workerId),
            getWorkerOrders(workerId),
          ]);
        } catch (err) {
          console.error("Error while fetching worker:", err);

          // Try to detect 404 from different HTTP client shapes
          const status =
            err?.status ||
            err?.response?.status ||
            err?.response?.data?.statusCode;

          if (status === 404) {
            // Not a worker → go to worker signup page
            router.push("/worker/signup"); // change path if your route is different
            return;
          }

          throw err;
        }

        // If API returned null/undefined instead of throwing
        if (!workerData) {
          router.push("/worker/signup");
          return;
        }

        setWorker(workerData);
        setOrders(ordersData || []);
        setIsOnline(!!workerData?.isOnline);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load worker dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workerId, router]);

  const pendingOrders = orders.filter((o) => o.status === "REQUESTED");
  const activeOrders = orders.filter((o) =>
    ["CONFIRMED", "IN_PROGRESS"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.amount || 0),
    0
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  async function handleToggleOnline(checked) {
    setIsOnline(checked);
    setOnlineLoading(true);
    try {
      await setWorkerOnlineStatus(workerId, checked);
    } catch (err) {
      console.error(err);
      setIsOnline((prev) => !checked);
      alert("Failed to update online status");
    } finally {
      setOnlineLoading(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updatedWorker = await uploadWorkerAvatar(workerId, file);
      setWorker((prev) => ({
        ...(prev || {}),
        ...updatedWorker,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload profile picture");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const OrderCard = ({ order }) => {
    const config = statusConfig[order.status] || statusConfig.REQUESTED;
    const StatusIcon = config.icon;

    const customerName =
      order.customerName || order.customer?.name || "Customer";
    const customerImage =
      order.customerImage ||
      order.customer?.avatarUrl ||
      "https://via.placeholder.com/80";
    const customerPhone = order.customerPhone || order.customer?.phone || "N/A";

    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 hover:shadow-lg transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <img
                src={customerImage}
                alt={customerName}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-slate-800">Order #{order.id}</h3>
                <p className="text-slate-600">{customerName}</p>
                <div className="flex items-center gap-1 mt-1 text-slate-500">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{customerPhone}</span>
                </div>
              </div>
            </div>
            <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-blue-900">{order.notes}</p>
            </div>
          )}

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
              <Badge variant="outline" className="border-slate-300">
                {order.paymentMethod}
              </Badge>
            </div>
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="text-slate-800">₪{order.amount}</p>
            </div>
          </div>

          {/* Schedule & Address */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
              <div className="flex-1">
                <p className="text-slate-500">Pickup</p>
                <p className="text-slate-800">
                  {formatDate(order.scheduledPickup)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
              <div className="flex-1">
                <p className="text-slate-500">Dropoff</p>
                <p className="text-slate-800">
                  {formatDate(order.scheduledDropoff)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
              <div className="flex-1">
                <p className="text-slate-500">Address</p>
                <p className="text-slate-800">{order.pickupAddress}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {order.status === "REQUESTED" && (
              <>
                <Button className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] hover:from-[#26c6da] hover:to-[#00acc1] text-white rounded-xl">
                  Accept
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  Decline
                </Button>
              </>
            )}
            {order.status === "CONFIRMED" && (
              <Button className="w-full bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] hover:from-[#26c6da] hover:to-[#00acc1] text-white rounded-xl">
                Start Work
              </Button>
            )}
            {order.status === "IN_PROGRESS" && (
              <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl">
                Mark Complete
              </Button>
            )}
            {order.status === "COMPLETED" && (
              <Button
                variant="outline"
                className="w-full border-slate-200 hover:bg-white/80 rounded-xl"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  /* ---------- RENDER ---------- */

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading worker dashboard…</p>
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

  // If somehow worker is missing but we're still on this page
  if (!worker) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-600">Redirecting to worker signup…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Clickable avatar + hidden file input */}
          <div
            className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src={
                worker?.imageUrl ||
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
              }
              alt={`${worker?.firstName || ""} ${worker?.lastName || ""}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white">
              Change photo
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <h1 className="text-slate-800">Worker Dashboard</h1>
            <p className="text-slate-600">Manage your service requests</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Online Status Toggle */}
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2">
            <Label
              htmlFor="online-status"
              className="text-slate-700 cursor-pointer"
            >
              {isOnline ? "Online" : "Offline"}
            </Label>
            <Switch
              id="online-status"
              checked={isOnline}
              disabled={onlineLoading}
              onCheckedChange={handleToggleOnline}
            />
          </div>
          {onNavigateToCustomerDashboard && (
            <Button
              onClick={onNavigateToCustomerDashboard}
              variant="outline"
              className="border-slate-200 hover:bg-white/80 rounded-xl"
            >
              <User className="w-4 h-4 mr-2" />
              Customer View
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

      {/* Profile Summary Card */}
      <Card className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] border-0 text-white mb-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
        <div className="p-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 fill-white" />
                <h3>{worker?.rating ?? 0}</h3>
              </div>
              <p className="text-white/90">
                {(worker?.reviewCount ?? 0) + " reviews"}
              </p>
            </div>
            <div>
              <h3 className="mb-1">₪{worker?.pricePerWash ?? 0}</h3>
              <p className="text-white/90">Price per wash</p>
            </div>
            <div>
              <h3 className="mb-1">{worker?.maxOrdersPerDay ?? 0}</h3>
              <p className="text-white/90">Max orders/day</p>
            </div>
            <div>
              <h3 className="mb-1">{worker?.maxItemsPerWash ?? 0}</h3>
              <p className="text-white/90">Max items/wash</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/70 backdrop-blur-xl border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 mb-1">Pending</p>
                <h2 className="text-slate-800">{pendingOrders.length}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 mb-1">Active</p>
                <h2 className="text-slate-800">{activeOrders.length}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 mb-1">Completed</p>
                <h2 className="text-slate-800">{completedOrders.length}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/20 to-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 mb-1">Revenue</p>
                <h2 className="text-slate-800">₪{totalRevenue}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4dd0e1]/20 to-[#26c6da]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#26c6da]" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/70 backdrop-blur-xl border border-white/20 mb-6">
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

        <TabsContent value="pending" className="mt-0">
          {pendingOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card className="bg-white/70 backdrop-blur-xl border-white/20">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-800 mb-2">No pending requests</h3>
                <p className="text-slate-600">
                  New order requests will appear here
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card className="bg-white/70 backdrop-blur-xl border-white/20">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-800 mb-2">No active orders</h3>
                <p className="text-slate-600">
                  Orders you accept will appear here
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card className="bg-white/70 backdrop-blur-xl border-white/20">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-800 mb-2">No completed orders yet</h3>
                <p className="text-slate-600">
                  Completed orders will appear here
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
