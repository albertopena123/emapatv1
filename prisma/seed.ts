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
    { name: 'tariffs', displayName: 'Tarifas', icon: 'Calculator', orderIndex: 7 },
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

  // 5. Crear las 2 categorías tarifarias principales según EMAPAT
  const tariffCategories = [
    { 
      name: 'RESIDENCIAL', 
      displayName: 'Residencial', 
      description: 'Uso doméstico y social' 
    },
    { 
      name: 'NO_RESIDENCIAL', 
      displayName: 'No Residencial', 
      description: 'Uso comercial, industrial y estatal' 
    }
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

  // 6. Crear tarifas según la tabla de EMAPAT
  const tariffsData = [
    // TARIFAS RESIDENCIALES
    {
      categoryName: 'RESIDENCIAL',
      tariffs: [
        // SOCIAL
        {
          name: 'Social - 0 a más',
          description: 'Tarifa social subsidiada',
          minConsumption: 0,
          maxConsumption: null,
          waterCharge: 2.220,
          sewerageCharge: 1.000,
          fixedCharge: 5.300,
          assignedVolume: 20
        },
        // DOMÉSTICO
        {
          name: 'Doméstico - 0 a 8 m³',
          description: 'Consumo doméstico básico',
          minConsumption: 0,
          maxConsumption: 8,
          waterCharge: 2.260,
          sewerageCharge: 1.000,
          fixedCharge: 5.300,
          assignedVolume: 0
        },
        {
          name: 'Doméstico - 8 a 20 m³',
          description: 'Consumo doméstico medio',
          minConsumption: 8,
          maxConsumption: 20,
          waterCharge: 2.910,
          sewerageCharge: 1.310,
          fixedCharge: 5.300,
          assignedVolume: 20
        },
        {
          name: 'Doméstico - 20 a más m³',
          description: 'Consumo doméstico alto',
          minConsumption: 20,
          maxConsumption: null,
          waterCharge: 5.670,
          sewerageCharge: 2.560,
          fixedCharge: 5.300,
          assignedVolume: 0
        }
      ]
    },
    // TARIFAS NO RESIDENCIALES
    {
      categoryName: 'NO_RESIDENCIAL',
      tariffs: [
        // COMERCIAL Y OTROS
        {
          name: 'Comercial - 0 a 30 m³',
          description: 'Consumo comercial básico',
          minConsumption: 0,
          maxConsumption: 30,
          waterCharge: 5.670,
          sewerageCharge: 2.560,
          fixedCharge: 5.300,
          assignedVolume: 30
        },
        {
          name: 'Comercial - 30 a más m³',
          description: 'Consumo comercial excedente',
          minConsumption: 30,
          maxConsumption: null,
          waterCharge: 8.040,
          sewerageCharge: 3.630,
          fixedCharge: 5.300,
          assignedVolume: 0
        },
        // INDUSTRIAL
        {
          name: 'Industrial - 0 a 100 m³',
          description: 'Consumo industrial básico',
          minConsumption: 0,
          maxConsumption: 100,
          waterCharge: 8.040,
          sewerageCharge: 3.630,
          fixedCharge: 5.300,
          assignedVolume: 80
        },
        {
          name: 'Industrial - 100 a más m³',
          description: 'Consumo industrial intensivo',
          minConsumption: 100,
          maxConsumption: null,
          waterCharge: 9.640,
          sewerageCharge: 4.350,
          fixedCharge: 5.300,
          assignedVolume: 0
        },
        // ESTATAL
        {
          name: 'Estatal - 0 a 60 m³',
          description: 'Consumo estatal básico',
          minConsumption: 0,
          maxConsumption: 60,
          waterCharge: 5.670,
          sewerageCharge: 2.560,
          fixedCharge: 5.300,
          assignedVolume: 100
        },
        {
          name: 'Estatal - 60 a más m³',
          description: 'Consumo estatal excedente',
          minConsumption: 60,
          maxConsumption: null,
          waterCharge: 6.250,
          sewerageCharge: 2.820,
          fixedCharge: 5.300,
          assignedVolume: 0
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

  console.log('✅ Tarifas creadas según estructura EMAPAT');

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
  
  // 10. Mostrar resumen de tarifas creadas
  console.log('\n📊 Resumen de tarifas EMAPAT:');
  console.log('- RESIDENCIAL:');
  console.log('  • Social: 1 rango (0 a más)');
  console.log('  • Doméstico: 3 rangos (0-8, 8-20, 20+)');
  console.log('- NO RESIDENCIAL:');
  console.log('  • Comercial y Otros: 2 rangos (0-30, 30+)');
  console.log('  • Industrial: 2 rangos (0-100, 100+)');
  console.log('  • Estatal: 2 rangos (0-60, 60+)');
  console.log('Total: 10 tarifas creadas');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });