import { supabase } from '@/lib/supabase';
import type { Supplier, ContactPerson } from '@/lib/supabase';

export interface CreateSupplierData {
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  contact_persons: ContactPerson[];
}

export interface UpdateSupplierData extends CreateSupplierData {
  id: string;
}

export class SupplierService {
  /**
   * Fetch all suppliers ordered by supplier name
   */
  static async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('supplier_name');

    if (error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(supplierData: CreateSupplierData): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .insert(supplierData);

    if (error) {
      throw new Error(`Failed to create supplier: ${error.message}`);
    }
  }

  /**
   * Update an existing supplier
   */
  static async updateSupplier(supplierId: string, supplierData: Omit<CreateSupplierData, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', supplierId);

    if (error) {
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
  }

  /**
   * Delete a supplier by ID
   */
  static async deleteSupplier(supplierId: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);

    if (error) {
      throw new Error(`Failed to delete supplier: ${error.message}`);
    }
  }

  /**
   * Get a single supplier by ID
   */
  static async getSupplierById(supplierId: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch supplier: ${error.message}`);
    }

    return data;
  }

  /**
   * Get suppliers by service categories
   */
  static async getSuppliersByCategories(categories: string[]): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .overlaps('service_categories', categories)
      .order('supplier_name');

    if (error) {
      throw new Error(`Failed to fetch suppliers by categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search suppliers by name or email
   */
  static async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`supplier_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
      .order('supplier_name');

    if (error) {
      throw new Error(`Failed to search suppliers: ${error.message}`);
    }

    return data || [];
  }
}
