"use client";
import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function SalesReportPage() {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No hay sesión activa. Por favor inicia sesión.');
        setLoading(false);
        return;
      }
      
      const [ticketsRes, eventsRes] = await Promise.all([
        fetch('/api/admin/all-tickets', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/events')
      ]);
      
      if (!ticketsRes.ok) {
        if (ticketsRes.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (ticketsRes.status === 403) {
          throw new Error('No tienes permisos de administrador.');
        }
        throw new Error('Error al cargar tickets');
      }
      
      if (!eventsRes.ok) {
        throw new Error('Error al cargar eventos');
      }
      
      const [ticketsData, eventsData] = await Promise.all([
        ticketsRes.json(),
        eventsRes.json()
      ]);
      
      // Manejar diferentes formatos de respuesta del API
      const ticketsList = Array.isArray(ticketsData) ? ticketsData : (ticketsData.data || []);
      const eventsList = Array.isArray(eventsData) ? eventsData : (eventsData.data || []);
      
      setTickets(ticketsList);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar y ordenar tickets (memoizado para optimización)
  const filteredAndSortedTickets = useMemo(() => {
    // Asegurarse de que tickets sea un array
    if (!Array.isArray(tickets)) {
      return [];
    }
    
    let filtered = tickets.filter(ticket => {
      let matches = true;
      
      if (selectedEvent !== "all") {
        matches = matches && ticket.eventId === parseInt(selectedEvent);
      }
      
      if (dateFrom) {
        // purchasedAt puede ser timestamp o Date
        const ticketDate = new Date(ticket.purchasedAt);
        const fromDate = new Date(dateFrom);
        matches = matches && ticketDate >= fromDate;
      }
      
      if (dateTo) {
        const ticketDate = new Date(ticket.purchasedAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matches = matches && ticketDate <= toDate;
      }
      
      return matches;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.purchasedAt) - new Date(b.purchasedAt);
          break;
        case 'event':
          comparison = (a.eventTitle || '').localeCompare(b.eventTitle || '');
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'total':
          comparison = (a.price * a.quantity) - (b.price * b.quantity);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tickets, selectedEvent, dateFrom, dateTo, sortBy, sortOrder]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalTickets = filteredAndSortedTickets.reduce((sum, t) => sum + t.quantity, 0);
    const totalRevenue = filteredAndSortedTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    const totalTransactions = filteredAndSortedTickets.length;
    const averageTicketPrice = totalTransactions > 0 
      ? filteredAndSortedTickets.reduce((sum, t) => sum + t.price, 0) / totalTransactions 
      : 0;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalTickets,
      totalRevenue,
      totalTransactions,
      averageTicketPrice,
      averageTransactionValue
    };
  }, [filteredAndSortedTickets]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    // Validar que ambos sean arrays
    if (!Array.isArray(events) || !Array.isArray(filteredAndSortedTickets)) {
      return { salesByEvent: [], timelineData: [], topEvents: [] };
    }
    
    // Ventas por evento
    const salesByEvent = events.map(event => {
      const eventTickets = filteredAndSortedTickets.filter(t => t.eventId === event.id);
      const quantity = eventTickets.reduce((sum, t) => sum + t.quantity, 0);
      const revenue = eventTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
      
      return {
        name: event.title.substring(0, 20),
        fullName: event.title,
        tickets: quantity,
        ingresos: revenue
      };
    }).filter(item => item.tickets > 0);

    // Ventas por fecha (timeline)
    const salesByDate = {};
    filteredAndSortedTickets.forEach(ticket => {
      const date = new Date(ticket.purchasedAt).toLocaleDateString('es-ES');
      if (!salesByDate[date]) {
        salesByDate[date] = { date, tickets: 0, ingresos: 0 };
      }
      salesByDate[date].tickets += ticket.quantity;
      salesByDate[date].ingresos += ticket.price * ticket.quantity;
    });
    const timelineData = Object.values(salesByDate).sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA - dateB;
    });

    // Top 5 eventos
    const topEvents = [...salesByEvent]
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    return { salesByEvent, timelineData, topEvents };
  }, [events, filteredAndSortedTickets]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }

 function exportToCSV() {
  // Usar punto y coma como delimitador (mejor para Excel en español)
  const headers = ['Fecha', 'Evento', 'Usuario', 'Cantidad', 'Precio Unitario', 'Total'];
  const rows = filteredAndSortedTickets.map(ticket => [
    new Date(ticket.purchasedAt).toLocaleDateString('es-ES'),
    (ticket.eventTitle || 'Sin título').replace(/;/g, ','), // Reemplazar punto y coma en el título
    ticket.userName || `Usuario #${ticket.userId}`,
    ticket.quantity,
    ticket.price.toFixed(2),
    (ticket.price * ticket.quantity).toFixed(2)
  ]);

  // Usar punto y coma como separador
  const csv = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  // BOM para UTF-8 + contenido
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
  function printReport() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 no-print">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Reporte de Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis detallado de tickets vendidos y ingresos generados
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 no-print">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filtros
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evento
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos los eventos</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setSelectedEvent("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tickets</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.totalTickets}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Bs.{stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transacciones</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Precio Promedio</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  Bs.{stats.averageTicketPrice.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Promedio</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Bs.{stats.averageTransactionValue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        {chartData.salesByEvent.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ventas por Evento
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.salesByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend />
                  <Bar dataKey="tickets" fill="#6366f1" name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {chartData.topEvents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top 5 Eventos por Ingresos
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.topEvents}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="ingresos"
                    >
                      {chartData.topEvents.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      formatter={(value) => `Bs.${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Timeline de ventas */}
        {chartData.timelineData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tendencia de Ventas
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="tickets" stroke="#6366f1" name="Tickets" strokeWidth={2} />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" name="Ingresos (Bs.)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabla de transacciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalle de Transacciones ({filteredAndSortedTickets.length})
            </h3>
            <div className="flex gap-2 no-print">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
              <button
                onClick={printReport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Fecha
                      {sortBy === 'date' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('event')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Evento
                      {sortBy === 'event' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th 
                    onClick={() => handleSort('quantity')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Cantidad
                      {sortBy === 'quantity' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th 
                    onClick={() => handleSort('total')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Total
                      {sortBy === 'total' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                          No hay transacciones para mostrar
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                          Intenta ajustar los filtros
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(ticket.purchasedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {ticket.eventTitle || 'Sin título'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {ticket.userName || `#${ticket.userId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {ticket.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        Bs.{ticket.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        Bs.{(ticket.price * ticket.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredAndSortedTickets.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.totalTickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      —
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                      Bs.{stats.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .dark\\:bg-gray-900 {
            background-color: white !important;
          }
          .dark\\:bg-gray-800 {
            background-color: white !important;
          }
          .dark\\:text-white {
            color: black !important;
          }
          .dark\\:text-gray-400 {
            color: #666 !important;
          }
        }
      `}</style>
    </div>
  );
}