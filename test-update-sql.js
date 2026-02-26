import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import pkg from 'pg';
const { Client } = pkg;

const envConfig = dotenv.parse(readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k]

// we need the connection string, typically in SUPPLEMENTARY or from config, but let's try pushing it using Supabase CLI if it is mapped
