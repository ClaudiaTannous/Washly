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
  // ---------------- ORIGINAL WORKING LOGIC RESTORED ----------------
  const [activeTab, setActiveTab] = useState("active");

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isWorker, setIsWorker] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!userId) return;

    async function load() {
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
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  // ---------------- GROUP ORDERS LOGIC (UNCHANGED) ----------------
  const activeOrders = orders.filter((o) =>
    ["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const cancelledOrders = orders.filter((o) =>
    ["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"].includes(o.status)
  );

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

  // ---------------- ORDER CARD (DESIGN UPGRADED) ----------------
  const OrderCard = ({ order }) => {
    const config = statusConfig[order.status];
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

            {order.status === "COMPLETED" && (
              <Button className="flex-1 bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl hover:opacity-90">
                <Star className="w-4 h-4 mr-1" />
                Rate
              </Button>
            )}
          </div>
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

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (isWorker) {
                  window.location.href = "/worker"; // User is already a worker
                } else {
                  window.location.href = "/worker/signup"; // Not a worker → go sign up
                }
              }}
              variant="outline"
              className="rounded-xl border-slate-300 hover:bg-white/70"
            >
              <TrendingUp className="w-4 h-4 text-cyan-600 mr-2" />
              {isWorker ? "Worker Dashboard" : "Become a Worker"}
            </Button>

            <Button variant="outline" className="rounded-xl border-slate-300">
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
          <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"></div>

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
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No active orders"
                description="Start by finding a worker in your area"
                buttonLabel="Find Workers"
                onClick={onNavigateToSearch}
              />
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
                  <OrderCard key={o.id} order={o} />
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
