import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Obtener tickets de un usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    // Obtener todos los tickets del usuario
    const tickets = await prisma.ticket.findMany({
      where: { 
        userId: parseInt(userId) 
      },
      orderBy: {
        purchasedAt: 'desc' // Más recientes primero
      }
    });

    return NextResponse.json(tickets);

  } catch (error: any) {
    console.error('❌ Error obteniendo tickets:', error);
    return NextResponse.json({ error: 'Error al obtener tickets: ' + error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Crear un nuevo ticket (el código que ya tienes)
export async function POST(request: Request) {
  try {
    // ✅ Leer token del header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let user: any;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (error) {
      console.error('Error al verificar token:', error);
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, ticketTypeIndex, quantity, eventTitle, date, price } = body;

    if (!eventId || ticketTypeIndex === undefined || !quantity) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Obtener evento
    const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    // Parsear ticketTypes
    let ticketTypes: any[] = [];
    if (typeof event.ticketTypes === 'string') {
      ticketTypes = JSON.parse(event.ticketTypes);
    } else if (Array.isArray(event.ticketTypes)) {
      ticketTypes = event.ticketTypes;
    } else {
      return NextResponse.json({ error: 'ticketTypes inválido' }, { status: 500 });
    }

    const selectedTicket = ticketTypes[ticketTypeIndex];
    if (!selectedTicket) return NextResponse.json({ error: 'Tipo de ticket inválido' }, { status: 400 });

    if (selectedTicket.cantidad < quantity) {
      return NextResponse.json({ error: `Solo quedan ${selectedTicket.cantidad} tickets disponibles` }, { status: 400 });
    }

    // ✅ Decrementar cantidad
    ticketTypes[ticketTypeIndex].cantidad -= quantity;

    // Marcar "agotado" si llega a 0
    if (ticketTypes[ticketTypeIndex].cantidad <= 0) {
      ticketTypes[ticketTypeIndex].cantidad = 0;
      ticketTypes[ticketTypeIndex].estado = "agotado";
    }

    // Actualizar evento en DB
    await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: { ticketTypes: ticketTypes }
    });

    // Crear ticket del usuario
    const newTicket = await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId: parseInt(eventId),
        eventTitle,
        date: date || '',
        price: parseFloat(price),
        quantity: parseInt(quantity),
        purchasedAt: Date.now()
      }
    });

    return NextResponse.json(newTicket, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error en /api/tickets:', error);
    return NextResponse.json({ error: 'Error al crear ticket: ' + error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}