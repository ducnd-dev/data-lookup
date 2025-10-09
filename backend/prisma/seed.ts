import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple hash function for seeding
function simpleHash(password: string): string {
  return Buffer.from(password).toString('base64');
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
  const hashedPassword = simpleHash('admin123');
  
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
  const managerHashedPassword = simpleHash('manager123');
  
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
  const userHashedPassword = simpleHash('user123');
  
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

  // Create sample lookup data
  console.log('Creating sample lookup data...');
  
  const sampleLookupData = [
    {
      uid: 'USR001',
      phone: '+1234567890',
      address: '123 Main St, New York, NY 10001',
    },
    {
      uid: 'USR002',
      phone: '+1234567891',
      address: '456 Oak Ave, Los Angeles, CA 90210',
    },
    {
      uid: 'USR003',
      phone: '+1234567892',
      address: '789 Pine Rd, Chicago, IL 60601',
    },
    {
      uid: 'USR004',
      phone: '+1234567893',
      address: '321 Elm St, Houston, TX 77001',
    },
    {
      uid: 'USR005',
      phone: '+1234567894',
      address: '654 Maple Dr, Phoenix, AZ 85001',
    },
    // Sample with only UID (no phone)
    {
      uid: 'USR006',
      phone: null,
      address: 'PO Box 123, Miami, FL 33101',
    },
    // Sample with only phone (no UID)
    {
      uid: null,
      phone: '+1234567895',
      address: '987 Cedar Ln, Seattle, WA 98101',
    },
    // Sample with UID and address but no phone
    {
      uid: 'USR007',
      phone: null,
      address: '147 Birch St, Boston, MA 02101',
    },
  ];

  // Clear existing lookup data to avoid conflicts during development
  await prisma.lookupData.deleteMany({});

  // Insert sample data using createMany with skipDuplicates
  await prisma.lookupData.createMany({
    data: sampleLookupData,
    skipDuplicates: true,
  });

  console.log(`Created ${sampleLookupData.length} sample lookup records`);

  // Create sample job status records for testing
  console.log('Creating sample job status records...');
  
  const sampleJobStatuses = [
    {
      jobType: 'data-import',
      status: 'completed',
      fileName: 'sample-data.csv',
      resultPath: '/uploads/reports/import-result-001.xlsx',
      totalRows: 100,
      processedRows: 100,
      createdBy: adminUser.id,
    },
    {
      jobType: 'report-generation',
      status: 'completed',
      fileName: 'lookup-report.xlsx',
      resultPath: '/uploads/reports/lookup-report-001.xlsx',
      totalRows: 50,
      processedRows: 50,
      createdBy: managerUser.id,
    },
    {
      jobType: 'bulk-search',
      status: 'processing',
      fileName: 'search-terms.csv',
      totalRows: 25,
      processedRows: 15,
      createdBy: regularUser.id,
    },
  ];

  await prisma.jobStatus.createMany({
    data: sampleJobStatuses,
    skipDuplicates: true,
  });

  console.log(`Created ${sampleJobStatuses.length} sample job status records`);

  // Print summary
  console.log('\n='.repeat(60));
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🎉');
  console.log('='.repeat(60));
  
  console.log('\n📊 SEEDED DATA SUMMARY:');
  console.log(`✅ Permissions: ${permissions.length}`);
  console.log(`✅ Roles: 3 (Admin, Manager, User)`);
  console.log(`✅ Users: 3`);
  console.log(`✅ Lookup Data: ${sampleLookupData.length} records`);
  console.log(`✅ Job Status: ${sampleJobStatuses.length} records`);
  
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