"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";


export default function EventDetailPage({ params }) {
  const router = useRouter();

  // Estados
  const auth = useAuth();
  const [user, setUser] = useState(null); // null = no logueado, simula la sesión
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStep, setPaymentStep] = useState('review'); // 'review', 'qr', 'processing', 'success'
  const [qrCode, setQrCode] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  // Desenvuelve params
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10);


useEffect(() => {
  fetch(`/api/events/${eventId}`)
    .then(res => res.json())
    .then(data => {
      setEvent(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });

  // Paralelo: verificar usuario logueado
  fetch('/api/session')
    .then(res => res.json())
    .then(data => {
      setUser(data.user); // null si no hay sesión
    })
    .catch(err => {
      console.error(err);
      setUser(null);
    });
}, [eventId]);


  if (loading) return <div className="p-8 text-center">Cargando evento...</div>;
  if (!event) return <div className="p-8 text-center">Evento no encontrado.</div>;

  const entradas = event.ticketTypes || [];
  const selectedEntry = selectedEntryIndex !== null ? entradas[selectedEntryIndex] : null;
  const total = selectedEntry ? selectedEntry.precio * quantity : 0;

  // Funciones
  function handleSelectEntry(index) {
    setSelectedEntryIndex(index);
    setQuantity(1);
    setMessage(null);
  }

  function handleQuantityChange(e) {
    const val = Number(e.target.value);
    if (!selectedEntry) return;
    const max = Math.max(0, selectedEntry.cantidad);
    setQuantity(Math.min(Math.max(1, val), max));
  }

function openCheckout() {
  if (!auth.user) {
    setMessage({ type: "error", text: "Debes iniciar sesión para comprar." });
    return; // ⚠️ Esto evita que siga
  }

  // Resto de validaciones
  if (selectedEntryIndex === null) {
    setMessage({ type: "error", text: "Selecciona un tipo de entrada." });
    return;
  }
  if (quantity <= 0) {
    setMessage({ type: "error", text: "Selecciona una cantidad válida." });
    return;
  }
  if (selectedEntry.estado === "agotado" || selectedEntry.cantidad < quantity) {
    setMessage({ type: "error", text: "No hay suficientes entradas disponibles." });
    return;
  }

  // Generar número de orden y abrir checkout
  const order = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  setOrderNumber(order);
  setShowCheckout(true);
  setPaymentStep('review');
}



  function generateQR() {
    setPaymentStep('qr');
    const qrData = `https://qr-payment.com/pay?order=${orderNumber}&amount=${total}&merchant=EventTickets`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    setQrCode(qrUrl);
  }

function simulatePayment() {
    setPaymentStep('processing');
    setTimeout(async () => {
      try {
        // ✅ Obtener token del AuthProvider
        if (!auth.token) {
          throw new Error('No hay token de autenticación');
        }

        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}` // ✅ Usar token del AuthProvider
          },
          body: JSON.stringify({
            eventId: event.id,
            eventTitle: event.title,
            date: event.date,
            price: selectedEntry.precio,
            quantity: quantity,
            ticketTypeIndex: selectedEntryIndex
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al comprar');
        }

        // Recargar los datos del evento para obtener tickets actualizados
        const eventResponse = await fetch(`/api/events/${eventId}`);
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);

        setPaymentStep('success');
      } catch (error) {
        console.error('Error en compra:', error);
        setMessage({ type: "error", text: error.message || "Error al procesar la compra." });
        setPaymentStep('review');
        setShowCheckout(false);
      }
    }, 3000);
  }
  function closeCheckout() {
    setShowCheckout(false);
    setPaymentStep('review');
    setQrCode('');
    setSelectedEntryIndex(null);
    setQuantity(1);
    setMessage(null);
    router.push("/"); // redirige al home
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark font-display transition-colors">
      <main className="flex-grow p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{event.title}</h1>
            <p className="text-md text-slate-600 dark:text-slate-400 mb-2">{event.date} - {event.location}</p>
            <p className="text-slate-800 dark:text-slate-300 mb-4">{event.description}</p>
            {event.image && <img src={event.image} alt={event.title} className="w-full rounded-lg shadow mb-6 object-cover max-h-96" />}
          </div>

          <aside className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Comprar Entradas</h2>

            {entradas.length === 0 && <p className="text-slate-600 dark:text-slate-300">No hay entradas disponibles.</p>}

            <div className="space-y-3">
              {entradas.map((entrada, idx) => (
                <label
                  key={idx}
                  className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedEntryIndex === idx ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="entrada"
                      checked={selectedEntryIndex === idx}
                      onChange={() => handleSelectEntry(idx)}
                      disabled={entrada.estado === "agotado" || entrada.cantidad <= 0}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{entrada.tipo.trim()}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Bs.{entrada.precio} • {entrada.estado === "agotado" || entrada.cantidad <= 0 ? "Agotado" : `${entrada.cantidad} disponibles`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Bs.{entrada.precio}</div>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                disabled={!selectedEntry || selectedEntry.estado === "agotado"}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Total</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">Bs.{total}</div>
              </div>
              <button
                onClick={openCheckout}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedEntry || selectedEntry.estado === "agotado" || quantity <= 0}
              >
                Continuar
              </button>
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded ${
                  message.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md shadow-2xl">
            {/* Review Step */}
            {paymentStep === 'review' && (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Confirmar Compra</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Evento:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{event.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tipo de entrada:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{selectedEntry.tipo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Cantidad:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Precio unitario:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Bs.{selectedEntry.precio}</span>
                  </div>
                  <hr className="dark:border-slate-700" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-slate-900 dark:text-white">Total:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">Bs.{total}</span>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg mb-6">
                  <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Orden:</strong> {orderNumber}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={generateQR}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Pagar con QR
                  </button>
                </div>
              </div>
            )}

            {/* QR Step */}
            {paymentStep === 'qr' && (
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Escanea el código QR</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Usa tu app de pagos para escanear el código</p>
                <div className="bg-white p-4 rounded-lg inline-block mb-6">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg mb-6">
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Monto a pagar: Bs.{total}</p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">Orden: {orderNumber}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentStep('review')}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={simulatePayment}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    ✓ Ya pagué
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {paymentStep === 'processing' && (
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Verificando pago...</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Por favor espera mientras confirmamos tu transacción</p>
              </div>
            )}

            {/* Success Step */}
            {paymentStep === 'success' && (
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="inline-block rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                    <svg className="w-16 h-16 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">¡Compra exitosa!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Tu compra ha sido procesada correctamente</p>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6 text-left">
                  <p className="text-sm mb-2"><strong className="text-slate-900 dark:text-white">Orden:</strong> {orderNumber}</p>
                  <p className="text-sm mb-2"><strong className="text-slate-900 dark:text-white">Evento:</strong> {event.title}</p>
                  <p className="text-sm mb-2"><strong className="text-slate-900 dark:text-white">Entradas:</strong> {quantity} x {selectedEntry.tipo}</p>
                  <p className="text-sm"><strong className="text-slate-900 dark:text-white">Total pagado:</strong> Bs.{total}</p>
                </div>

                <button
                  onClick={closeCheckout}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
