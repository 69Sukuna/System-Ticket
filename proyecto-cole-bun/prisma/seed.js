import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Datos anteriores eliminados');

  // ============================================
  // 1. CREAR USUARIOS
  // ============================================
  console.log('👥 Creando usuarios...');

  const users = await prisma.user.createMany({
    data: [
      {
        id: 1,
        name: "Admin Demo",
        email: "admin@example.com",
        password: "admin123", // ⚠️ En producción, usar bcrypt
        role: "admin"
      },
      {
        id: 2,
        name: "Usuario Uno",
        email: "user1@example.com",
        password: "password1",
        role: "user"
      },
      {
        id: 3,
        name: "Usuario Dos",
        email: "user2@example.com",
        password: "password2",
        role: "eventManage"
      },
      {
        id: 4,
        name: "María García",
        email: "maria@example.com",
        password: "maria123",
        role: "user"
      },
      {
        id: 5,
        name: "Carlos López",
        email: "carlos@example.com",
        password: "carlos123",
        role: "user"
      }
    ],
  });

  console.log(`✅ ${users.count} usuarios creados`);

  // ============================================
  // 2. CREAR EVENTOS
  // ============================================
  console.log('🎉 Creando eventos...');

  await prisma.event.createMany({
    data: [
      {
        id: 1,
        title: "Concierto de Rock",
        date: "2024-07-15",
        location: "Madrid, España",
        description: "Únete a nosotros para una noche inolvidable de rock con bandas locales e internacionales. Un evento que promete emociones fuertes y la mejor música en vivo.",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        ticketTypes: [
          {
            tipo: "General",
            precio: 50,
            cantidad: 100,
            estado: "disponible"
          },
          {
            tipo: "VIP",
            precio: 150,
            cantidad: 50,
            estado: "disponible"
          }
        ]
      },
      {
        id: 2,
        title: "Feria de Tecnología",
        date: "2024-08-20",
        location: "Barcelona, España",
        description: "Descubre las últimas innovaciones tecnológicas, conoce startups revolucionarias y asiste a charlas de expertos en el sector tech.",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        ticketTypes: [
          {
            tipo: "General",
            precio: 20,
            cantidad: 200,
            estado: "disponible"
          },
          {
            tipo: "Premium",
            precio: 75,
            cantidad: 30,
            estado: "disponible"
          }
        ]
      },
      {
        id: 3,
        title: "Festival de Cine",
        date: "2024-09-10",
        location: "Valencia, España",
        description: "Una semana dedicada al séptimo arte con proyecciones de películas independientes, clásicos restaurados y encuentros con directores reconocidos.",
        image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
        ticketTypes: [
          {
            tipo: "General",
            precio: 30,
            cantidad: 150,
            estado: "disponible"
          },
          {
            tipo: "Pase Completo",
            precio: 120,
            cantidad: 40,
            estado: "disponible"
          }
        ]
      },
      {
        id: 4,
        title: "Maratón Ciudad 2024",
        date: "2024-10-05",
        location: "Sevilla, España",
        description: "Participa en la maratón más emocionante del año. 42km de recorrido por los lugares más emblemáticos de la ciudad. ¡Atrévete a superarte!",
        image: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80",
        ticketTypes: [
          {
            tipo: "Runner",
            precio: 35,
            cantidad: 500,
            estado: "disponible"
          },
          {
            tipo: "Elite",
            precio: 80,
            cantidad: 100,
            estado: "disponible"
          }
        ]
      },
      {
        id: 5,
        title: "Exposición de Arte Moderno",
        date: "2024-11-12",
        location: "Bilbao, España",
        description: "Una colección única de arte contemporáneo de artistas españoles e internacionales. Más de 100 obras que desafían los límites de la creatividad.",
        image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80",
        ticketTypes: [
          {
            tipo: "General",
            precio: 15,
            cantidad: 300,
            estado: "disponible"
          },
          {
            tipo: "Visita Guiada",
            precio: 40,
            cantidad: 50,
            estado: "disponible"
          }
        ]
      },
      {
        id: 6,
        title: "Stand Up Comedy Night",
        date: "2024-12-01",
        location: "Zaragoza, España",
        description: "Una noche de risas con los mejores comediantes del país. Show en vivo que te hará llorar de la risa. No apto para personas sin sentido del humor.",
        image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80",
        ticketTypes: [
          {
            tipo: "General",
            precio: 25,
            cantidad: 180,
            estado: "disponible"
          },
          {
            tipo: "Mesa VIP",
            precio: 60,
            cantidad: 20,
            estado: "disponible"
          }
        ]
      }
    ],
  });

  console.log('✅ 6 eventos creados');

  // ============================================
  // 3. CREAR TICKETS COMPRADOS (HISTORIAL)
  // ============================================
  console.log('🎫 Creando historial de tickets...');

  await prisma.ticket.createMany({
    data: [
      {
        id: "t-1",
        userId: 1,
        eventId: 1,
        eventTitle: "Concierto de Rock",
        date: "2024-07-15",
        price: 50,
        quantity: 2,
        purchasedAt: 1710000000000
      },
      {
        id: "t-2",
        userId: 2,
        eventId: 2,
        eventTitle: "Feria de Tecnología",
        date: "2024-08-20",
        price: 20,
        quantity: 1,
        purchasedAt: 1715000000000
      },
      {
        id: "t-3",
        userId: 3,
        eventId: 3,
        eventTitle: "Festival de Cine",
        date: "2024-09-10",
        price: 30,
        quantity: 3,
        purchasedAt: 1718000000000
      },
      {
        id: "t-4",
        userId: 2,
        eventId: 1,
        eventTitle: "Concierto de Rock",
        date: "2024-07-15",
        price: 150,
        quantity: 1,
        purchasedAt: 1720000000000
      },
      {
        id: "t-5",
        userId: 4,
        eventId: 4,
        eventTitle: "Maratón Ciudad 2024",
        date: "2024-10-05",
        price: 35,
        quantity: 2,
        purchasedAt: 1722000000000
      },
      {
        id: "t-6",
        userId: 5,
        eventId: 5,
        eventTitle: "Exposición de Arte Moderno",
        date: "2024-11-12",
        price: 15,
        quantity: 4,
        purchasedAt: 1724000000000
      },
      {
        id: "t-7",
        userId: 4,
        eventId: 6,
        eventTitle: "Stand Up Comedy Night",
        date: "2024-12-01",
        price: 60,
        quantity: 1,
        purchasedAt: 1726000000000
      },
      {
        id: "t-8",
        userId: 1,
        eventId: 3,
        eventTitle: "Festival de Cine",
        date: "2024-09-10",
        price: 120,
        quantity: 1,
        purchasedAt: 1728000000000
      }
    ],
  });

  console.log('✅ 8 tickets de compra creados');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n📊 RESUMEN DE DATOS CREADOS:');
  
  const totalUsers = await prisma.user.count();
  const totalEvents = await prisma.event.count();
  const totalTickets = await prisma.ticket.count();
  
  console.log(`   👥 Usuarios: ${totalUsers}`);
  console.log(`   🎉 Eventos: ${totalEvents}`);
  console.log(`   🎫 Tickets vendidos: ${totalTickets}`);
  
  console.log('\n✨ Seed completado exitosamente!\n');
  
  // Mostrar credenciales de acceso
  console.log('🔑 CREDENCIALES DE PRUEBA:');
  console.log('   Admin:');
  console.log('   - Email: admin@example.com');
  console.log('   - Password: admin123');
  console.log('   - Role: admin\n');
  console.log('   Usuario Normal:');
  console.log('   - Email: user1@example.com');
  console.log('   - Password: password1');
  console.log('   - Role: user\n');
  console.log('   Event Manager:');
  console.log('   - Email: user2@example.com');
  console.log('   - Password: password2');
  console.log('   - Role: eventManage\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });