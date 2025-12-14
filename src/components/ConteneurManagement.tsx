import { useState, useEffect } from "react";
import { firestoreWrapper, logActivity, getListItems } from "../lib/firebase";
import { Plus, Trash2, Edit2, X, Package, Search } from "lucide-react";
import { ListManager } from "./ListManager";

interface Conteneur {
  id: string;
  name: string;
  emplacement: string;
  items: string;
  date: string;
  user: string;
}

export function ConteneurManagement({ currentUser }: { currentUser: string }) {
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [filteredConteneurs, setFilteredConteneurs] = useState<Conteneur[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    emplacement: "",
    items: "",
  });
  const [showEmplacementManager, setShowEmplacementManager] = useState(false);
  const [emplacements, setEmplacements] = useState<string[]>([]);

  useEffect(() => {
    loadConteneurs();
    loadEmplacements();
  }, []);

  useEffect(() => {
    const filtered = conteneurs.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.emplacement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.items.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredConteneurs(filtered);
  }, [searchQuery, conteneurs]);

  async function loadConteneurs() {
    try {
      const data = (await firestoreWrapper.getCollection(
        "eurohinca_conteneurs"
      )) as Conteneur[];
      setConteneurs(data);
      setFilteredConteneurs(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadEmplacements() {
    const data = await getListItems("list_emplacements");
    setEmplacements(data);
  }

  function resetForm() {
    setFormData({ name: "", emplacement: "", items: "" });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.emplacement) return;

    try {
      const data = {
        name: formData.name,
        emplacement: formData.emplacement,
        items: formData.items,
        date: new Date().toISOString().split("T")[0],
        user: currentUser,
      };

      if (editingId) {
        await firestoreWrapper.updateDoc(
          "eurohinca_conteneurs",
          editingId,
          data
        );
        await logActivity(
          "Modification Conteneur",
          `${formData.name} - ${formData.emplacement}`,
          currentUser
        );
      } else {
        await firestoreWrapper.addDoc("eurohinca_conteneurs", data);
        await logActivity(
          "Ajout Conteneur",
          `${formData.name} - ${formData.emplacement}`,
          currentUser
        );
      }

      resetForm();
      await loadConteneurs();
    } catch (error) {
      console.error(error);
    }
  }

  function handleEdit(item: Conteneur) {
    setFormData({
      name: item.name,
      emplacement: item.emplacement,
      items: item.items,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce conteneur ?")) return;

    try {
      await firestoreWrapper.deleteDoc("eurohinca_conteneurs", id);
      await logActivity("Suppression Conteneur", name, currentUser);
      await loadConteneurs();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Gestion des Conteneurs</h2>
          <p className="text-slate-600">
            Gérez les conteneurs et leurs emplacements
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmplacementManager(true)}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Gérer Emplacements
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter Conteneur
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher conteneur, emplacement ou contenu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Conteneur List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700">
                  Nom Conteneur
                </th>
                <th className="px-4 py-3 text-left text-slate-700">
                  Emplacement
                </th>
                <th className="px-4 py-3 text-left text-slate-700">Contenu</th>
                <th className="px-4 py-3 text-left text-slate-700">Date</th>
                <th className="px-4 py-3 text-left text-slate-700">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-right text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredConteneurs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.emplacement}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.items}</td>
                  <td className="px-4 py-3 text-slate-600">{item.date}</td>
                  <td className="px-4 py-3 text-slate-600">{item.user}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredConteneurs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun conteneur trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-slate-900">
                {editingId ? "Modifier" : "Ajouter"} Conteneur
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">
                  Nom du Conteneur *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2">
                  Emplacement *
                </label>
                <select
                  value={formData.emplacement}
                  onChange={(e) =>
                    setFormData({ ...formData, emplacement: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                <label className="block text-slate-700 mb-2">Contenu</label>
                <textarea
                  value={formData.items}
                  onChange={(e) =>
                    setFormData({ ...formData, items: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emplacement Manager */}
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
