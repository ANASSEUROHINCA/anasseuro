import { useState } from "react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Oils } from "./components/Oils";
import { Chemicals } from "./components/Chemicals";
import { SpareParts } from "./components/SpareParts";
import { OutputDelivery } from "./components/OutputDelivery";
import { DieselManagement } from "./components/DieselManagement";
import { ActivityLog } from "./components/ActivityLog";
import { LowStockView } from "./components/LowStockView";
import { ConteneurManagement } from "./components/ConteneurManagement";
import {
  LayoutDashboard,
  Droplet,
  Beaker,
  Package,
  TruckIcon,
  Fuel,
  History,
  Container,
} from "lucide-react";

type Tab =
  | "dashboard"
  | "oils"
  | "chemicals"
  | "parts"
  | "output"
  | "diesel"
  | "history"
  | "lowstock"
  | "conteneur";

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const tabs = [
    {
      id: "dashboard" as Tab,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "oils" as Tab,
      label: "Huiles & Graisses",
      icon: Droplet,
    },
    {
      id: "chemicals" as Tab,
      label: "Bentonite & Chimie",
      icon: Beaker,
    },
    {
      id: "parts" as Tab,
      label: "Stock Matériel",
      icon: Package,
    },
    {
      id: "output" as Tab,
      label: "Sortie Matériel",
      icon: TruckIcon,
    },
    {
      id: "diesel" as Tab,
      label: "Gestion Gasoil",
      icon: Fuel,
    },
    {
      id: "history" as Tab,
      label: "Historique",
      icon: History,
    },
    {
      id: "lowstock" as Tab,
      label: "Stock Faible",
      icon: Container,
    },
    {
      id: "conteneur" as Tab,
      label: "Gestion Conteneurs",
      icon: Container,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* NEW LOGO - NO DARK BACKGROUND */}
              <img
                src="https://eurohinca.com/wp-content/uploads/2024/02/EH-MA.png"
                alt="Eurohinca"
                className="h-10 w-auto object-contain"
              />
              <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>
              <p className="hidden md:block text-slate-500 text-sm font-medium">;
                Système de Gestion de Stock
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-700 font-medium bg-slate-100 px-3 py-1 rounded-full text-sm">
                {currentUser}
              </span>
              <button
                onClick={() => setCurrentUser(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-blue-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "dashboard" && (
            <Dashboard
              currentUser={currentUser}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "oils" && (
            <Oils currentUser={currentUser} />
          )}
          {activeTab === "chemicals" && (
            <Chemicals currentUser={currentUser} />
          )}
          {activeTab === "parts" && (
            <SpareParts currentUser={currentUser} />
          )}
          {activeTab === "output" && (
            <OutputDelivery currentUser={currentUser} />
          )}
          {activeTab === "diesel" && (
            <DieselManagement currentUser={currentUser} />
          )}
          {activeTab === "history" && <ActivityLog />}
          {activeTab === "lowstock" && <LowStockView />}
          {activeTab === "conteneur" && <ConteneurManagement currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
}