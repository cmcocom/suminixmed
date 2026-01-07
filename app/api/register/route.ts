import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generarClaveUsuario } from '@/lib/generar-clave-usuario';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password, name } = data;

    // Validaciones mejoradas
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    // Validar longitud de la contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar clave automática con formato cve-XXXXXX
    const clave = await generarClaveUsuario();

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        clave,
        email,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Usuario registrado exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
  }
}
