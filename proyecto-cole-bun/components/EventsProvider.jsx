"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const EventsContext = createContext(null);

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Concierto de Rock",
    date: "2024-07-15",
    location: "Madrid, España",
    description: "Noche de rock con bandas locales e internacionales.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    entradas: [
      { id: "e1-t1", tipo: "General", precio: 50, cantidad: 100, estado: "disponible", fase: "1" },
      { id: "e1-t2", tipo: "VIP", precio: 150, cantidad: 50, estado: "disponible", fase: "1" },
    ],
  },
  {
    id: 2,
    title: "Feria de Tecnología",
    date: "2024-08-20",
    location: "Barcelona, España",
    description: "Últimas innovaciones en tecnología y talleres.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    entradas: [
      { id: "e2-t1", tipo: "General", precio: 20, cantidad: 200, estado: "disponible", fase: "1" },
      { id: "e2-t2", tipo: "Premium", precio: 80, cantidad: 100, estado: "disponible", fase: "1" },
    ],
  },
];

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mock_events");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("EventsProvider: error reading localStorage", e);
    return null;
  }
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const stored = readStorage();
    if (Array.isArray(stored) && stored.length > 0) {
      setEvents(stored);
      console.debug("EventsProvider: loaded from localStorage", stored);
    } else {
      setEvents(MOCK_EVENTS);
      try {
        localStorage.setItem("mock_events", JSON.stringify(MOCK_EVENTS));
      } catch (e) {
        console.warn("EventsProvider: could not seed localStorage", e);
      }
      console.debug("EventsProvider: seed applied", MOCK_EVENTS, "stored=", stored);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mock_events", JSON.stringify(events));
      console.debug("EventsProvider: persisted events", events);
    } catch (e) {
      console.warn("EventsProvider: persist error", e);
    }
  }, [events]);

  function addEvent(ev) {
    setEvents((s) => [...s, ev]);
  }

  function updateEvent(updated) {
    setEvents((s) => s.map((e) => (Number(e.id) === Number(updated.id) ? { ...e, ...updated } : e)));
  }

  function removeEvent(id) {
    setEvents((s) => s.filter((e) => Number(e.id) !== Number(id)));
  }

  function addTicketToEvent(eventId, ticket) {
    setEvents((s) =>
      s.map((e) =>
        Number(e.id) === Number(eventId) ? { ...e, entradas: [...(e.entradas || []), ticket] } : e
      )
    );
  }

  function updateTicket(eventId, ticketId, updatedTicket) {
    setEvents((s) =>
      s.map((e) =>
        Number(e.id) === Number(eventId)
          ? {
              ...e,
              entradas: (e.entradas || []).map((t) => (t.id === ticketId ? { ...t, ...updatedTicket } : t)),
            }
          : e
      )
    );
  }

  function removeTicketFromEvent(eventId, ticketId) {
    setEvents((s) =>
      s.map((e) =>
        Number(e.id) === Number(eventId) ? { ...e, entradas: (e.entradas || []).filter((t) => t.id !== ticketId) } : e
      )
    );
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        removeEvent,
        addTicketToEvent,
        updateTicket,
        removeTicketFromEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventsContext);
}