import { useState, useEffect } from "react";
import { getListItems, addListItem, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Plus, Trash2, Edit2, X } from "lucide-react";

interface ListManagerProps {
  listName: string;
  title: string;
  onClose: () => void;
}

export function ListManager({ listName, title, onClose }: ListManagerProps) {
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    loadItems();
  }, [listName]);

  async function loadItems() {
    const data = await getListItems(listName);
    setItems(data);
  }

  async function handleAdd() {
    if (!newItem.trim()) return;
    await addListItem(listName, newItem.trim());
    setNewItem("");
    await loadItems();
  }

  async function handleDelete(index: number) {
    if (!db) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      return;
    }

    try {
      const updated = items.filter((_, i) => i !== index);
      const docRef = doc(db, "lists", listName);
      await setDoc(docRef, { items: updated }, { merge: true });
      await loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  async function handleEdit(index: number) {
    if (!editValue.trim()) return;
    
    if (!db) {
      const updated = [...items];
      updated[index] = editValue.trim();
      setItems(updated);
      setEditingIndex(null);
      setEditValue("");
      return;
    }

    try {
      const updated = [...items];
      updated[index] = editValue.trim();
      const docRef = doc(db, "lists", listName);
      await setDoc(docRef, { items: updated }, { merge: true });
      await loadItems();
      setEditingIndex(null);
      setEditValue("");
    } catch (error) {
      console.error("Error editing item:", error);
    }
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(items[index]);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Add new item */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ajouter un élément..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List items */}
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
              >
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleEdit(index)
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded"
                    />
                    <button
                      onClick={() => handleEdit(index)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingIndex(null);
                        setEditValue("");
                      }}
                      className="px-2 py-1 bg-slate-400 text-white rounded hover:bg-slate-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-slate-700">{item}</span>
                    <button
                      onClick={() => startEdit(index)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-slate-400 text-center py-4">
                Aucun élément
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
