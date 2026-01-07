import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { removeActiveSession } from '@/lib/sessionTracker';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { tabId } = await req.json();
    if (!tabId) {
      return NextResponse.json({ error: 'tabId requerido' }, { status: 400 });
    }

    await removeActiveSession(session.user.id, tabId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
