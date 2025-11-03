import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar todos los eventos
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    
    // Parsear ticketTypes de JSON a objeto
    const eventsWithParsedTickets = events.map(event => ({
      ...event,
      ticketTypes: typeof event.ticketTypes === 'string' 
        ? JSON.parse(event.ticketTypes) 
        : event.ticketTypes
    }));
    
    return NextResponse.json(eventsWithParsedTickets);
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    return NextResponse.json(
      { error: 'Error al cargar eventos' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Crear nuevo evento
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, date, location, description, image, ticketTypes } = body;

    console.log('Creando evento con ticketTypes:', ticketTypes);

    // Validación básica
    if (!title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        date: date || '',
        location: location || '',
        description: description || '',
        image: image || '',
        ticketTypes: ticketTypes || []
      }
    });

    return NextResponse.json({
      ...newEvent,
      ticketTypes: typeof newEvent.ticketTypes === 'string'
        ? JSON.parse(newEvent.ticketTypes)
        : newEvent.ticketTypes
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { error: 'Error al crear evento' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}