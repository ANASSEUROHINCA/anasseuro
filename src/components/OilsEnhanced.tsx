import { useState, useEffect } from "react";
import { firestoreWrapper, logActivity, getListItems } from "../lib/firebase";
import { DynamicDropdown } from "./DynamicDropdown";
import { exportOilsToCSV } from "../lib/csvExport";
import { ListManager } from "./ListManager";
import { Plus, Trash2, Edit2, X, Download, Search, Settings } from "lucide-react";
import {
  DateFilter,
  filterListByDate,
  FilterType,
} from "./DateFilter";

interface OilItem {
  id: string;
  type: string;
  qty: number;
  unit: string;
  alert: number;
  date: string;
  time: string;
  user: string;
  magasinier: string;
}

export function Oils({ currentUser }: { currentUser: string }) {
  const [items, setItems] = useState<OilItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<OilItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [magasiniers, setMagasiniers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: "",
    qty: "",
    unit: "L",
    alert: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    magasinier: currentUser,
  });
  const [filter, setFilter] = useState<{
    type: FilterType;
    start?: string;
    end?: string;
  }>({ type: "all" });

  useEffect(() => {
    loadItems();
    loadMagasiniers();
  }, []);

  useEffect(() => {
    let filtered = filterListByDate(items, filter);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [items, filter, searchQuery]);

  async function loadItems() {
    try {
      const data = (await firestoreWrapper.getCollection(
        "eurohinca_inventory_oil",
      )) as OilItem[];
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMagasiniers() {
    const data = await getListItems("list_magasiniers");
    setMagasiniers(data);
  }

  function resetForm() {
    setFormData({
      type: "",
      qty: "",
      unit: "L",
      alert: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      magasinier: currentUser,
    });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.type || !formData.qty || !formData.alert)
      return;
    setLoading(true);
    try {
      const data = {
        type: formData.type,
        qty: parseFloat(formData.qty),
        unit: formData.unit,
        alert: parseFloat(formData.alert),
        date: formData.date,
        time: formData.time,
        user: currentUser,
        magasinier: formData.magasinier,
      };
      if (editingId) {
        await firestoreWrapper.updateDoc(
          "eurohinca_inventory_oil",
          editingId,
          data,
        );
        await logActivity(
          "Modification",
          `Huile modifiée: ${formData.type}`,
          currentUser,
        );
      } else {
        await firestoreWrapper.addDoc(
          "eurohinca_inventory_oil",
          data,
        );
        await logActivity(
          "Ajout",
          `Huile ajoutée: ${formData.type} - ${formData.qty}${formData.unit}`,
          currentUser,
        );
      }
      await loadItems();
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, type: string) {
    if (!confirm(`Supprimer ${type} ?`)) return;
    try {
      await firestoreWrapper.deleteDoc(
        "eurohinca_inventory_oil",
        id,
      );
      await logActivity(
        "Suppression",
        `Huile supprimée: ${type}`,
        currentUser,
      );
      await loadItems();
    } catch (error) {
      console.error(error);
    }
  }

  function handleEdit(item: OilItem) {
    setFormData({
      type: item.type,
      qty: item.qty.toString(),
      unit: item.unit,
      alert: item.alert.toString(),
      date: item.date || new Date().toISOString().split("T")[0],
      time: item.time || new Date().toTimeString().slice(0, 5),
      magasinier: item.magasinier || currentUser,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-slate-900 text-xl font-bold">
            Huiles & Graisses
          </h2>
          <p className="text-slate-600">Gestion des lubrifiants</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <DateFilter onFilterChange={setFilter} />
          <div className="flex gap-2">
            <button
              onClick={() => setShowTypeManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" /> Types
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
            <button
              onClick={() => exportOilsToCSV(filteredItems)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-bold">
                {editingId ? "Modifier" : "Ajouter"}
              </h3>
              <button onClick={resetForm}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <DynamicDropdown
                listName="list_oils"
                value={formData.type}
                onChange={(v) => setFormData({ ...formData, type: v })}
                placeholder="-- Type d'huile --"
                label="Type *"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.qty}
                    onChange={(e) =>
                      setFormData({ ...formData, qty: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Unité *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="L">L</option>
                    <option value="KG">KG</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Alerte *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.alert}
                  onChange={(e) =>
                    setFormData({ ...formData, alert: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Heure *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">
                  Magasinier *
                </label>
                <select
                  value={formData.magasinier}
                  onChange={(e) =>
                    setFormData({ ...formData, magasinier: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choisir --</option>
                  {magasiniers.map((mag) => (
                    <option key={mag} value={mag}>
                      {mag}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-slate-300 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? "..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-slate-700">Type</th>
                <th className="px-6 py-3 text-left text-slate-700">Quantité</th>
                <th className="px-6 py-3 text-left text-slate-700">Unité</th>
                <th className="px-6 py-3 text-left text-slate-700">Alerte</th>
                <th className="px-6 py-3 text-left text-slate-700">Date</th>
                <th className="px-6 py-3 text-left text-slate-700">Heure</th>
                <th className="px-6 py-3 text-left text-slate-700">Magasinier</th>
                <th className="px-6 py-3 text-right text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.qty <= item.alert
                        ? "bg-red-50"
                        : "hover:bg-slate-50"
                    }
                  >
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{item.qty}</td>
                    <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                    <td className="px-6 py-4 text-slate-600">{item.alert}</td>
                    <td className="px-6 py-4 text-slate-600">{item.date}</td>
                    <td className="px-6 py-4 text-slate-600">{item.time || "-"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.magasinier || item.user}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.type)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Type Manager Modal */}
      {showTypeManager && (
        <ListManager
          listName="list_oils"
          title="Gérer les Types d'Huiles"
          onClose={() => setShowTypeManager(false)}
        />
      )}
    </div>
  );
}
