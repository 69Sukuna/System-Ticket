import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, password: true, role: true },
    });

    if (!user) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });

    const isValid = password === user.password; // bcrypt en producción
    if (!isValid) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });

    // ✅ Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    // ✅ Devolver tanto user como token
    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword,
      token: token // ✅ El token JWT generado
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}