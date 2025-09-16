/**
 * Password Security Module
 * Replaces plaintext passwords with bcrypt hashing
 */
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Strong security

/**
 * Hash a plaintext password
 */
export async function hashPassword(plaintext: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(plaintext, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('❌ Failed to hash password:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify a plaintext password against a hash
 */
export async function verifyPassword(plaintext: string, hashedPassword: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(plaintext, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('❌ Failed to verify password:', error);
    return false;
  }
}

/**
 * Check if a password is already hashed (starts with $2b$)
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith('$2b$') || password.startsWith('$2a$');
}

/**
 * Migration: Hash existing plaintext passwords in database
 */
export async function migrateExistingPasswords(storage: any): Promise<void> {
  try {
    console.log('🔒 Starting password migration from plaintext to bcrypt...');
    
    // Get all users
    const db = storage.db;
    const allUsers = await db.execute('SELECT id, username, password FROM users');
    
    let migratedCount = 0;
    
    for (const user of allUsers.rows) {
      const { id, username, password } = user;
      
      // Skip if already hashed
      if (isPasswordHashed(password)) {
        continue;
      }
      
      // Hash the plaintext password
      const hashedPassword = await hashPassword(password);
      
      // Update in database
      await db.execute('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
      
      console.log(`  ✅ Migrated password for user: ${username}`);
      migratedCount++;
    }
    
    console.log(`🎉 Password migration complete! Migrated ${migratedCount} user passwords to bcrypt.`);
    
  } catch (error) {
    console.error('❌ Password migration failed:', error);
    throw error;
  }
}
