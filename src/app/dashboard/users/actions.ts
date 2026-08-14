"use server";

import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function saveAdminUser(data: {
  id?: number;
  username: string;
  password?: string;
  role: string;
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    if (data.id) {
      // Edit
      const updateData: any = {
        username: data.username,
        role: data.role,
      };

      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
      }

      await db.update(adminUsers).set(updateData).where(eq(adminUsers.id, data.id));
    } else {
      // Create
      if (!data.password) return { success: false, error: "Password is required for new users" };
      
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      await db.insert(adminUsers).values({
        username: data.username,
        passwordHash,
        role: data.role,
      });
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save user:", error);
    if (error.code === '23505') { // Unique violation
      return { success: false, error: "Username already exists" };
    }
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteAdminUser(id: number) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  // Don't allow deleting the last user or oneself if we want to be safe, but for now just delete.
  // We can check if it's the current user if session user ID matches, but next-auth session doesn't easily expose DB ID without mapping.
  
  try {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Internal server error" };
  }
}
