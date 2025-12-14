import { useState, useEffect } from "react";
import { firestoreWrapper, logActivity, getListItems } from "../lib/firebase";
import { DynamicDropdown } from "./DynamicDropdown";
import { exportPartsToCSV } from "../lib/csvExport";
import { ListManager } from "./ListManager";
import { Plus, Trash2, Edit2, X, Download, Search, Settings } from "lucide-react";
import {
  DateFilter,
  filterListByDate,
  FilterType,
} from "./DateFilter";

interface PartItem {
  id: string;
  des: string;
  cat: string;
  qty: number;
  loc: string;
  alert: number;
  date: string;
  time: string;
  user: string;
  magasinier: string;
}

export function SpareParts({
  currentUser,
}: {
  currentUser: string;
}) {
  const [items, setItems] = useState<PartItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showEmplacementManager, setShowEmplacementManager] = useState(false);
  const [magasiniers, setMagasiniers] = useState<string[]>([]);
  const [emplacements, setEmplacements] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    des: "",
    cat: "",
    qty: "",
    loc: "",
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
    loadEmplacements();
  }, []);

  useEffect(() => {
    let filtered = filterListByDate(items, filter);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.des.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.loc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((item) => item.loc === locationFilter);
    }

    setFilteredItems(filtered);
  }, [items, filter, searchQuery, locationFilter]);

  async function loadItems() {
    try {
      const data = (await firestoreWrapper.getCollection(
        "eurohinca_inventory_stock",
      )) as PartItem[];
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMagasiniers() {
    const data = await getListItems("list_magasiniers");
    setMagasiniers(data);
  }

  async function loadEmplacements() {
    const data = await getListItems("list_emplacements");
    setEmplacements(data);
  }

  function resetForm() {
    setFormData({
      des: "",
      cat: "",
      qty: "",
      loc: "",
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
    if (
      !formData.des ||
      !formData.cat ||
      !formData.qty ||
      !formData.alert
    )
      return;
    setLoading(true);
    try {
      const data = {
        des: formData.des,
        cat: formData.cat,
        qty: parseFloat(formData.qty),
        loc: formData.loc,
        alert: parseFloat(formData.alert),
        date: formData.date,
        time: formData.time,
        user: currentUser,
        magasinier: formData.magasinier,
      };
      if (editingId) {
        await firestoreWrapper.updateDoc(
          "eurohinca_inventory_stock",
          editingId,
          data,
        );
        await logActivity(
          "Modification",
          `Pièce modifiée: ${formData.des}`,
          currentUser,
        );
      } else {
        await firestoreWrapper.addDoc(
          "eurohinca_inventory_stock",
          data,
        );
        await logActivity(
          "Ajout",
          `Pièce ajoutée: ${formData.des}`,
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

  async function handleDelete(id: string, des: string) {
    if (!confirm(`Supprimer ${des} ?`)) return;
    try {
      await firestoreWrapper.deleteDoc(
        "eurohinca_inventory_stock",
        id,
      );
      await logActivity(
        "Suppression",
        `Pièce supprimée: ${des}`,
        currentUser,
      );
      await loadItems();
    } catch (error) {
      console.error(error);
    }
  }

  function handleEdit(item: PartItem) {
    setFormData({
      des: item.des,
      cat: item.cat,
      qty: item.qty.toString(),
      loc: item.loc,
      alert: item.alert.toString(),
      date: item.date || new Date().toISOString().split("T")[0],
      time: item.time || new Date().toTimeString().slice(0, 5),
      magasinier: item.magasinier || currentUser,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  // Get unique locations from items
  const uniqueLocations = Array.from(
    new Set(items.map((item) => item.loc).filter((loc) => loc))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-slate-900 text-xl font-bold">
            Stock Matériel
          </h2>
          <p className="text-slate-600">Pièces de rechange</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <DateFilter onFilterChange={setFilter} />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCatManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" /> Catégories
            </button>
            <button
              onClick={() => setShowEmplacementManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" /> Emplacements
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
            <button
              onClick={() => exportPartsToCSV(filteredItems)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par description, catégorie ou localisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:w-64">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les emplacements</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-bold">
                {editingId ? "Modifier" : "Ajouter"}
              </h3>
              <button onClick={resetForm}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.des}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      des: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <DynamicDropdown
                listName="list_cats"
                value={formData.cat}
                onChange={(v) =>
                  setFormData({ ...formData, cat: v })
                }
                placeholder="-- Catégorie --"
                label="Catégorie *"
              />
              
              <div>
                <label className="block text-slate-700 mb-1">
                  Quantité *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.qty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qty: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-700 mb-1">
                  Localisation
                </label>
                <select
                  value={formData.loc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loc: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choisir --</option>
                  {emplacements.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-slate-700 mb-1">
                  Alerte *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.alert}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alert: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">
                    Heure *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time: e.target.value,
                      })
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
                    setFormData({
                      ...formData,
                      magasinier: e.target.value,
                    })
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
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
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
                <th className="px-6 py-3 text-left text-slate-700">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-slate-700">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-slate-700">Qté</th>
                <th className="px-6 py-3 text-left text-slate-700">Loc</th>
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
                    colSpan={9}
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
                      {item.des}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.cat}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{item.qty}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.loc}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.alert}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.time || "-"}
                    </td>
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
                          onClick={() =>
                            handleDelete(item.id, item.des)
                          }
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

      {/* Category Manager Modal */}
      {showCatManager && (
        <ListManager
          listName="list_cats"
          title="Gérer les Catégories"
          onClose={() => setShowCatManager(false)}
        />
      )}

      {/* Emplacement Manager Modal */}
      {showEmplacementManager && (
        <ListManager
          listName="list_emplacements"
          title="Gérer les Emplacements"
          onClose={() => {
            setShowEmplacementManager(false);
            loadEmplacements();
          }}
        />
      )}
    </div>
  );
}
