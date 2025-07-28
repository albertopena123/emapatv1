// prisma/seed-maps.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMaps() {
  try {
    // Verificar si ya existe un mapa
    const existingMap = await prisma.map.findFirst()
    
    if (!existingMap) {
      console.log('Creando mapa principal...')
      
      const mainMap = await prisma.map.create({
        data: {
          name: 'Puerto Maldonado',
          description: 'Mapa principal del sistema de monitoreo de agua'
        }
      })
      
      console.log('Mapa creado:', mainMap.name)
      
      
     
      
      console.log('Ubicaciones de ejemplo creadas')
    } else {
      console.log('Ya existe un mapa en la base de datos')
    }
  } catch (error) {
    console.error('Error en seed de mapas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedMaps()
}

export { seedMaps }