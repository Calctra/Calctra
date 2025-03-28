/**
 * TypeScript entry point for Calctra
 * This file is just a placeholder to ensure the TypeScript configuration is valid.
 * As the project migrates to TypeScript, more code will be added here.
 */

export interface CalctraConfig {
  environment: 'development' | 'production' | 'test';
  port: number;
  apiVersion: string;
}

export const defaultConfig: CalctraConfig = {
  environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: 'v1',
};

// This is a placeholder for future TypeScript implementation
console.log('TypeScript configuration validated'); 