import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { valid: boolean; user?: any; error?: string } {
  if (!authHeader) {
    return { valid: false, error: 'No autenticado' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return { valid: false, error: 'No autenticado' };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return { valid: true, user };
  } catch (error) {
    return { valid: false, error: 'Token inválido o expirado' };
  }
}

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    const { valid, user, error } = verifyToken(authHeader);

    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Verificar que sea admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador para acceder a este recurso' }, 
        { status: 403 }
      );
    }

    // Obtener todos los tickets (sin relaciones)
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        purchasedAt: 'desc'
      }
    });

    // Obtener IDs únicos
    const eventIds = [...new Set(tickets.map(t => t.eventId))];
    const userIds = [...new Set(tickets.map(t => t.userId))];

    // Obtener eventos y usuarios en paralelo
    const [events, users] = await Promise.all([
      prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          description: true
        }
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })
    ]);

    // Crear mapas para búsqueda rápida
    const eventMap = new Map(events.map(e => [e.id, e]));
    const userMap = new Map(users.map(u => [u.id, u]));

    // Transformar datos
    const ticketsWithInfo = tickets.map(ticket => {
      const event = eventMap.get(ticket.eventId);
      const ticketUser = userMap.get(ticket.userId);

      return {
        id: ticket.id,
        // Información del usuario
        userId: ticket.userId,
        userName: ticketUser?.name || 'Usuario desconocido',
        userEmail: ticketUser?.email || '',
        userRole: ticketUser?.role || 'user',
        // Información del evento
        eventId: ticket.eventId,
        eventTitle: event?.title || ticket.eventTitle || 'Evento no encontrado',
        eventDate: event?.date || ticket.date || '',
        eventLocation: event?.location || '',
        eventDescription: event?.description || '',
        // Información del ticket
        quantity: ticket.quantity,
        price: ticket.price,
        total: ticket.price * ticket.quantity,
        date: ticket.date,
        purchasedAt: ticket.purchasedAt,
        createdAt: ticket.createdAt
      };
    });

    // Calcular estadísticas generales
    const stats = {
      totalTickets: tickets.reduce((sum, t) => sum + t.quantity, 0),
      totalRevenue: tickets.reduce((sum, t) => sum + (t.price * t.quantity), 0),
      totalTransactions: tickets.length,
      averageTicketPrice: tickets.length > 0 
        ? tickets.reduce((sum, t) => sum + t.price, 0) / tickets.length 
        : 0,
      averageTransactionValue: tickets.length > 0
        ? tickets.reduce((sum, t) => sum + (t.price * t.quantity), 0) / tickets.length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: ticketsWithInfo,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo tickets:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al obtener tickets',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint POST para obtener estadísticas filtradas
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    const { valid, user, error } = verifyToken(authHeader);

    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 403 }
      );
    }

    // Obtener filtros del body
    const body = await request.json();
    const { eventId, dateFrom, dateTo } = body;

    // Construir filtros dinámicos
    const where: any = {};

    if (eventId && eventId !== 'all') {
      where.eventId = parseInt(eventId);
    }

    if (dateFrom || dateTo) {
      where.purchasedAt = {};
      if (dateFrom) {
        where.purchasedAt.gte = new Date(dateFrom).getTime();
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.purchasedAt.lte = toDate.getTime();
      }
    }

    // Obtener tickets filtrados
    const tickets = await prisma.ticket.findMany({ where });

    // Obtener eventos relacionados
    const eventIds = [...new Set(tickets.map(t => t.eventId))];
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, title: true }
    });

    const eventMap = new Map(events.map(e => [e.id, e]));

    // Calcular estadísticas
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
    const totalRevenue = tickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    const totalTransactions = tickets.length;

    // Ventas por evento
    const salesByEventMap = new Map<number, any>();
    tickets.forEach(ticket => {
      const eventId = ticket.eventId;
      if (!salesByEventMap.has(eventId)) {
        const event = eventMap.get(eventId);
        salesByEventMap.set(eventId, {
          eventId,
          eventTitle: event?.title || 'Sin título',
          tickets: 0,
          revenue: 0,
          transactions: 0
        });
      }
      const eventData = salesByEventMap.get(eventId)!;
      eventData.tickets += ticket.quantity;
      eventData.revenue += ticket.price * ticket.quantity;
      eventData.transactions += 1;
    });

    // Ventas por fecha
    const salesByDateMap = new Map<string, any>();
    tickets.forEach(ticket => {
      const date = new Date(ticket.purchasedAt).toISOString().split('T')[0];
      if (!salesByDateMap.has(date)) {
        salesByDateMap.set(date, {
          date,
          tickets: 0,
          revenue: 0,
          transactions: 0
        });
      }
      const dateData = salesByDateMap.get(date)!;
      dateData.tickets += ticket.quantity;
      dateData.revenue += ticket.price * ticket.quantity;
      dateData.transactions += 1;
    });

    const stats = {
      totalTickets,
      totalRevenue,
      totalTransactions,
      averageTicketPrice: totalTransactions > 0 
        ? tickets.reduce((sum, t) => sum + t.price, 0) / totalTransactions 
        : 0,
      averageTransactionValue: totalTransactions > 0 
        ? totalRevenue / totalTransactions 
        : 0,
      salesByEvent: Array.from(salesByEventMap.values()),
      salesByDate: Array.from(salesByDateMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      )
    };

    return NextResponse.json({
      success: true,
      stats,
      filters: { eventId, dateFrom, dateTo },
      ticketCount: tickets.length
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener estadísticas',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}