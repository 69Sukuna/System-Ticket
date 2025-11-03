"use client";
import { useState, useEffect } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import EventCard from "../../components/EventCard";


  export default function EventListPage() {
  // ← REEMPLAZAR DESDE AQUÍ
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  return (
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark font-display transition-colors">
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="layout-content-container flex flex-col w-full max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
              <h1 className="text-3xl font-bold text-background-dark dark:text-background-light">
                Eventos Disponibles
              </h1>

              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-background-dark/50 dark:text-background-light/50">
                  <svg
                    fill="currentColor"
                    height="20px"
                    viewBox="0 0 256 256"
                    width="20px"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input
                  className="form-input w-full rounded-lg border-none bg-background-dark/10 dark:bg-background-light/10 text-background-dark dark:text-background-light placeholder:text-background-dark/50 dark:placeholder:text-background-light/50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Search events"
                  type="text"
                />
              </div>
            </div>
            {/* Lista de eventos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </main>
      </div>
  );
}