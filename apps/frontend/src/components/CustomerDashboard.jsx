"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useRouter } from "next/navigation";

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
  Bell,
} from "lucide-react";

import {
  getCustomer,
  getCustomerOrders,
  checkIfUserIsWorker,
} from "../lib/apiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

//
// ---- STATUS CONFIG ----
//
const statusConfig = {
  REQUESTED: {
    label: "Requested",
    icon: Clock,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Package,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  CANCELLED_BY_WORKER: {
    label: "Cancelled",
    icon: XCircle,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
  CANCELLED_BY_CUSTOMER: {
    label: "Cancelled",
    icon: XCircle,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
};

export function CustomerDashboard({
  onNavigateToSearch,
  onNavigateToWorkerDashboard,
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("active");

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isWorker, setIsWorker] = useState(false);
  const [loading, setLoading] = useState(true);

  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessPopup, setReviewSuccessPopup] = useState(false);

  // NEW: notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  async function loadNotifications(currentUserId) {
    try {
      setLoadingNotifications(true);

      const res = await fetch(
        `${API_URL}/api/notifications/user/${currentUserId}`,
        {
          credentials: "include",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load notifications");
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function loadDashboard() {
    if (!userId) return;

    try {
      setLoading(true);

      const [cust, ords, workerStatus] = await Promise.all([
        getCustomer(userId),
        getCustomerOrders(userId),
        checkIfUserIsWorker(userId),
      ]);

      setCustomer(cust);
      setOrders(ords || []);
      setIsWorker(workerStatus?.isWorker || false);

      await loadNotifications(userId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const markNotificationAsRead = async (notificationId) => {
    try {
      const res = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark notification as read");
      }

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
    } catch (error) {
      console.error("Mark notification read error:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!userId) return;

    try {
      const res = await fetch(
        `${API_URL}/api/notifications/user/${userId}/read-all`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to mark all notifications as read",
        );
      }

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Mark all notifications read error:", error);
    }
  };

  // ---------------- GROUP ORDERS LOGIC ----------------
  const activeOrders = orders.filter((o) =>
    ["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(o.status),
  );

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const cancelledOrders = orders.filter((o) =>
    ["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"].includes(o.status),
  );

  const pendingTooLongOrders = orders.filter((order) => {
    if (order.status !== "REQUESTED") return false;

    const createdAt = new Date(order.created_at).getTime();
    const oneHour = 60 * 60 * 1000;

    return Date.now() - createdAt >= oneHour;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const submitReview = async (orderId) => {
    try {
      setSubmittingReview(true);

      const res = await fetch(`${API_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          score: Number(reviewScore),
          comment: reviewComment,
        }),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to submit review",
        );
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                Rating: data.rating || data,
              }
            : order,
        ),
      );

      setReviewOrderId(null);
      setReviewScore(5);
      setReviewComment("");

      setReviewSuccessPopup(true);

      setTimeout(() => {
        setReviewSuccessPopup(false);
      }, 2500);
    } catch (error) {
      console.error("Submit review error:", error);
      alert(error.message || "Something went wrong while submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getOrderMessage = (order) => {
    if (order.status === "REQUESTED") {
      return "Waiting for the worker to accept your order.";
    }

    if (order.status === "CONFIRMED") {
      return "The worker accepted your order.";
    }

    if (order.status === "IN_PROGRESS") {
      return "The worker is currently handling your laundry.";
    }

    if (order.status === "COMPLETED") {
      return "Your order is completed. You can rate the worker.";
    }

    if (order.status === "CANCELLED_BY_WORKER") {
      return "This order was cancelled by the worker.";
    }

    if (order.status === "CANCELLED_BY_CUSTOMER") {
      return "You cancelled this order.";
    }

    return "";
  };

  // ---------------- ORDER CARD ----------------
  const renderOrderCard = (order) => {
    const config = statusConfig[order.status] || statusConfig.REQUESTED;
    const StatusIcon = config.icon;

    const worker = order.Worker;
    const workerUser = worker?.user;

    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 hover:shadow-lg transition-all duration-300 rounded-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <img
                src={worker?.image_url || "/default-avatar.png"}
                className="w-12 h-12 rounded-xl object-cover shadow"
                alt="Worker"
              />

              <div>
                <h3 className="text-slate-800 font-medium">
                  Order #{order.id}
                </h3>
                <p className="text-slate-600">
                  {workerUser
                    ? `${workerUser.first_name} ${workerUser.last_name}`
                    : "Worker"}
                </p>
              </div>
            </div>

            <Badge
              className={`${config.bgColor} ${config.textColor} rounded-lg px-3 py-1 border-none`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {getOrderMessage(order)}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 py-4 border-y border-slate-200">
            <OrderStat label="Items" value={order.items_count ?? 0} />
            <OrderStat label="Washes" value={order.washes_count ?? 0} />
            <OrderStat label="Payment" value={order.payment_method} />
            <OrderStat label="Amount" value={`₪${order.amount}`} />
          </div>

          {/* Dates */}
          <OrderDate
            label="Pickup"
            value={formatDate(order.scheduled_pickup)}
          />
          <OrderDate
            label="Dropoff"
            value={formatDate(order.scheduled_dropoff)}
          />

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-slate-300 hover:bg-white/70"
            >
              View Details
            </Button>

            {order.status === "COMPLETED" && !order.Rating && (
              <Button
                onClick={() => {
                  setReviewOrderId(order.id);
                  setReviewScore(5);
                  setReviewComment("");
                }}
                className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl hover:opacity-90"
              >
                <Star className="w-4 h-4 mr-1" />
                Rate
              </Button>
            )}

            {order.status === "COMPLETED" && order.Rating && (
              <Button
                disabled
                className="flex-1 bg-slate-300 text-white rounded-xl cursor-not-allowed"
              >
                <Star className="w-4 h-4 mr-1" />
                Rated
              </Button>
            )}
          </div>

          {reviewOrderId === order.id && (
            <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <h4 className="mb-3 font-medium text-slate-800">
                Rate this worker
              </h4>

              <label className="mb-1 block text-sm text-slate-600">Score</label>

              <select
                value={reviewScore}
                onChange={(e) => setReviewScore(e.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-800"
              >
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>

              <label className="mb-1 block text-sm text-slate-600">
                Comment
              </label>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your experience..."
                className="mb-3 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-800"
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => submitReview(order.id)}
                  disabled={submittingReview}
                  className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReviewOrderId(null);
                    setReviewScore(5);
                    setReviewComment("");
                  }}
                  className="flex-1 rounded-xl border-slate-300 hover:bg-white/70"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading your dashboard…
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
      {reviewSuccessPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm rounded-3xl border border-cyan-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              Review submitted
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Thank you for rating this worker.
            </p>

            <Button
              onClick={() => setReviewSuccessPopup(false)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white hover:opacity-90"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] flex items-center justify-center shadow-lg">
              <Droplets className="w-7 h-7 text-white" />
            </div>

            <div>
              <h1 className="text-xl text-slate-800 font-semibold">
                Welcome back, {customer?.first_name}!
              </h1>
              <p className="text-slate-600">Manage your laundry orders</p>
            </div>
          </div>

          <div className="flex gap-2 relative">
            {/* NEW: Notifications button */}
            <div className="relative">
              <Button
                variant="outline"
                className="rounded-xl border-slate-300 bg-white/70"
                onClick={() => setShowNotifications((prev) => !prev)}
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
                        onClick={markAllNotificationsAsRead}
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
                            markNotificationAsRead(notification.id)
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

            <Button
              onClick={() => {
                if (isWorker) {
                  window.location.href = "/worker";
                } else {
                  window.location.href = "/worker/signup";
                }
              }}
              variant="outline"
              className="rounded-xl border-slate-300 hover:bg-white/70"
            >
              <TrendingUp className="w-4 h-4 text-cyan-600 mr-2" />
              {isWorker ? "Worker Dashboard" : "Become a Worker"}
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-slate-300"
              onClick={() => router.push("/customer/settings")}
            >
              <Settings className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              className="rounded-xl border-slate-300"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/signin";
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ONE HOUR WARNING */}
        {pendingTooLongOrders.length > 0 && (
          <Card className="mb-6 rounded-2xl border-orange-200 bg-orange-50 p-4 text-orange-800">
            <h3 className="font-semibold">Order not accepted yet</h3>
            <p className="mt-1 text-sm">
              You have {pendingTooLongOrders.length} order
              {pendingTooLongOrders.length === 1 ? "" : "s"} that have not been
              accepted by the worker for more than one hour.
            </p>
          </Card>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            label="Active Orders"
            value={activeOrders.length}
            icon={Package}
            bg="bg-yellow-100"
            iconColor="text-yellow-600"
          />

          <StatsCard
            label="Completed"
            value={completedOrders.length}
            icon={CheckCircle}
            bg="bg-green-100"
            iconColor="text-green-600"
          />

          <StatsCard
            label="Total Spent"
            value={`₪${totalSpent}`}
            icon={TrendingUp}
            bg="bg-cyan-100"
            iconColor="text-[#26c6da]"
          />
        </div>

        {/* CTA SECTION */}
        <Card className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white p-6 mb-8 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Need laundry service?</h3>
              <p className="text-white/90">
                Find and book professional workers
              </p>
            </div>

            <Button
              onClick={onNavigateToSearch}
              className="bg-white text-[#26c6da] rounded-xl shadow-lg hover:bg-white/90"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Workers
            </Button>
          </div>
        </Card>

        {/* ORDER TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl mb-6">
            <TabsTrigger value="active">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeOrders.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOrders.map((o) => (
                  <div key={o.id}>{renderOrderCard(o)}</div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No active orders"
                description="Start by finding a worker in your area"
              />
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedOrders.map((o) => (
                  <div key={o.id}>{renderOrderCard(o)}</div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No completed orders"
                description="Your completed orders will appear here"
              />
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledOrders.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cancelledOrders.map((o) => (
                  <div key={o.id}>{renderOrderCard(o)}</div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={XCircle}
                title="No cancelled orders"
                description="You have no cancelled orders"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

//
// ---- SMALL UI SUBCOMPONENTS ----
//
function OrderStat({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

function OrderDate({ label, value }) {
  return (
    <div className="flex items-start gap-2 mb-2">
      <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div>
        <p className="text-slate-500">{label}</p>
        <p className="text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, bg, iconColor }) {
  return (
    <Card className="bg-white/70 backdrop-blur-xl border-white/20 p-6 rounded-2xl shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600">{label}</p>
          <h2 className="text-2xl text-slate-800 font-semibold">{value}</h2>
        </div>

        <div
          className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description, onClick, buttonLabel }) {
  return (
    <Card className="bg-white/70 backdrop-blur-xl border-white/20 p-12 text-center rounded-2xl shadow">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>

      <h3 className="text-xl text-slate-800 font-medium mb-2">{title}</h3>
      <p className="text-slate-600 mb-4">{description}</p>

      {onClick && (
        <Button
          onClick={onClick}
          className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] rounded-xl text-white shadow px-6 py-2 hover:opacity-90"
        >
          <Search className="w-4 h-4 mr-2" />
          {buttonLabel}
        </Button>
      )}
    </Card>
  );
}
