import { useState, useEffect } from "react";
import { firestoreWrapper, logActivity } from "../lib/firebase";
import { exportOutputToCSV } from "../lib/csvExport";
import { Plus, X, Download } from "lucide-react";
import {
  DateFilter,
  filterListByDate,
  FilterType,
} from "./DateFilter";

interface OutputItem {
  id: string;
  nom: string;
  qty: number;
  dest: string;
  rec: string;
  date: string;
  user: string;
}

export function OutputDelivery({
  currentUser,
}: {
  currentUser: string;
}) {
  const [items, setItems] = useState<OutputItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<
    OutputItem[]
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    qty: "",
    dest: "",
    rec: "",
  });
  const [filter, setFilter] = useState<{
    type: FilterType;
    start?: string;
    end?: string;
  }>({ type: "all" });

  useEffect(() => {
    loadItems();
  }, []);
  useEffect(() => {
    setFilteredItems(filterListByDate(items, filter));
  }, [items, filter]);

  async function loadItems() {
    try {
      let data = (await firestoreWrapper.getCollection(
        "eurohinca_log_sortie",
      )) as OutputItem[];
      data.sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      );
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  }

  function resetForm() {
    setFormData({ nom: "", qty: "", dest: "", rec: "" });
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !formData.nom ||
      !formData.qty ||
      !formData.dest ||
      !formData.rec
    )
      return;
    setLoading(true);
    try {
      const data = {
        nom: formData.nom,
        qty: parseFloat(formData.qty),
        dest: formData.dest,
        rec: formData.rec,
        date: new Date().toISOString().split("T")[0],
        user: currentUser,
      };
      await firestoreWrapper.addDoc(
        "eurohinca_log_sortie",
        data,
      );
      await logActivity(
        "Sortie",
        `${formData.nom} - ${formData.qty} unités vers ${formData.dest}`,
        currentUser,
      );
      await loadItems();
      resetForm();
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
            Sortie Matériel
          </h2>
          <p className="text-slate-600">
            Enregistrement des sorties
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <DateFilter onFilterChange={setFilter} />
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouvelle Sortie
            </button>
            <button
              onClick={() => exportOutputToCSV(filteredItems)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-bold">
                Enregistrer une sortie
              </h3>
              <button onClick={resetForm}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1">
                  Matériel
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nom: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">
                  Quantité
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
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={formData.dest}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dest: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">
                  Réceptionnaire
                </label>
                <input
                  type="text"
                  value={formData.rec}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rec: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border p-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white p-2 rounded-lg"
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
                <th className="px-6 py-3 text-left">
                  Matériel
                </th>
                <th className="px-6 py-3 text-left">Qté</th>
                <th className="px-6 py-3 text-left">Dest</th>
                <th className="px-6 py-3 text-left">
                  Reçu par
                </th>
                <th className="px-6 py-3 text-left">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Aucune sortie
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-medium">
                      {item.nom}
                    </td>
                    <td className="px-6 py-4">{item.qty}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.dest}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.rec}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.user}
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