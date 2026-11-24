export class ManualClock {
  private currentTime: number;

  constructor(start = new Date('2030-01-01T12:00:00.000Z')) {
    this.currentTime = start.getTime();
  }

  now = (): Date => new Date(this.currentTime);

  advance(milliseconds: number): void {
    this.currentTime += milliseconds;
  }
}
