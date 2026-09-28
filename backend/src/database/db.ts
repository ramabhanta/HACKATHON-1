import fs from 'fs';
import path from 'path';
import {
  User,
  FarmerProfile,
  VendorProfile,
  ExpertProfile,
  Farm,
  Crop,
  SoilTestRecord,
  AiDiagnosis,
  ProductCategory,
  Product,
  Order,
  ProduceListing,
  BuyerRequest,
  ProcurementVendor,
  VendorDealRequest,
  FarmTask,
  FarmExpense,
  ChatMessage,
  AppNotification,
  MarketPrice
} from '../models/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: User[];
  farmer_profiles: FarmerProfile[];
  vendor_profiles: VendorProfile[];
  expert_profiles: ExpertProfile[];
  farms: Farm[];
  crops: Crop[];
  soil_tests: SoilTestRecord[];
  ai_diagnoses: AiDiagnosis[];
  product_categories: ProductCategory[];
  products: Product[];
  orders: Order[];
  produce_listings: ProduceListing[];
  buyer_requests: BuyerRequest[];
  procurement_vendors: ProcurementVendor[];
  vendor_deal_requests: VendorDealRequest[];
  farm_tasks: FarmTask[];
  expenses: FarmExpense[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  market_prices: MarketPrice[];
}

export class Database {
  private static instance: Database;
  private dbPath: string;
  private state: DatabaseSchema;

  private constructor() {
    this.dbPath = path.join(DATA_DIR, 'agriconnect.json');
    this.state = this.loadState();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadState(): DatabaseSchema {
    const defaultState: DatabaseSchema = {
      users: [],
      farmer_profiles: [],
      vendor_profiles: [],
      expert_profiles: [],
      farms: [],
      crops: [],
      soil_tests: [],
      ai_diagnoses: [],
      product_categories: [],
      products: [],
      orders: [],
      produce_listings: [],
      buyer_requests: [],
      procurement_vendors: [],
      vendor_deal_requests: [],
      farm_tasks: [],
      expenses: [],
      messages: [],
      notifications: [],
      market_prices: []
    };


    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...defaultState, ...parsed };
      } catch (err) {
        console.error('Error loading database file, initializing default state:', err);
        return defaultState;
      }
    }
    return defaultState;
  }

  public save(): void {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Error persisting database state to disk:', err);
    }
  }

  // Generic collection operations
  public getTable<K extends keyof DatabaseSchema>(tableName: K): DatabaseSchema[K] {
    return this.state[tableName];
  }

  public find<K extends keyof DatabaseSchema>(
    tableName: K,
    predicate?: (item: DatabaseSchema[K][number]) => boolean
  ): DatabaseSchema[K] {
    const table = this.state[tableName] as any[];
    if (!predicate) return [...table] as any;
    return table.filter(predicate) as any;
  }

  public findById<K extends keyof DatabaseSchema>(
    tableName: K,
    id: string
  ): DatabaseSchema[K][number] | undefined {
    const table = this.state[tableName] as any[];
    return table.find((item: any) => item.id === id);
  }

  public findOne<K extends keyof DatabaseSchema>(
    tableName: K,
    predicate: (item: DatabaseSchema[K][number]) => boolean
  ): DatabaseSchema[K][number] | undefined {
    const table = this.state[tableName] as any[];
    return table.find(predicate);
  }

  public insert<K extends keyof DatabaseSchema>(
    tableName: K,
    item: DatabaseSchema[K][number]
  ): DatabaseSchema[K][number] {
    (this.state[tableName] as any[]).push(item);
    this.save();
    return item;
  }

  public update<K extends keyof DatabaseSchema>(
    tableName: K,
    id: string,
    updates: Partial<DatabaseSchema[K][number]>
  ): DatabaseSchema[K][number] | undefined {
    const table = this.state[tableName] as any[];
    const index = table.findIndex((item: any) => item.id === id);
    if (index === -1) return undefined;
    
    table[index] = { ...table[index], ...updates };
    this.save();
    return table[index];
  }

  public delete<K extends keyof DatabaseSchema>(
    tableName: K,
    id: string
  ): boolean {
    const table = this.state[tableName] as any[];
    const index = table.findIndex((item: any) => item.id === id);
    if (index === -1) return false;
    
    table.splice(index, 1);
    this.save();
    return true;
  }

  public reset(newState: DatabaseSchema): void {
    this.state = newState;
    this.save();
  }
}

export const db = Database.getInstance();
