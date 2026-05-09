import { describe, it, expect } from 'vitest';

// Mock simplified version of the logic used in Sefaz.tsx for testing
const calculateMockHash = async (content: string) => {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateCSV = (data: any[], sortField: string, sortOrder: 'asc' | 'desc') => {
  const sorted = [...data].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    if (a[sortField] < b[sortField]) return -1 * modifier;
    if (a[sortField] > b[sortField]) return 1 * modifier;
    return 0;
  });
  return "\uFEFF" + sorted.map(row => Object.values(row).join(";")).join("\n");
};

describe('Fiscal Export Logic Integrity', () => {
  const mockData = [
    { uf: 'SP', count: 50, env: 'prod' },
    { uf: 'RJ', count: 30, env: 'homol' },
    { uf: 'MG', count: 40, env: 'prod' }
  ];

  it('should generate identical hashes for same data and sort criteria', async () => {
    const csv1 = generateCSV(mockData, 'uf', 'asc');
    const csv2 = generateCSV(mockData, 'uf', 'asc');
    
    const hash1 = await calculateMockHash(csv1);
    const hash2 = await calculateMockHash(csv2);
    
    expect(hash1).toBe(hash2);
    expect(csv1.split('\n').length).toBe(mockData.length);
  });

  it('should generate different hashes for different sort criteria', async () => {
    const csvAsc = generateCSV(mockData, 'count', 'asc');
    const csvDesc = generateCSV(mockData, 'count', 'desc');
    
    const hashAsc = await calculateMockHash(csvAsc);
    const hashDesc = await calculateMockHash(csvDesc);
    
    expect(hashAsc).not.toBe(hashDesc);
  });

  it('should maintain row count consistency across formats', () => {
    const csv = generateCSV(mockData, 'uf', 'asc');
    const rows = csv.split('\n');
    expect(rows.length).toBe(mockData.length);
  });
});
