import { getSupabaseClient, _resetSupabaseInstance } from '../supabaseClient';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Mock the @supabase/supabase-js library
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('supabaseClient', () => {
  const MOCK_SUPABASE_URL = 'http://localhost:54321';
  const MOCK_SUPABASE_ANON_KEY = 'mock-anon-key';

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Reset the singleton instance for each test
    _resetSupabaseInstance();
    // Clear mocks
    (createClient as jest.Mock).mockClear();
    // Backup original environment variables
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it('should throw an error if Supabase URL is not defined', () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = MOCK_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => getSupabaseClient()).toThrow(
      'Supabase URL or Anon Key is not defined.'
    );
  });

  it('should throw an error if Supabase Anon Key is not defined', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => getSupabaseClient()).toThrow(
      'Supabase URL or Anon Key is not defined.'
    );
  });

  it('should create and return a Supabase client instance', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = MOCK_SUPABASE_ANON_KEY;
    const mockSupabaseClient = { from: jest.fn() } as unknown as SupabaseClient;
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const client = getSupabaseClient();
    expect(createClient).toHaveBeenCalledWith(MOCK_SUPABASE_URL, MOCK_SUPABASE_ANON_KEY);
    expect(client).toBe(mockSupabaseClient);
  });

  it('should return the same instance on subsequent calls', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = MOCK_SUPABASE_ANON_KEY;
    const mockSupabaseClient = { from: jest.fn() } as unknown as SupabaseClient;
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();

    expect(client1).toBe(client2);
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});