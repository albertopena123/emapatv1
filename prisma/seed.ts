// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed con Argon2...');

  // 1. Crear rol de Super Admin
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      displayName: 'Super Administrador',
      description: 'Acceso total al sistema',
      isSystem: true,
      priority: 100
    }
  });

  // 2. Crear módulos principales
  const modules = [
    { name: 'dashboard', displayName: 'Dashboard', icon: 'Home', orderIndex: 1 },
    { name: 'users', displayName: 'Usuarios', icon: 'Users', orderIndex: 2 },
    { name: 'roles', displayName: 'Roles y Permisos', icon: 'Shield', orderIndex: 3 },
    { name: 'sensors', displayName: 'Sensores', icon: 'Cpu', orderIndex: 4 },
    { name: 'billing', displayName: 'Facturación', icon: 'DollarSign', orderIndex: 5 },
    { name: 'reports', displayName: 'Reportes', icon: 'FileText', orderIndex: 6 },
    { name: 'settings', displayName: 'Configuración', icon: 'Settings', orderIndex: 7 }
  ];

  const createdModules = [];
  for (const moduleData of modules) {
    const createdModule = await prisma.module.upsert({
      where: { name: moduleData.name },
      update: {},
      create: moduleData
    });
    createdModules.push(createdModule);
  }

  console.log('✅ Módulos creados');

  // 3. Asignar todos los módulos al rol super_admin
  for (const createdModule of createdModules) {
    await prisma.roleModule.upsert({
      where: {
        roleId_moduleId: {
          roleId: superAdminRole.id,
          moduleId: createdModule.id
        }
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        moduleId: createdModule.id,
        canAccess: true
      }
    });
  }

  console.log('✅ Módulos asignados al rol Super Admin');

  // 4. Crear categoría tarifaria (para futuros sensores)
  await prisma.tariffCategory.upsert({
    where: { name: 'RESIDENTIAL' },
    update: {},
    create: {
      name: 'RESIDENTIAL',
      displayName: 'Doméstico',
      description: 'Uso residencial'
    }
  });

  // 5. Crear usuario Super Admin
  const hashedPassword = await argon2.hash('Admin123!', {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
  });
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      dni: '00000000',
      name: 'Super Administrador',
      password: hashedPassword,
      isSuperAdmin: true,
      isActive: true,
      emailVerified: new Date(),
      roleId: superAdminRole.id
    }
  });

  console.log('✅ Super Admin creado:', {
    email: superAdmin.email,
    password: 'Admin123!',
    hashInfo: 'Usando Argon2id con configuración OWASP'
  });

  // 6. Crear permisos para cada módulo
  for (const createdModule of createdModules) {
    const actions = ['create', 'read', 'update', 'delete'];
    for (const action of actions) {
      const permission = await prisma.permission.create({
        data: {
          moduleId: createdModule.id,
          action: action,
          resource: createdModule.name,
          description: `${action} permission for ${createdModule.name}`
        }
      });

      // Asignar permisos al rol super_admin
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      });
    }
  }

  console.log('✅ Permisos creados y asignados');

  // 7. Verificación
  const isValidPassword = await argon2.verify(hashedPassword, 'Admin123!');
  console.log('🔐 Verificación de password:', isValidPassword ? 'OK' : 'ERROR');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });