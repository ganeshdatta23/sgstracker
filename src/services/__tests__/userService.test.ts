import { fetchUserById } from '../userService';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

// Mock the getSupabaseClient utility
jest.mock('../../lib/supabaseClient');

describe('userService', () => {
  const MOCK_USER_ID = '123';
  const MOCK_UNKNOWN_USER_ID = 'unknown-id';
  const MOCK_USER_DATA = { id: MOCK_USER_ID, name: 'Test User', email: 'test@example.com' };

  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test to ensure a clean state
    jest.clearAllMocks();

    // Reset mocks for each test
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    mockSupabaseClient = {
      from: mockFrom,
    } as unknown as jest.Mocked<SupabaseClient>;

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('should fetch a user by ID successfully', async () => {
    mockSingle.mockResolvedValue({ data: MOCK_USER_DATA, error: null });

    const user = await fetchUserById(MOCK_USER_ID);

    expect(getSupabaseClient).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('id, name, email');
    expect(mockEq).toHaveBeenCalledWith('id', MOCK_USER_ID);
    expect(mockSingle).toHaveBeenCalledTimes(1);
    expect(user).toEqual(MOCK_USER_DATA);
  });

  it('should return null if user is not found (PGRST116 error)', async () => {
    const notFoundError: Partial<PostgrestError> = {
      message: 'No rows found',
      code: 'PGRST116',
      details: '',
      hint: ''
    };
    mockSingle.mockResolvedValue({ data: null, error: notFoundError });

    const user = await fetchUserById(MOCK_UNKNOWN_USER_ID);
    expect(user).toBeNull();
  });

  it('should throw an error for other Supabase errors', async () => {
    const genericError: Partial<PostgrestError> = {
      message: 'A database error occurred',
      code: 'DB500',
      details: '',
      hint: ''
    };
    mockSingle.mockResolvedValue({ data: null, error: genericError });

    await expect(fetchUserById(MOCK_USER_ID)).rejects.toEqual(genericError);
  });
});