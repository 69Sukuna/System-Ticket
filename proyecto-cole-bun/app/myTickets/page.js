"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState } from "react";

function MyTicketsContent() {
  const auth = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (auth?.user) {
      loadTickets();
    } else {
      setTickets([]);
      setLoading(false);
    }
  }, [auth?.user]);

  async function loadTickets() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tickets?userId=${auth.user.id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar tickets');
      }
      
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error('Error cargando tickets:', err);
      setError('No se pudieron cargar los tickets');
    } finally {
      setLoading(false);
    }
  }

  if (!auth?.user) return null;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-slate-600 dark:text-slate-400">Cargando tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6 text-slate-900 dark:text-white">
          Mis Tickets
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center shadow">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              No tienes tickets comprados todavía.
            </p>
            <a
              href="/home"
              className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver eventos disponibles
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {ticket.eventTitle}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Fecha del evento: {ticket.date}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span>Cantidad: {ticket.quantity}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Precio unitario: Bs.{ticket.price}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Comprado: {new Date(ticket.purchasedAt).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        Total pagado
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        Bs.{ticket.price * ticket.quantity}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                        ID: {ticket.id}
                      </div>
                     
                    </div>
                  </div>
                </div>

                {/* Decorative ticket perforation */}
                <div className="h-2 bg-slate-100 dark:bg-slate-900 relative">
                  <div className="absolute inset-0 flex justify-around">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full -mt-1"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <ProtectedRoute>
      <MyTicketsContent />
    </ProtectedRoute>
  );
}