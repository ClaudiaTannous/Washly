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
  Settings,
  LogOut,
  TrendingUp,
  MapPin,
  Star,
  User,
  MessageCircle,
  Bell,
} from "lucide-react";

import {
  getCurrentUser,
  getWorker,
  getWorkerOrders,
  getWorkerRatings,
  setWorkerOnlineStatus,
  uploadWorkerAvatar,
  getWorkerServices,
  getWorkerBusinessHours,
  acceptOrder,
  startOrder,
  completeOrder,
  cancelOrderByWorker,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../lib/apiClient";

import { RatingSection } from "./RatingSection";

const BACKEND_URL = "http://localhost:5000";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig = {
  REQUESTED: {
    label: "Requested",
    icon: Clock,
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle,
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Package,
    bg: "bg-cyan-100",
    text: "text-cyan-700",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    bg: "bg-green-100",
    text: "text-green-700",
  },
  CANCELLED_BY_WORKER: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
  },
  CANCELLED_BY_CUSTOMER: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
  },
};

export function WorkerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);

  const [orderActionLoadingId, setOrderActionLoadingId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  /* ---------------- LOAD NOTIFICATIONS ---------------- */
  async function loadNotifications(userId) {
    try {
      setLoadingNotifications(true);

      const data = await getUserNotifications(userId);

      setNotifications(Array.isArray(data) ? data : (data.notifications ?? []));
    } catch (err) {
      console.error("LOAD NOTIFICATIONS ERROR:", err);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const currentUser = await getCurrentUser();
        console.log("USER OBJECT:", currentUser);

        if (!currentUser?.id) {
          router.replace("/signin");
          return;
        }

        if (currentUser.role !== "worker") {
          router.replace("/worker/signup");
          return;
        }

        setUser(currentUser);

        const workerData = await getWorker(
          currentUser.worker_id ?? currentUser.id,
        );
        const workerOrders = await getWorkerOrders(workerData.id);

        const ratingsResponse = await getWorkerRatings(workerData.id);

        const ratings = Array.isArray(ratingsResponse)
          ? ratingsResponse
          : (ratingsResponse.ratings ?? []);

        const workerServices = await getWorkerServices(workerData.id);
        const hours = await getWorkerBusinessHours(workerData.id);

        await loadNotifications(currentUser.id);

        console.log("WORKER SERVICES:", workerServices);
        console.log("WORKER RATINGS:", ratings);

        /* ---------------- CUSTOMER-BASED RATING STATS ---------------- */
        const total = ratings.length;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        ratings.forEach((r) => {
          const score = Number(r.score);

          if (score >= 1 && score <= 5) {
            distribution[score]++;
          }
        });

        const average =
          total === 0
            ? 0
            : ratings.reduce((sum, r) => sum + Number(r.score || 0), 0) / total;

        setRatingStats({
          average,
          total,
          distribution,
        });

        setReviews(
          ratings.map((r) => ({
            id: r.id,
            customer_name: r.Rater
              ? `${r.Rater.first_name} ${r.Rater.last_name}`
              : "Customer",
            rating: r.score,
            comment: r.comment || "No comment",
            date: r.created_at,
          })),
        );

        setWorker(workerData);
        setOrders(workerOrders || []);
        setServices(workerServices || []);
        setBusinessHours(hours || []);
      } catch (err) {
        console.error("LOAD ERROR:", err);
        router.replace("/worker/signup");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  /* ---------------- NORMALIZE ORDERS ---------------- */
  const normalizedOrders = orders.map((o) => ({
    ...o,
    pickupAddress: `${o.pickup_city}, ${o.pickup_street} ${
      o.pickup_building ?? ""
    }`,
    customerName: o.Customer
      ? `${o.Customer.first_name} ${o.Customer.last_name}`
      : "Customer",
  }));

  const pending = normalizedOrders.filter((o) => o.status === "REQUESTED");

  const active = normalizedOrders.filter((o) =>
    ["CONFIRMED", "IN_PROGRESS"].includes(o.status),
  );

  const completed = normalizedOrders.filter((o) => o.status === "COMPLETED");

  const cancelled = normalizedOrders.filter((o) =>
    ["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"].includes(o.status),
  );

  const revenue = completed.reduce((s, o) => s + (o.amount ?? 0), 0);

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  function formatDate(dateString) {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* ---------------- ACTIONS ---------------- */
  async function toggleOnline(checked) {
    try {
      setOnlineLoading(true);
      await setWorkerOnlineStatus(worker.id, checked);
      setWorker((w) => ({ ...w, is_online: checked }));
    } catch (err) {
      console.error("ONLINE STATUS ERROR:", err);
      alert("Could not update online status.");
    } finally {
      setOnlineLoading(false);
    }
  }

  async function uploadAvatar(e) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      await uploadWorkerAvatar(worker.id, file);
      window.location.reload();
    } catch (err) {
      console.error("UPLOAD AVATAR ERROR:", err);
      alert("Could not upload avatar.");
    }
  }

  async function handleOrderAction(orderId, action) {
    try {
      setOrderActionLoadingId(orderId);

      let updatedOrder;

      if (action === "accept") {
        updatedOrder = await acceptOrder(orderId);
      }

      if (action === "start") {
        updatedOrder = await startOrder(orderId);
      }

      if (action === "complete") {
        updatedOrder = await completeOrder(orderId);
      }

      if (action === "cancel") {
        updatedOrder = await cancelOrderByWorker(orderId);
      }

      const finalUpdatedOrder = updatedOrder?.data ?? updatedOrder;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, ...finalUpdatedOrder } : order,
        ),
      );

      if (user?.id) {
        await loadNotifications(user.id);
      }
    } catch (err) {
      console.error("ORDER ACTION ERROR:", err);
      alert("Could not update the order status.");
    } finally {
      setOrderActionLoadingId(null);
    }
  }

  async function handleMarkNotificationAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );
    } catch (err) {
      console.error("MARK NOTIFICATION READ ERROR:", err);
    }
  }

  async function handleMarkAllNotificationsAsRead() {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead(user.id);

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
      );
    } catch (err) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/70 animate-pulse" />
              <div>
                <div className="h-5 w-48 bg-white/70 rounded-full animate-pulse mb-3" />
                <div className="h-4 w-64 bg-white/70 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 rounded-2xl shadow-md border border-slate-100 mb-10 p-6 animate-pulse">
            <div className="h-6 w-40 bg-slate-100 rounded-full mb-4" />
            <div className="h-4 w-full bg-slate-100 rounded-full mb-2" />
            <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- ORDER CARD ---------------- */
  const OrderCard = ({ order }) => {
    const cfg = statusConfig[order.status] ?? statusConfig.REQUESTED;
    const Icon = cfg.icon;
    const isActionLoading = orderActionLoadingId === order.id;

    return (
      <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="font-medium text-slate-800">Order #{order.id}</h3>
            <p className="text-sm text-slate-600">{order.customerName}</p>
          </div>

          <Badge className={`${cfg.bg} ${cfg.text}`}>
            <Icon className="w-3 h-3 mr-1" />
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatDate(order.scheduled_pickup)}
          </div>

          <div className="flex gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {order.pickupAddress}
          </div>

          <div className="font-semibold text-slate-800">₪{order.amount}</div>
        </div>

        {order.status === "REQUESTED" && (
          <div className="space-y-2">
            <Button
              disabled={isActionLoading}
              onClick={() => handleOrderAction(order.id, "accept")}
              className="w-full bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] hover:from-[#26c6da] hover:to-[#00acc1] text-white rounded-xl"
            >
              {isActionLoading ? "Accepting..." : "Accept Order"}
            </Button>

            <Button
              disabled={isActionLoading}
              variant="outline"
              onClick={() => handleOrderAction(order.id, "cancel")}
              className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancel Order
            </Button>
          </div>
        )}

        {order.status === "CONFIRMED" && (
          <div className="space-y-2">
            <Button
              disabled={isActionLoading}
              onClick={() => handleOrderAction(order.id, "start")}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
            >
              {isActionLoading ? "Starting..." : "Start Work"}
            </Button>

            <Button
              disabled={isActionLoading}
              variant="outline"
              onClick={() => handleOrderAction(order.id, "cancel")}
              className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancel Order
            </Button>
          </div>
        )}

        {order.status === "IN_PROGRESS" && (
          <Button
            disabled={isActionLoading}
            onClick={() => handleOrderAction(order.id, "complete")}
            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl"
          >
            {isActionLoading ? "Completing..." : "Mark Complete"}
          </Button>
        )}

        {order.status === "COMPLETED" && (
          <Button variant="outline" className="w-full rounded-xl">
            View Details
          </Button>
        )}

        {["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"].includes(
          order.status,
        ) && (
          <Button variant="outline" disabled className="w-full rounded-xl">
            Order Cancelled
          </Button>
        )}
      </Card>
    );
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden relative group">
              <img
                src={
                  worker?.image_url
                    ? `${BACKEND_URL}${worker.image_url}`
                    : "/default-avatar.png"
                }
                alt="Worker avatar"
                className="w-full h-full object-cover cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              />

              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs pointer-events-none transition">
                Change
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadAvatar}
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Worker Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Manage your orders and customer reviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* NOTIFICATIONS BUTTON */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="rounded-xl border-slate-300 bg-white"
              >
                <Bell className="w-5 h-5" />

                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-red-500 px-1 text-xs text-white flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">
                      Notifications
                    </h3>

                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsAsRead}
                        className="text-xs text-cyan-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {loadingNotifications ? (
                    <p className="text-sm text-slate-500">
                      Loading notifications...
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No notifications yet.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() =>
                            handleMarkNotificationAsRead(notification.id)
                          }
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            notification.is_read
                              ? "border-slate-100 bg-slate-50"
                              : "border-cyan-100 bg-cyan-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {notification.title}
                            </p>

                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-600">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {formatDate(notification.created_at)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100">
              <Label>{worker.is_online ? "Online" : "Offline"}</Label>
              <Switch
                checked={worker.is_online}
                onCheckedChange={toggleOnline}
                disabled={onlineLoading}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => router.push("/worker/settings")}
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl shadow-lg hover:opacity-90"
              onClick={() => router.push("/ai-assistant")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                document.cookie = "token=; Max-Age=0";
                localStorage.clear();
                router.push("/signin");
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* WORKER DESCRIPTION */}
        <Card className="bg-white rounded-2xl shadow-md border border-slate-100 mb-10">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>

              <h2 className="text-xl font-semibold text-slate-800">About Me</h2>
            </div>

            {worker.description ? (
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {worker.description}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No description provided yet.
              </p>
            )}
          </div>
        </Card>

        {/* PROFILE SUMMARY */}
        <Card className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-2xl mb-10 shadow-md">
          <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
            <Summary
              label="Customer Rating"
              value={ratingStats?.average.toFixed(1) ?? "0.0"}
              icon={Star}
            />

            <Summary
              label="Customer Reviews"
              value={ratingStats?.total ?? 0}
              icon={User}
            />

            <Summary
              label="Price per wash"
              value={`₪${worker.price_per_wash ?? 0}`}
            />

            <Summary
              label="Max orders/day"
              value={worker.max_orders_per_day ?? 0}
            />

            <Summary
              label="Min notice"
              value={`${worker.min_notice_minutes ?? 0} min`}
              icon={Clock}
            />
          </div>
        </Card>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Stat
            label="Pending"
            value={pending.length}
            icon={Clock}
            color="blue"
          />

          <Stat
            label="Active"
            value={active.length}
            icon={Package}
            color="yellow"
          />

          <Stat
            label="Completed"
            value={completed.length}
            icon={CheckCircle}
            color="green"
          />

          <Stat
            label="Revenue"
            value={`₪${revenue}`}
            icon={TrendingUp}
            color="cyan"
          />
        </div>

        {/* TABS */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-6 bg-white border border-slate-100 rounded-xl">
            <TabsTrigger value="pending">
              Pending ({pending.length})
            </TabsTrigger>

            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>

            <TabsTrigger value="completed">
              Completed ({completed.length})
            </TabsTrigger>

            <TabsTrigger value="cancelled">
              Cancelled ({cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Orders orders={pending} Card={OrderCard} />
          </TabsContent>

          <TabsContent value="active">
            <Orders orders={active} Card={OrderCard} />
          </TabsContent>

          <TabsContent value="completed">
            <Orders orders={completed} Card={OrderCard} />
          </TabsContent>

          <TabsContent value="cancelled">
            <Orders orders={cancelled} Card={OrderCard} />
          </TabsContent>
        </Tabs>

        {/* BUSINESS HOURS + SERVICES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 mb-10">
          {/* BUSINESS HOURS */}
          <Card className="bg-white rounded-2xl shadow-md border border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-semibold text-slate-800">
                  Business Hours
                </h2>
              </div>

              {businessHours.length === 0 ? (
                <p className="text-sm text-slate-500">No hours defined</p>
              ) : (
                <div className="space-y-3">
                  {businessHours.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-slate-700 font-medium">
                        {DAY_NAMES[h.day_of_week]}
                      </span>

                      <span className="text-slate-600">
                        {h.start_hhmm} – {h.end_hhmm}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* SERVICES OFFERED */}
          <Card className="bg-white rounded-2xl shadow-md border border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-semibold text-slate-800">
                  Services Offered
                </h2>
              </div>

              {services.length === 0 ? (
                <p className="text-sm text-slate-500">No services configured</p>
              ) : (
                <div className="space-y-4">
                  {services.map((s) => (
                    <div
                      key={s.service_code}
                      className="p-4 bg-gradient-to-r from-[#e0f7fa] to-white rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium text-slate-800">
                        {s.Service?.display_name}
                      </div>

                      {s.Service?.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {s.Service.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {ratingStats && (
          <div className="mt-16 pt-10 border-t border-slate-200">
            <RatingSection stats={ratingStats} reviews={reviews} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */
function Orders({ orders, Card }) {
  if (!orders.length) {
    return <p className="text-slate-600">No orders</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((o) => (
        <Card key={o.id} order={o} />
      ))}
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    cyan: "bg-cyan-100 text-cyan-600",
  };

  return (
    <Card className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm">{label}</p>
          <h2 className="text-2xl font-semibold text-slate-800">{value}</h2>
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}

function Summary({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-5 h-5" />}
        <h3 className="text-lg font-semibold">{value}</h3>
      </div>

      <p className="text-white/90">{label}</p>
    </div>
  );
}
