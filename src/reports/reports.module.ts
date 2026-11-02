import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module.js'; // adjust path
import { TaskReportService } from './task-report.service.js';

/**
 * Groups everything related to reporting.
 * Imports TasksModule to reuse its exported TasksService, so we no longer
 * need TypeOrmModule.forFeature([Task]) here.
 */
@Module({
  imports: [TasksModule],
  providers: [TaskReportService],
})
export class ReportsModule {}
