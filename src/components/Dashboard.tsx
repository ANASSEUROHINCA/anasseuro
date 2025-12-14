import { useState, useEffect } from "react";
import {
  firestoreWrapper,
  getDieselStock,
} from "../lib/firebase";
import {
  Droplet,
  Beaker,
  Package,
  Fuel,
  AlertTriangle,
  TrendingUp,
  Container,
} from "lucide-react";
import {
  DateFilter,
  filterListByDate,
  FilterType,
} from "./DateFilter";

interface DashboardProps {
  currentUser: string;
  onNavigate: (
    tab:
      | "dashboard"
      | "oils"
      | "chemicals"
      | "parts"
      | "output"
      | "diesel"
      | "history"
      | "lowstock"
      | "conteneur",
  ) => void;
}

export function Dashboard({
  currentUser,
  onNavigate,
}: DashboardProps) {
  const [rawStats, setRawStats] = useState<any>({
    oils: [],
    chemicals: [],
    parts: [],
    activities: [],
    dieselStock: 0,
  });
  const [displayStats, setDisplayStats] = useState({
    oilsCount: 0,
    chemicalsCount: 0,
    partsCount: 0,
    dieselStock: 0,
    lowStockItems: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type: FilterType;
    start?: string;
    end?: string;
  }>({ type: "all" });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply filters locally when filter state changes
    if (!loading) calculateStats();
  }, [filter, rawStats]);

  async function loadData() {
    setLoading(true);
    try {
      const [oils, chemicals, parts, activities, dieselStock] =
        await Promise.all([
          firestoreWrapper.getCollection(
            "eurohinca_inventory_oil",
          ),
          firestoreWrapper.getCollection(
            "eurohinca_inventory_ben",
          ),
          firestoreWrapper.getCollection(
            "eurohinca_inventory_stock",
          ),
          firestoreWrapper.getCollection(
            "eurohinca_log_activity",
          ),
          getDieselStock(),
        ]);

      setRawStats({
        oils,
        chemicals,
        parts,
        activities,
        dieselStock,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats() {
    // Filter lists based on date
    const filteredOils = filterListByDate(
      rawStats.oils,
      filter,
    );
    const filteredChemicals = filterListByDate(
      rawStats.chemicals,
      filter,
    );
    const filteredParts = filterListByDate(
      rawStats.parts,
      filter,
    );
    const filteredActivities = filterListByDate(
      rawStats.activities,
      filter,
    );

    // Count low stock items (using filtered lists)
    let lowStockCount = 0;
    [
      ...filteredOils,
      ...filteredChemicals,
      ...filteredParts,
    ].forEach((item: any) => {
      if (item.qty <= item.alert) lowStockCount++;
    });

    setDisplayStats({
      oilsCount: filteredOils.length,
      chemicalsCount: filteredChemicals.length,
      partsCount: filteredParts.length,
      dieselStock: rawStats.dieselStock, // Global stock is usually not filtered by date
      lowStockItems: lowStockCount,
      recentActivities: filteredActivities.length,
    });
  }

  const statCards = [
    {
      title: "Huiles & Graisses",
      value: displayStats.oilsCount,
      icon: Droplet,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Bentonite & Chimie",
      value: displayStats.chemicalsCount,
      icon: Beaker,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      title: "Stock Matériel",
      value: displayStats.partsCount,
      icon: Package,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Stock Gasoil (L)",
      value: `${displayStats.dieselStock.toLocaleString()}`,
      icon: Fuel,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
    {
      title: "Alertes Stock Bas",
      value: displayStats.lowStockItems,
      icon: AlertTriangle,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      title: "Activités Récentes",
      value: displayStats.recentActivities,
      icon: TrendingUp,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
    },
    {
      title: "Conteneurs",
      value: "N/A", // Placeholder value, replace with actual data if available
      icon: Container,
      color: "bg-gray-500",
      textColor: "text-gray-600",
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-slate-900 font-bold text-2xl">
            Tableau de Bord
          </h2>
          <p className="text-slate-600">
            Vue d&apos;ensemble du stock et des activités
          </p>
        </div>
        <DateFilter onFilterChange={setFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isLowStock = card.title === "Alertes Stock Bas";
          const isConteneur = card.title === "Conteneurs";
          return (
            <div
              key={card.title}
              onClick={() => {
                if (isLowStock && typeof card.value === "number" && card.value > 0) {
                  onNavigate("lowstock");
                } else if (isConteneur) {
                  onNavigate("conteneur");
                }
              }}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all ${
                (isLowStock && typeof card.value === "number" && card.value > 0) || isConteneur
                  ? "cursor-pointer hover:border-gray-300 ring-2 ring-transparent hover:ring-gray-100"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${card.color} bg-opacity-10`}
                >
                  <Icon
                    className={`w-6 h-6 ${card.textColor}`}
                  />
                </div>
                {filter.type !== "all" &&
                  card.title !== "Stock Gasoil (L)" &&
                  card.title !== "Conteneurs" && (
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-500">
                      Filtré
                    </span>
                  )}
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">
                {card.title}
              </h3>
              <p
                className={`text-2xl font-bold ${card.textColor}`}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}