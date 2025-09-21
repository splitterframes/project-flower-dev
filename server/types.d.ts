// Type definitions for Project Flower
// This file contains type fixes for common TypeScript issues

declare global {
  // Neon database types
  interface NeonQueryFunction {
    <T = any>(query: string, params?: any[]): Promise<T[]>;
    transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  }

  // Database result types
  interface DatabaseResult {
    [key: string]: any;
  }

  // Error handling
  interface DatabaseError extends Error {
    message: string;
    code?: string;
    detail?: string;
  }
}

// Neon database configuration types
export interface NeonConfig {
  keepAlive?: boolean;
  poolSize?: number;
  pipelineConnect?: boolean;
  fetch?: (url: string, options?: any) => Promise<Response>;
}

// Database row types
export interface UserRow {
  id: number;
  username: string;
  password: string;
  credits: number;
  suns: number;
  dna: number;
  tickets: number;
  hearts: number;
  last_passive_income_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ButterflyRow {
  id: number;
  user_id: number;
  butterfly_id: number;
  butterfly_name: string;
  butterfly_rarity: string;
  butterfly_image_url: string;
  collected_at: Date;
  created_at: Date;
}

export interface FlowerRow {
  id: number;
  user_id: number;
  flower_id: number;
  flower_name: string;
  flower_rarity: string;
  flower_image_url: string;
  collected_at: Date;
  created_at: Date;
}

export interface ExhibitionFrameRow {
  id: number;
  user_id: number;
  frame_number: number;
  is_vip: boolean;
  created_at: Date;
}

export interface FieldRow {
  id: number;
  user_id: number;
  field_index: number;
  flower_id?: number;
  flower_name?: string;
  flower_rarity?: string;
  flower_image_url?: string;
  planted_at: Date;
  growth_stage: number;
  watered_at?: Date;
  harvest_ready_at?: Date;
  created_at: Date;
}

export {};