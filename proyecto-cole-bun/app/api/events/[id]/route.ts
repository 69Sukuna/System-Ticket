import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener un evento específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params antes de usarlo
    const { id } = await params;
    
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }
    
    // Parsear ticketTypes si es necesario
    const eventWithParsedTickets = {
      ...event,
      ticketTypes: typeof event.ticketTypes === 'string'
        ? JSON.parse(event.ticketTypes)
        : event.ticketTypes
    };
    
    return NextResponse.json(eventWithParsedTickets);
  } catch (error) {
    console.error('Error al cargar evento:', error);
    return NextResponse.json(
      { error: 'Error al cargar evento' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Actualizar un evento
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params antes de usarlo
    const { id } = await params;
    const body = await request.json();
    const { title, date, location, description, image, ticketTypes } = body;

    console.log('Actualizando evento con ticketTypes:', ticketTypes);

    // Validación básica
    if (!title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el evento
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
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
      ...updatedEvent,
      ticketTypes: typeof updatedEvent.ticketTypes === 'string'
        ? JSON.parse(updatedEvent.ticketTypes)
        : updatedEvent.ticketTypes
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return NextResponse.json(
      { error: 'Error al actualizar evento' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Eliminar un evento
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params antes de usarlo
    const { id } = await params;
    
    // Verificar si el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el evento
    await prisma.event.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json(
      { message: 'Evento eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar evento' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}