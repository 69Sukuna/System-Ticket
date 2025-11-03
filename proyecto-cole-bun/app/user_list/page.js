"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState } from "react";

function UserListInner() {
  const auth = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Cargar usuarios desde la API
  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      setList(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar usuarios según búsqueda y rol
  const filteredUsers = list.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toString().includes(searchTerm);
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  function openEditor(user) {
    setEditing({ ...user, password: '' });
    setCreating(false);
  }

  function openCreator() {
    setEditing({ 
      name: '', 
      email: '', 
      password: '', 
      role: 'user' 
    });
    setCreating(true);
  }

  function closeEditor() {
    setEditing(null);
    setCreating(false);
    setSaving(false);
    setError(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);

    // Validación básica
    if (!editing.name || !editing.email) {
      setError("Nombre y email son requeridos");
      setSaving(false);
      return;
    }

    // Para crear usuario, la contraseña es obligatoria
    if (creating && (!editing.password || !editing.password.trim())) {
      setError("La contraseña es requerida para crear un usuario");
      setSaving(false);
      return;
    }

    try {
      let response;
      
      if (creating) {
        // Crear nuevo usuario
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editing.name,
            email: editing.email,
            password: editing.password,
            role: editing.role
          }),
        });
      } else {
        // Actualizar usuario existente
        const updateData = {
          name: editing.name,
          email: editing.email,
          role: editing.role
        };

        if (editing.password && editing.password.trim()) {
          updateData.password = editing.password;
        }

        response = await fetch(`/api/users/${editing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${creating ? 'crear' : 'actualizar'} usuario`);
      }

      // Si editamos al usuario autenticado, actualizar la sesión
      if (!creating && auth?.user && Number(auth.user.id) === Number(editing.id)) {
        const newSession = { 
          ...auth.user, 
          name: editing.name, 
          email: editing.email, 
          role: editing.role 
        };
        
        try {
          localStorage.setItem("user", JSON.stringify(newSession));
          window.dispatchEvent(
            new StorageEvent("storage", { 
              key: "user", 
              newValue: JSON.stringify(newSession) 
            })
          );
        } catch (e) {
          console.warn("No se pudo actualizar session", e);
        }
      }

      await loadUsers();
      closeEditor();

    } catch (err) {
      console.error('Error guardando usuario:', err);
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar usuario? Esta acción es irreversible y eliminará también todos sus tickets.")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar usuario');
      }

      if (auth?.user && Number(auth.user.id) === Number(id)) {
        try {
          localStorage.removeItem("user");
          window.dispatchEvent(
            new StorageEvent("storage", { key: "user", newValue: null })
          );
        } catch (e) {
          console.warn(e);
        }
        window.location.href = "/login";
        return;
      }

      await loadUsers();

    } catch (err) {
      console.error('Error eliminando usuario:', err);
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-slate-600 dark:text-slate-400">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold dark:text-white">Lista de usuarios</h2>
        <div className="flex gap-2">
          <button 
            onClick={loadUsers}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            🔄 Recargar
          </button>
          <button 
            onClick={openCreator}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            ➕ Crear Usuario
          </button>
        </div>
      </div>

      {error && !editing && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div className="min-w-[180px]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="eventManage">Event Manager</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Mostrando {filteredUsers.length} de {list.length} usuarios
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-slate-600 dark:text-slate-400">
          {list.length === 0 ? "No hay usuarios registrados." : "No se encontraron usuarios con los filtros aplicados."}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t dark:border-slate-700 dark:text-slate-200">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                        : u.role === 'eventManage'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditor(u)} 
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)} 
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor/Creator modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {creating ? "Crear nuevo usuario" : `Editar usuario #${editing.id}`}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input 
                  value={editing.name || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email"
                  value={editing.email || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">Rol</label>
                <select 
                  value={editing.role || "user"} 
                  onChange={(e) => setEditing((s) => ({ ...s, role: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                  <option value="eventManage">eventManage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 dark:text-slate-300">
                  {creating ? "Contraseña" : "Nueva Contraseña"} 
                  {creating && <span className="text-red-500"> *</span>}
                  {!creating && <span className="text-slate-500 text-xs"> (déjalo en blanco para no cambiar)</span>}
                </label>
                <input 
                  type="password" 
                  value={editing.password || ""} 
                  onChange={(e) => setEditing((s) => ({ ...s, password: e.target.value }))} 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="••••••••" 
                />
              </div>
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
                onClick={handleSave} 
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

export default function UserListPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <UserListInner />
    </ProtectedRoute>
  );
}