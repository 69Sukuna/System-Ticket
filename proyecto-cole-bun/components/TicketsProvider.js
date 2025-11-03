"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const TicketsContext = createContext(null);

// Tickets de ejemplo asociados a los usuarios MOCK (id: 1,2,3)
const MOCK_TICKETS = [
  { id: "t-1", userId: 1, eventId: 1, eventTitle: "Concierto de Rock", date: "2024-07-15", price: 50, quantity: 2, purchasedAt: 1710000000000 },
  { id: "t-2", userId: 2, eventId: 2, eventTitle: "Feria de Tecnología", date: "2024-08-20", price: 20, quantity: 1, purchasedAt: 1715000000000 },
  { id: "t-3", userId: 3, eventId: 3, eventTitle: "Festival de Cine", date: "2024-09-10", price: 30, quantity: 3, purchasedAt: 1718000000000 },
];

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mock_tickets");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("TicketsProvider: error leyendo localStorage", e);
    return null;
  }
}

export function TicketsProvider({ children }) {
  const [tickets, setTickets] = useState([]);

  // carga inicial (si no hay nada en localStorage, siembra MOCK_TICKETS)
  useEffect(() => {
    const stored = readStorage();

    // Si stored es null o es un array vacío, aplicamos seed
    if (Array.isArray(stored) && stored.length > 0) {
      setTickets(stored);
      console.debug("TicketsProvider: cargado desde localStorage", stored);
    } else {
      setTickets(MOCK_TICKETS);
      try {
        localStorage.setItem("mock_tickets", JSON.stringify(MOCK_TICKETS));
      } catch (e) {
        console.warn("TicketsProvider: no se pudo guardar seed", e);
      }
      console.debug("TicketsProvider: seed inicial aplicada", MOCK_TICKETS, "stored=", stored);
    }
  }, []);

  // sincroniza cambios a localStorage
  useEffect(() => {
    try {
      localStorage.setItem("mock_tickets", JSON.stringify(tickets));
      console.debug("TicketsProvider: persistidos tickets", tickets);
    } catch (e) {
      console.warn("TicketsProvider: no se pudo persistir", e);
    }
  }, [tickets]);

  function addTicket(ticket) {
    setTickets((s) => [...s, ticket]);
  }

  function removeTicket(id) {
    setTickets((s) => s.filter((t) => t.id !== id));
  }

  function getByUser(userId) {
    return tickets.filter((t) => Number(t.userId) === Number(userId));
  }

  return (
    <TicketsContext.Provider value={{ tickets, addTicket, removeTicket, getByUser }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  return useContext(TicketsContext);
}