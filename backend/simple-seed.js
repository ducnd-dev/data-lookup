const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function simpleHash(password) {
  return Buffer.from(password).toString('base64');
}

async function main() {
  console.log('Starting database seeding...');

  try {
    // Create permissions
    const permissions = [
      { name: 'user:read', description: 'Can read users' },
      { name: 'user:write', description: 'Can create/update users' },
      { name: 'user:delete', description: 'Can delete users' },
      { name: 'role:read', description: 'Can read roles' },
      { name: 'role:write', description: 'Can create/update roles' },
      { name: 'role:delete', description: 'Can delete roles' },
      { name: 'file:upload', description: 'Can upload files' },
      { name: 'file:read', description: 'Can read files' },
      { name: 'job:read', description: 'Can read jobs' },
      { name: 'job:write', description: 'Can create/update jobs' },
      { name: 'job:delete', description: 'Can delete jobs' },
      { name: 'dashboard:read', description: 'Can view dashboard' }
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm
      });
    }

    console.log('Created permissions');

    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system access'
      }
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager', 
        description: 'Manager access'
      }
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Basic user access'
      }
    });

    console.log('Created roles');

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: simpleHash('admin123'),
        fullName: 'Administrator'
      }
    });

    // Assign admin role to admin user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });

    console.log('✅ Seeding completed!');
    console.log('🔑 Admin login: admin@example.com / admin123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();