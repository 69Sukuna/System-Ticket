import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Esta ruta verifica si hay una sesión activa basada en el token JWT
export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verificar token
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
      console.error('Token inválido:', error);
      return NextResponse.json({ user: null }, { status: 200 });
    }

  } catch (error) {
    console.error('Error en /api/session:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}