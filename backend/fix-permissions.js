const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMissingPermissions() {
  console.log('Adding missing permissions...');

  // Add MANAGE_QUOTA permission
  const manageQuotaPermission = await prisma.permission.upsert({
    where: { name: 'MANAGE_QUOTA' },
    update: {},
    create: {
      name: 'MANAGE_QUOTA',
      description: 'Manage user quotas and limits',
    },
  });

  // Add MANAGE_SETTINGS permission
  const manageSettingsPermission = await prisma.permission.upsert({
    where: { name: 'MANAGE_SETTINGS' },
    update: {},
    create: {
      name: 'MANAGE_SETTINGS',
      description: 'Manage system settings',
    },
  });

  console.log('Added permissions:', {
    MANAGE_QUOTA: manageQuotaPermission.id,
    MANAGE_SETTINGS: manageSettingsPermission.id
  });

  // Get Admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' }
  });

  if (!adminRole) {
    console.error('Admin role not found!');
    return;
  }

  // Assign both permissions to Admin role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: manageQuotaPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: manageQuotaPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: manageSettingsPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: manageSettingsPermission.id,
    },
  });

  console.log('Assigned permissions to Admin role');

  // Verify by getting admin with all permissions
  const adminWithPermissions = await prisma.role.findUnique({
    where: { name: 'Admin' },
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      }
    }
  });

  console.log('Admin role permissions:', adminWithPermissions?.rolePermissions.map(rp => rp.permission.name));
}

addMissingPermissions()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });