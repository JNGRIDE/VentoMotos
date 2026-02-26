import { areDeepEqual } from './utils';

function testAreDeepEqual() {
  const tests = [
    { name: 'Primitives: numbers equal', a: 1, b: 1, expected: true },
    { name: 'Primitives: numbers unequal', a: 1, b: 2, expected: false },
    { name: 'Primitives: strings equal', a: 'foo', b: 'foo', expected: true },
    { name: 'Primitives: strings unequal', a: 'foo', b: 'bar', expected: false },
    { name: 'Primitives: null equal', a: null, b: null, expected: true },
    { name: 'Primitives: undefined equal', a: undefined, b: undefined, expected: true },
    { name: 'Primitives: null vs undefined', a: null, b: undefined, expected: false },

    { name: 'Objects: shallow equal', a: { a: 1 }, b: { a: 1 }, expected: true },
    { name: 'Objects: shallow unequal value', a: { a: 1 }, b: { a: 2 }, expected: false },
    { name: 'Objects: shallow unequal key', a: { a: 1 }, b: { b: 1 }, expected: false },
    { name: 'Objects: deep equal', a: { a: { b: 1 } }, b: { a: { b: 1 } }, expected: true },
    { name: 'Objects: deep unequal', a: { a: { b: 1 } }, b: { a: { b: 2 } }, expected: false },

    { name: 'Arrays: shallow equal', a: [1, 2], b: [1, 2], expected: true },
    { name: 'Arrays: shallow unequal', a: [1, 2], b: [1, 3], expected: false },
    { name: 'Arrays: deep equal', a: [{ a: 1 }, { b: 2 }], b: [{ a: 1 }, { b: 2 }], expected: true },
    { name: 'Arrays: deep unequal', a: [{ a: 1 }, { b: 2 }], b: [{ a: 1 }, { b: 3 }], expected: false },
    { name: 'Arrays: different length', a: [1], b: [1, 2], expected: false },

    { name: 'Dates: equal', a: new Date(1000), b: new Date(1000), expected: true },
    { name: 'Dates: unequal', a: new Date(1000), b: new Date(2000), expected: false },

    { name: 'Mixed: object vs array', a: { 0: 1 }, b: [1], expected: false },
    { name: 'Mixed: date vs object', a: new Date(1000), b: { getTime: () => 1000 }, expected: false },

    { name: 'Complex: Prospect like structure',
      a: {
        id: '1',
        name: 'John',
        notesList: [{ content: 'note1', date: '2023-01-01' }]
      },
      b: {
        id: '1',
        name: 'John',
        notesList: [{ content: 'note1', date: '2023-01-01' }]
      },
      expected: true
    },
    { name: 'Complex: Prospect like structure unequal',
      a: {
        id: '1',
        name: 'John',
        notesList: [{ content: 'note1', date: '2023-01-01' }]
      },
      b: {
        id: '1',
        name: 'John',
        notesList: [{ content: 'note2', date: '2023-01-01' }]
      },
      expected: false
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = areDeepEqual(test.a, test.b);
      if (result === test.expected) {
        passed++;
      } else {
        console.error(`FAIL: ${test.name}`);
        console.error(`  Expected: ${test.expected}, Got: ${result}`);
        failed++;
      }
    } catch (e) {
      console.error(`ERROR: ${test.name}`, e);
      failed++;
    }
  }

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

testAreDeepEqual();
