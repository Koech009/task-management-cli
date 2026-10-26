import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryProjectsDto {
  // The page number to retrieve.
  // Example: ?page=2 retrieves the second page.
  @IsOptional()
  @Type(() => Number) // URL query parameters arrive as strings. and this converts it to int
  @IsInt() // The value must be an integer.
  @Min(1) // Page numbers start at 1.
  page?: number = 1;

  // Maximum number of projects to return per page.
  // Example: ?limit=10 returns at most 10 projects.
  @IsOptional()
  @Type(() => Number) // Convert "10" from the URL into number 10.
  @IsInt()
  @Min(1) // Do not allow zero or negative limits.
  @Max(100) // Prevent excessively large database queries.
  limit?: number = 10;
}
