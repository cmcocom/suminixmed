import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ProtectedPage from '@/app/components/ProtectedPage';
import DynamicReportPage from '@/app/components/DynamicReportPage';
import { TipoRol } from '@/lib/tipo-rol';

interface ReportPageProps {
  params: {
    slug: string;
  };
}

async function getReportConfig(slug: string) {
  try {
    const report = await prisma.generated_reports.findUnique({
      where: { slug },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return report;
  } catch (error) {
    return null;
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    notFound();
  }

  const reportConfig = await getReportConfig(params.slug);

  if (!reportConfig) {
    notFound();
  }

  // Transform the report config to match the expected interface
  const transformedReportConfig = {
    ...reportConfig,
    user: reportConfig.User,
  };

  // Verificar permisos del usuario
  const allowedRoles = reportConfig.allowed_roles || [];
  const rolesArray = (session.user.roles as string[] | undefined) || [];
  const primaryRole = session.user.primaryRole as string | undefined;
  const enumValues = Object.values(TipoRol) as string[];
  const effectiveRoles = [
    ...rolesArray.filter((r) => enumValues.includes(r)),
    ...(primaryRole && enumValues.includes(primaryRole) ? [primaryRole] : []),
  ] as TipoRol[];

  if (!effectiveRoles.some((r) => allowedRoles.includes(r))) {
    notFound();
  }

  return (
    <ProtectedPage requiredRoles={allowedRoles as TipoRol[]}>
      <DynamicReportPage reportConfig={transformedReportConfig} />
    </ProtectedPage>
  );
}

// Generar metadata dinámicamente
export async function generateMetadata({ params }: ReportPageProps) {
  const reportConfig = await getReportConfig(params.slug);

  if (!reportConfig) {
    return {
      title: 'Reporte no encontrado',
    };
  }

  return {
    title: `${reportConfig.name} | SuminixMed`,
    description: reportConfig.description || `Reporte dinámico: ${reportConfig.name}`,
  };
}
