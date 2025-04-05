import { generateTimeStamp } from './timestamp';

describe('generateTimeStamp', () => {
  it('should return a number', () => {
    const timestamp = generateTimeStamp();
    expect(typeof timestamp).toBe('number');
  });

  it('should return a timestamp that is close to the current time', () => {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = generateTimeStamp();
    // Allow a difference of 1 second to account for execution time
    expect(timestamp).toBeGreaterThanOrEqual(now - 1);
    expect(timestamp).toBeLessThanOrEqual(now + 1);
  });

  it('should return a timestamp in seconds', () => {
    const timestamp = generateTimeStamp();
    expect(timestamp.toString().length).toBeGreaterThanOrEqual(10); // Assuming timestamps in seconds are at least 10 digits long
  });
});
