import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Hash function using bcrypt like the auth service
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Starting database seeding...');

  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'READ_USERS' },
      update: {},
      create: {
        name: 'READ_USERS',
        description: 'Can read user data',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'WRITE_USERS' },
      update: {},
      create: {
        name: 'WRITE_USERS',
        description: 'Can create and update user data',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'DELETE_USERS' },
      update: {},
      create: {
        name: 'DELETE_USERS',
        description: 'Can delete user data',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_ROLES' },
      update: {},
      create: {
        name: 'MANAGE_ROLES',
        description: 'Can manage roles and permissions',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'UPLOAD_FILES' },
      update: {},
      create: {
        name: 'UPLOAD_FILES',
        description: 'Can upload and manage files',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'VIEW_REPORTS' },
      update: {},
      create: {
        name: 'VIEW_REPORTS',
        description: 'Can view reports',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_LOOKUP' },
      update: {},
      create: {
        name: 'MANAGE_LOOKUP',
        description: 'Can manage lookup data',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_QUOTA' },
      update: {},
      create: {
        name: 'MANAGE_QUOTA',
        description: 'Can manage user quotas and limits',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_SETTINGS' },
      update: {},
      create: {
        name: 'MANAGE_SETTINGS',
        description: 'Can manage system settings',
      },
    }),
  ]);

  console.log('Created permissions:', permissions.map(p => p.name));

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrator with full access',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Manager with elevated permissions',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Regular user with limited access',
    },
  });

  console.log('Created roles:', [adminRole.name, managerRole.name, userRole.name]);

  // Assign all permissions to admin role
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign manager permissions (upload, view reports, manage lookup)
  const managerPermissions = permissions.filter(p => 
    ['READ_USERS', 'UPLOAD_FILES', 'VIEW_REPORTS', 'MANAGE_LOOKUP'].includes(p.name)
  );
  
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign basic permissions to user role (no upload permission)
  const userPermissions = permissions.filter(p => 
    ['READ_USERS', 'VIEW_REPORTS'].includes(p.name)
  );
  
  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Assigned permissions to roles');

  // Create admin user
    // Create users with hashed passwords
  const hashedPassword = await hashPassword('admin123');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Administrator User',
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  // Create manager user
  const managerHashedPassword = await hashPassword('manager123');
  
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: managerHashedPassword,
      fullName: 'Manager User',
      roles: {
        create: {
          roleId: managerRole.id,
        },
      },
    },
  });

  // Create regular user
  const userHashedPassword = await hashPassword('user123');
  
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userHashedPassword,
      fullName: 'Regular User',
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  console.log('Created users:', [adminUser.email, managerUser.email, regularUser.email]);

  // Print summary
  console.log('\n='.repeat(60));
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🎉');
  console.log('='.repeat(60));
  
  console.log('\n📊 SEEDED DATA SUMMARY:');
  console.log(`✅ Permissions: ${permissions.length}`);
  console.log(`✅ Roles: 3 (Admin, Manager, User)`);
  console.log(`✅ Users: 3`);
  
  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('👑 Admin: admin@example.com / admin123');
  console.log('👨‍💼 Manager: manager@example.com / manager123');
  console.log('👤 User: user@example.com / user123');
  
  console.log('\n📋 SAMPLE DATA INCLUDED:');
  console.log('• Lookup data with UIDs: USR001-USR007');
  console.log('• Phone numbers: +1234567890 to +1234567895');
  console.log('• Various US addresses');
  console.log('• Mixed data scenarios (uid-only, phone-only, complete records)');
  
  console.log('\n🚀 READY TO USE!');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });