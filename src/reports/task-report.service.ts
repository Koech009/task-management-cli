import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service.js'; // adjust path

/**
 * Periodically logs a summary of tasks in the system.
 *
 * Lifecycle hooks used:
 * - onApplicationBootstrap: runs once, after ALL modules have initialized,
 *   so it's safe to start work that depends on other modules.
 * - onApplicationShutdown: runs when the app closes (needs
 *   app.enableShutdownHooks() in main.ts), so we can clean up the timer.
 */
@Injectable()
export class TaskReportService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  // Logger tagged with the class name, so logs show [TaskReportService]
  private readonly logger = new Logger(TaskReportService.name);

  // Holds the interval handle so we can stop it on shutdown
  private timer?: NodeJS.Timeout;

  // How often the report runs (1 minute for testing; use a longer interval later)
  // private readonly intervalMs = 60_000;
  private readonly intervalMs = 3_600_000; // 1 hour

  // Inject TasksService (exported by TasksModule) instead of a raw repository.
  // The report service no longer needs to know how tasks are stored.
  constructor(private readonly tasksService: TasksService) {}

  onApplicationBootstrap() {
    this.logger.log('All modules initialized. Starting report scheduler...');

    // Run one report immediately. `void` means we deliberately don't await it,
    // because Nest waits for bootstrap hooks and a slow report would delay startup.
    void this.generateReport();

    // Then repeat on a fixed interval
    this.timer = setInterval(() => void this.generateReport(), this.intervalMs);
  }

  onApplicationShutdown(signal?: string) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.logger.log(`Report scheduler stopped (signal: ${signal ?? 'none'})`);
  }

  /**
   * Builds and logs the report.
   * Wrapped in try/catch so a DB error is logged but never crashes the
   * app or stops the scheduler.
   */
  private async generateReport() {
    try {
      const total = await this.tasksService.count();
      this.logger.log(`Task report: ${total} task(s) in the system`);
    } catch (error) {
      this.logger.error('Failed to generate task report', error as Error);
    }
  }
}
