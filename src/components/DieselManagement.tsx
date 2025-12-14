import { useState, useEffect } from "react";
import {
  firestoreWrapper,
  logActivity,
  getDieselStock,
  updateDieselStock,
  subtractDieselStock,
  initializeDefaultLists,
} from "../lib/firebase";
import { DynamicDropdown } from "./DynamicDropdown";
import { exportDieselToCSV } from "../lib/csvExport";
// Added Trash2 for the delete icon
import {
  Plus,
  X,
  Edit,
  Fuel,
  Download,
  Trash2,
  Save,
} from "lucide-react";
import {
  DateFilter,
  filterListByDate,
  FilterType,
} from "./DateFilter";

interface DieselEntry {
  id: string;
  mac: string;
  sh: string;
  conso: number;
  date: string;
  time: string;
  user: string;
}

export function DieselManagement({
  currentUser,
}: {
  currentUser: string;
}) {
  const [entries, setEntries] = useState<DieselEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<
    DieselEntry[]
  >([]);
  const [totalStock, setTotalStock] = useState(0);

  // Form visibility
  const [showConsumptionForm, setShowConsumptionForm] =
    useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [consumptionData, setConsumptionData] = useState({
    mac: "",
    sh: "",
    conso: "",
  });
  const [newStockValue, setNewStockValue] = useState("");

  // Track editing state
  const [editingId, setEditingId] = useState<string | null>(
    null,
  );

  const [filter, setFilter] = useState<{
    type: FilterType;
    start?: string;
    end?: string;
  }>({ type: "all" });

  useEffect(() => {
    initializeDefaultLists();
    loadData();
  }, []);

  useEffect(() => {
    setFilteredEntries(filterListByDate(entries, filter));
  }, [entries, filter]);

  async function loadData() {
    await loadEntries();
    await loadStock();
  }

  async function loadEntries() {
    try {
      let data = (await firestoreWrapper.getCollection(
        "eurohinca_log_gasoil",
      )) as DieselEntry[];
      data.sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      );
      setEntries(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadStock() {
    setTotalStock(await getDieselStock());
  }

  function resetConsumptionForm() {
    setConsumptionData({ mac: "", sh: "", conso: "" });
    setEditingId(null); // Clear editing state
    setShowConsumptionForm(false);
  }

  // PREPARE EDIT: Fill form with existing data
  function handleEditClick(entry: DieselEntry) {
    setConsumptionData({
      mac: entry.mac,
      sh: entry.sh,
      conso: entry.conso.toString(),
    });
    setEditingId(entry.id);
    setShowConsumptionForm(true);
  }

  // HANDLE DELETE
  async function handleDeleteClick(entry: DieselEntry) {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette entrée ? Le stock sera réajusté.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // 1. Delete from Firestore
      // Assuming firestoreWrapper has deleteDoc, otherwise use standard SDK
      await firestoreWrapper.deleteDoc(
        "eurohinca_log_gasoil",
        entry.id,
      );

      // 2. Return the fuel to stock (We add the consumed amount back)
      const restoredStock = totalStock + entry.conso;
      await updateDieselStock(restoredStock);

      // 3. Log
      await logActivity(
        "Suppression Entrée Gasoil",
        `Supprimé: ${entry.mac} (${entry.conso}L). Stock rendu.`,
        currentUser,
      );

      await loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  async function handleConsumptionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !consumptionData.mac ||
      !consumptionData.sh ||
      !consumptionData.conso
    )
      return;

    const consoAmount = parseFloat(consumptionData.conso);

    // Validation: Only check for insufficient stock if we are adding NEW consumption
    // or if we are increasing consumption in Edit mode more than available.
    if (!editingId && consoAmount > totalStock) {
      alert("Stock insuffisant !");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();

      if (editingId) {
        // --- UPDATE EXISTING RECORD ---
        const originalEntry = entries.find(
          (e) => e.id === editingId,
        );
        if (!originalEntry) return;

        // Calculate difference for stock adjustment
        // If Old was 100, New is 120. Diff is -20. Stock decreases by 20.
        // If Old was 100, New is 80. Diff is +20. Stock increases by 20.
        const stockDifference =
          originalEntry.conso - consoAmount;

        // Update Data Object (keep original date/time to maintain history accuracy, or update 'time' to now if preferred)
        const updateData = {
          mac: consumptionData.mac,
          sh: consumptionData.sh,
          conso: consoAmount,
          // We usually don't update date/time/user on edit to preserve audit trail,
          // but you can uncomment below if you want to update them:
          // date: now.toISOString().split("T")[0],
          // time: now.toLocaleTimeString("fr-FR"),
          // user: currentUser
        };

        await firestoreWrapper.updateDoc(
          "eurohinca_log_gasoil",
          editingId,
          updateData,
        );

        // Update Stock if amount changed
        if (stockDifference !== 0) {
          await updateDieselStock(totalStock + stockDifference);
        }

        await logActivity(
          "Modification Gasoil",
          `Modifié: ${consumptionData.mac}. ${originalEntry.conso}L -> ${consoAmount}L`,
          currentUser,
        );
      } else {
        // --- CREATE NEW RECORD (Original Logic) ---
        const data = {
          mac: consumptionData.mac,
          sh: consumptionData.sh,
          conso: consoAmount,
          date: now.toISOString().split("T")[0],
          time: now.toLocaleTimeString("fr-FR"),
          user: currentUser,
        };
        await firestoreWrapper.addDoc(
          "eurohinca_log_gasoil",
          data,
        );
        await subtractDieselStock(consoAmount);
        await logActivity(
          "Consommation Gasoil",
          `${consumptionData.mac} - ${consoAmount}L`,
          currentUser,
        );
      }

      await loadData();
      resetConsumptionForm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStockUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newStockValue) return;
    const stockValue = parseFloat(newStockValue);
    if (stockValue < 0) {
      alert("Stock négatif impossible");
      return;
    }
    setLoading(true);
    try {
      await updateDieselStock(stockValue);
      await logActivity(
        "Mise à jour Stock Gasoil",
        `Stock mis à jour: ${stockValue}L`,
        currentUser,
      );
      await loadStock();
      setNewStockValue("");
      setShowStockForm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-slate-900 text-xl font-bold">
            Gestion Gasoil
          </h2>
          <p className="text-slate-600">
            Suivi consommation & stock
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <DateFilter onFilterChange={setFilter} />
          <div className="flex gap-2">
            <button
              onClick={() => setShowStockForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit className="w-4 h-4" /> Modifier Stock
            </button>
            <button
              onClick={() => {
                setEditingId(null); // Ensure we are in create mode
                setConsumptionData({
                  mac: "",
                  sh: "",
                  conso: "",
                });
                setShowConsumptionForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Conso
            </button>
            <button
              onClick={() => exportDieselToCSV(filteredEntries)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <Fuel className="w-8 h-8" />
          </div>
          <div>
            <p className="text-orange-100 mb-1">Stock Total</p>
            <p className="text-3xl font-bold">
              {totalStock.toLocaleString()} L
            </p>
          </div>
        </div>
      </div>

      {showConsumptionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-bold">
                {editingId
                  ? "Modifier Consommation"
                  : "Enregistrer Consommation"}
              </h3>
              <button onClick={resetConsumptionForm}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={handleConsumptionSubmit}
              className="space-y-4"
            >
              <DynamicDropdown
                listName="list_machines"
                value={consumptionData.mac}
                onChange={(v) =>
                  setConsumptionData({
                    ...consumptionData,
                    mac: v,
                  })
                }
                placeholder="-- Machine --"
                label="Machine"
              />
              <div>
                <label className="block text-slate-700 mb-1">
                  Shift
                </label>
                <select
                  value={consumptionData.sh}
                  onChange={(e) =>
                    setConsumptionData({
                      ...consumptionData,
                      sh: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">--</option>
                  <option>Jour</option>
                  <option>Nuit</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">
                  Conso (L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={consumptionData.conso}
                  onChange={(e) =>
                    setConsumptionData({
                      ...consumptionData,
                      conso: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Dispo: {totalStock.toLocaleString()} L
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetConsumptionForm}
                  className="flex-1 border p-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "..."
                  ) : editingId ? (
                    <>
                      <Save className="w-4 h-4" /> Modifier
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Form (Unchanged Logic, just ensuring it's here) */}
      {showStockForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-bold">
                Modifier Stock
              </h3>
              <button onClick={() => setShowStockForm(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={handleStockUpdate}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-700 mb-1">
                  Nouveau Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStockValue}
                  onChange={(e) =>
                    setNewStockValue(e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockForm(false)}
                  className="flex-1 border p-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white p-2 rounded-lg"
                >
                  {loading ? "..." : "Valider"}
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
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Heure</th>
                <th className="px-6 py-3 text-left">Machine</th>
                <th className="px-6 py-3 text-left">Shift</th>
                <th className="px-6 py-3 text-left">Conso</th>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">{entry.date}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {entry.time}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {entry.mac}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {entry.sh}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {entry.conso} L
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {entry.user}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(entry)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(entry)
                          }
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
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
    </div>
  );
}