"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import EventCard from "../../components/EventCard";
import { useEffect, useState } from "react";

function EventAdminInner() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar eventos desde la API
  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error('Error al cargar eventos');
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError('No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreate() {
    setEditing({
      title: "",
      date: "",
      location: "",
      description: "",
      image: "",
      entradas: [],
    });
    setCreating(true);
  }

  function openEdit(ev) {
    const eventCopy = JSON.parse(JSON.stringify(ev));
    // Asegurarse de que ticketTypes tenga IDs únicos para edición
    if (eventCopy.ticketTypes && !eventCopy.entradas) {
      eventCopy.entradas = eventCopy.ticketTypes.map((ticket, index) => ({
        ...ticket,
        id: ticket.id || `existing-${index}-${Date.now()}`
      }));
    }
    setEditing(eventCopy);
    setCreating(false);
  }

  function closeEditor() {
    setEditing(null);
    setCreating(false);
    setSaving(false);
    setError(null);
  }

  async function saveEvent() {
    if (!editing) return;
    
    if (!editing.title) {
      alert("El título es requerido.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Preparar datos: convertir 'entradas' a 'ticketTypes' sin IDs temporales
      const eventData = {
        ...editing,
        ticketTypes: (editing.entradas || []).map(({ id, ...ticket }) => ticket)
      };
      delete eventData.entradas;

      let response;
      
      if (creating) {
        // Crear nuevo evento
        response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
      } else {
        // Actualizar evento existente
        response = await fetch(`/api/events/${editing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${creating ? 'crear' : 'actualizar'} evento`);
      }

      await loadEvents();
      closeEditor();

    } catch (err) {
      console.error('Error guardando evento:', err);
      setError(err.message);
      setSaving(false);
    }
  }

  async function deleteEvent(id) {
    if (!confirm("¿Eliminar evento? Esta acción es irreversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar evento');
      }

      await loadEvents();

    } catch (err) {
      console.error('Error eliminando evento:', err);
      alert(err.message);
    }
  }

  function addTicketRow() {
    if (!editing) return;
    // Generar ID único combinando timestamp y random
    const uniqueId = `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTicket = {
      id: uniqueId,
      tipo: "General",
      precio: 10,
      cantidad: 100,
      estado: "disponible",
      fase: "1",
    };
    setEditing((s) => ({ ...s, entradas: [...(s.entradas || []), newTicket] }));
  }

  function updateTicketRow(ticketId, field, value) {
    setEditing((s) => ({
      ...s,
      entradas: (s.entradas || []).map((t) => (t.id === ticketId ? { ...t, [field]: value } : t)),
    }));
  }

  function removeTicketRow(ticketId) {
    setEditing((s) => ({ ...s, entradas: (s.entradas || []).filter((t) => t.id !== ticketId) }));
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-slate-600 dark:text-slate-400">Cargando eventos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold dark:text-white">Administración de Eventos</h2>
        <div className="flex gap-2">
          <button 
            onClick={loadEvents}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            🔄 Recargar
          </button>
          <button 
            onClick={openCreate} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
          >
            ➕ Crear Evento
          </button>
        </div>
      </div>

      {error && !editing && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-slate-600 dark:text-slate-400">No hay eventos registrados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div key={ev.id} className="space-y-3">
              <EventCard event={ev} />
              <div className="flex gap-2">
                <button 
                  onClick={() => openEdit(ev)} 
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-start md:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl p-6 shadow-lg overflow-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {creating ? "Crear evento" : `Editar evento #${editing.id}`}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">
                  Título <span className="text-red-500">*</span>
                </label>
                <input 
                  value={editing.title || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">Fecha</label>
                <input 
                  type="date" 
                  value={editing.date || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, date: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">Ubicación</label>
                <input 
                  value={editing.location || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, location: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">Imagen (URL)</label>
                <input 
                  value={editing.image || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, image: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1 dark:text-slate-300">Descripción</label>
                <textarea 
                  value={editing.description || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  rows={4} 
                />
              </div>
            </div>

            <hr className="my-4 dark:border-slate-700" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold dark:text-white">Entradas</h4>
                <button 
                  onClick={addTicketRow} 
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  ➕ Añadir entrada
                </button>
              </div>

              {(editing.entradas || []).length === 0 ? (
                <div className="text-slate-600 dark:text-slate-400">No hay entradas definidas.</div>
              ) : (
                <div className="space-y-3">
                  {/* Encabezados de columna */}
                  <div className="hidden md:grid grid-cols-6 gap-2 px-2 text-sm font-semibold dark:text-slate-300">
                    <div className="col-span-2">Tipo</div>
                    <div>Precio (Bs.)</div>
                    <div>Cantidad</div>
                    <div>Estado</div>
                    <div></div>
                  </div>
                  
                  {editing.entradas.map((t, index) => (
                    <div key={`${t.id}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center p-2 border rounded dark:border-slate-600">
                      <div className="md:col-span-2">
                        <label className="block md:hidden text-xs mb-1 dark:text-slate-400">Tipo</label>
                        <input 
                          value={t.tipo || ""} 
                          onChange={(e) => updateTicketRow(t.id, "tipo", e.target.value)} 
                          placeholder="Tipo"
                          className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block md:hidden text-xs mb-1 dark:text-slate-400">Precio (Bs.)</label>
                        <input 
                          type="number" 
                          value={t.precio || 0} 
                          onChange={(e) => updateTicketRow(t.id, "precio", Number(e.target.value))} 
                          placeholder="Precio"
                          className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block md:hidden text-xs mb-1 dark:text-slate-400">Cantidad</label>
                        <input 
                          type="number" 
                          value={t.cantidad || 0} 
                          onChange={(e) => updateTicketRow(t.id, "cantidad", Number(e.target.value))} 
                          placeholder="Cantidad"
                          className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block md:hidden text-xs mb-1 dark:text-slate-400">Estado</label>
                        <select 
                          value={t.estado || "disponible"} 
                          onChange={(e) => updateTicketRow(t.id, "estado", e.target.value)} 
                          className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                          <option value="disponible">Disponible</option>
                          <option value="agotado">Agotado</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => removeTicketRow(t.id)} 
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={closeEditor} 
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                onClick={saveEvent} 
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando..." : (creating ? "Crear" : "Guardar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventAdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "eventManage"]}>
      <EventAdminInner />
    </ProtectedRoute>
  );
}