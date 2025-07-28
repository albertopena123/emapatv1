// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { seedMaps } from './seed-maps';

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
    { name: 'locations', displayName: 'Instalacion Sensor', icon: 'MapPin', orderIndex: 5 },
    { name: 'maps', displayName: 'Mapas', icon: 'Map', orderIndex: 6 },
    { name: 'tariffs', displayName: 'Tarifas', icon: 'Calculator', orderIndex: 7 }, // ✅ NUEVO MÓDULO
    { name: 'consumption', displayName: 'Consumo', icon: 'Droplet', orderIndex: 8 },
    { name: 'billing', displayName: 'Facturación', icon: 'DollarSign', orderIndex: 9 },
    { name: 'alarms', displayName: 'Alarmas', icon: 'Bell', orderIndex: 10 },
    { name: 'maintenance', displayName: 'Mantenimiento', icon: 'Wrench', orderIndex: 11 },
    { name: 'reports', displayName: 'Reportes', icon: 'FileText', orderIndex: 12 },
    { name: 'settings', displayName: 'Configuración', icon: 'Settings', orderIndex: 13 }
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

  // 4. Crear mapas y ubicaciones iniciales
  await seedMaps();
  console.log('✅ Mapas y ubicaciones creados');

  // 5. Crear categorías tarifarias
  const tariffCategories = [
    { name: 'RESIDENTIAL', displayName: 'Doméstico', description: 'Uso residencial' },
    { name: 'COMMERCIAL', displayName: 'Comercial', description: 'Uso comercial' },
    { name: 'INDUSTRIAL', displayName: 'Industrial', description: 'Uso industrial' },
    { name: 'SOCIAL', displayName: 'Social', description: 'Uso social/beneficencia' }
  ];

  const createdCategories = [];
  for (const category of tariffCategories) {
    const createdCategory = await prisma.tariffCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
    createdCategories.push(createdCategory);
  }

  console.log('✅ Categorías tarifarias creadas');

  // 6. Crear tarifas por categoría
  const tariffsData = [
    // TARIFAS DOMÉSTICAS
    {
      categoryName: 'RESIDENTIAL',
      tariffs: [
        {
          name: 'Doméstico - Rango 1',
          description: 'Consumo básico residencial (0-20 m³)',
          minConsumption: 0,
          maxConsumption: 20,
          waterCharge: 1.50,
          sewerageCharge: 0.45,
          fixedCharge: 8.50,
          assignedVolume: 20
        },
        {
          name: 'Doméstico - Rango 2',
          description: 'Consumo medio residencial (21-50 m³)',
          minConsumption: 21,
          maxConsumption: 50,
          waterCharge: 2.20,
          sewerageCharge: 0.66,
          fixedCharge: 8.50,
          assignedVolume: 30
        },
        {
          name: 'Doméstico - Rango 3',
          description: 'Consumo alto residencial (51+ m³)',
          minConsumption: 51,
          maxConsumption: null,
          waterCharge: 3.80,
          sewerageCharge: 1.14,
          fixedCharge: 8.50,
          assignedVolume: 50
        }
      ]
    },
    // TARIFAS COMERCIALES
    {
      categoryName: 'COMMERCIAL',
      tariffs: [
        {
          name: 'Comercial - Pequeño',
          description: 'Comercio menor (0-30 m³)',
          minConsumption: 0,
          maxConsumption: 30,
          waterCharge: 2.80,
          sewerageCharge: 0.84,
          fixedCharge: 15.00,
          assignedVolume: 30
        },
        {
          name: 'Comercial - Mediano',
          description: 'Comercio mediano (31-100 m³)',
          minConsumption: 31,
          maxConsumption: 100,
          waterCharge: 4.20,
          sewerageCharge: 1.26,
          fixedCharge: 15.00,
          assignedVolume: 70
        },
        {
          name: 'Comercial - Grande',
          description: 'Comercio grande (101+ m³)',
          minConsumption: 101,
          maxConsumption: null,
          waterCharge: 5.50,
          sewerageCharge: 1.65,
          fixedCharge: 15.00,
          assignedVolume: 150
        }
      ]
    },
    // TARIFAS INDUSTRIALES
    {
      categoryName: 'INDUSTRIAL',
      tariffs: [
        {
          name: 'Industrial - Básico',
          description: 'Industria básica (0-200 m³)',
          minConsumption: 0,
          maxConsumption: 200,
          waterCharge: 3.50,
          sewerageCharge: 1.05,
          fixedCharge: 25.00,
          assignedVolume: 200
        },
        {
          name: 'Industrial - Intensivo',
          description: 'Industria intensiva (201+ m³)',
          minConsumption: 201,
          maxConsumption: null,
          waterCharge: 6.80,
          sewerageCharge: 2.04,
          fixedCharge: 25.00,
          assignedVolume: 500
        }
      ]
    },
    // TARIFAS SOCIALES
    {
      categoryName: 'SOCIAL',
      tariffs: [
        {
          name: 'Social - Beneficencia',
          description: 'Uso social y beneficencia',
          minConsumption: 0,
          maxConsumption: null,
          waterCharge: 0.80,
          sewerageCharge: 0.24,
          fixedCharge: 5.00,
          assignedVolume: 15
        }
      ]
    }
  ];

  for (const categoryData of tariffsData) {
    const category = createdCategories.find(c => c.name === categoryData.categoryName);
    if (category) {
      for (const tariffData of categoryData.tariffs) {
        await prisma.tariff.create({
          data: {
            ...tariffData,
            tariffCategoryId: category.id
          }
        });
      }
    }
  }

  console.log('✅ Tarifas creadas por categoría');

  // 7. Crear usuario Super Admin
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

  // 8. Crear permisos para cada módulo
  for (const createdModule of createdModules) {
    const actions = ['create', 'read', 'update', 'delete', 'export'];
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

  // 9. Verificación
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