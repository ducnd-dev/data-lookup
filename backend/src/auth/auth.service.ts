import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, fullName: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, fullName },
    });
    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password - handle both bcrypt and simple base64 (for seed data)
    let isValidPassword = false;
    
    // First try bcrypt comparison
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (error) {
      // If bcrypt fails, the password might be base64 encoded (from seed data)
      isValidPassword = false;
    }

    // If bcrypt didn't work, try base64 comparison (for seed data)
    if (!isValidPassword) {
      const simpleHash = Buffer.from(password).toString('base64');
      isValidPassword = user.password === simpleHash;
    }

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Extract user roles and permissions
    const roles = user.roles.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      permissions: userRole.role.rolePermissions.map(rp => rp.permission.name)
    }));

    const allPermissions = roles.flatMap(role => role.permissions);

    const payload = { 
      sub: user.id, 
      email: user.email,
      roles: roles.map(r => r.name),
      permissions: allPermissions
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName,
        roles: roles,
        permissions: allPermissions
      },
    };
  }

  async validateUser(userId: number) {
    console.log('🔍 AuthService validateUser called with userId:', userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('🔍 AuthService user query result:', user ? 'found user' : 'user not found');

    if (!user) return null;

    // Extract permissions
    const roles = user.roles.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      permissions: userRole.role.rolePermissions.map(rp => rp.permission.name)
    }));

    const allPermissions = roles.flatMap(role => role.permissions);

    const result = {
      userId: user.id,
      id: user.id, // Add both for compatibility
      email: user.email,
      fullName: user.fullName,
      roles: roles.map(r => r.name),
      permissions: allPermissions
    };

    console.log('🔍 AuthService returning user:', { id: result.id, email: result.email });
    return result;
  }

  async getCurrentUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract user roles and permissions
    const roles = user.roles.map(userRole => ({
      role: {
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        rolePermissions: userRole.role.rolePermissions.map(rp => ({
          permission: {
            id: rp.permission.id,
            name: rp.permission.name,
            description: rp.permission.description
          }
        }))
      }
    }));

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: roles
    };
  }
}