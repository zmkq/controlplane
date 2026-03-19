import { toCsv } from '@/lib/csv';

describe('toCsv', () => {
  it('serializes rows with headers', () => {
    const csv = toCsv(
      [
        { name: 'Alpha', amount: 12.5 },
        { name: 'Beta', amount: 8 },
      ],
      ['name', 'amount'],
    );

    expect(csv).toBe(['name,amount', 'Alpha,12.5', 'Beta,8'].join('\n'));
  });

  it('escapes commas, quotes, and objects', () => {
    const csv = toCsv(
      [
        {
          name: 'A, Inc.',
          note: 'He said "ship it"',
          meta: { priority: 'high' },
        },
      ],
      ['name', 'note', 'meta'],
    );

    expect(csv).toContain('"A, Inc."');
    expect(csv).toContain('"He said ""ship it"""');
    expect(csv).toContain('"{""priority"":""high""}"');
  });
});
