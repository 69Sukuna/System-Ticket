import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: password,
        role: 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      token: token,
      message: 'Usuario registrado exitosamente'
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}