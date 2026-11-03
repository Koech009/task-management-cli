import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { fileTypeFromBuffer } from 'file-type';

import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { FileEntity } from './entities/file.entity.js';
import { User } from '../users/entities/user.entity.js';

// detected mime type -> extension we store
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  async handleUpload(file: Express.Multer.File, userId: string) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }

    // inspect the real file content, not the client's claimed type
    const detectedType = await fileTypeFromBuffer(file.buffer);

    if (!detectedType || !ALLOWED_TYPES[detectedType.mime]) {
      throw new BadRequestException(
        'Unsupported file type. Upload PDF, JPEG or PNG.',
      );
    }

    const filename = `${randomUUID()}.${ALLOWED_TYPES[detectedType.mime]}`;
    const storagePath = `uploads/${filename}`;
    const absolutePath = join(UPLOAD_DIR, filename);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(absolutePath, file.buffer, { flag: 'wx' });

    try {
      const savedFile = await this.fileRepository.save(
        this.fileRepository.create({
          originalName: file.originalname.slice(0, 255),
          filename,
          mimeType: detectedType.mime,
          size: file.size,
          storagePath,
          uploadedBy: { id: userId } as User,
        }),
      );

      return {
        message: 'File uploaded successfully',
        file: {
          id: savedFile.id,
          originalName: savedFile.originalName,
          filename: savedFile.filename,
          mimeType: savedFile.mimeType,
          size: savedFile.size,
          uploadedById: userId,
          createdAt: savedFile.createdAt,
        },
      };
    } catch (error) {
      this.logger.error('Failed to save file record', error as Error);

      // remove the orphaned disk file
      await unlink(absolutePath).catch(() => undefined);

      throw new InternalServerErrorException('Unable to save file information');
    }
  }

  // 404 for files that don't exist OR belong to someone else,
  // so users can't probe which ids exist
  private async findOwnedFile(id: string, userId: string) {
    const file = await this.fileRepository.findOne({
      where: { id, uploadedBy: { id: userId } },
    });

    if (!file) throw new NotFoundException('File not found');

    return file;
  }

  async getFileStream(id: string, userId: string) {
    const file = await this.findOwnedFile(id, userId);
    const absolutePath = join(UPLOAD_DIR, file.filename);

    // the DB row exists but the disk file may be gone
    await access(absolutePath).catch(() => {
      throw new NotFoundException('File not found');
    });

    return { file, stream: createReadStream(absolutePath) };
  }

  async remove(id: string, userId: string) {
    const file = await this.findOwnedFile(id, userId);

    await unlink(join(UPLOAD_DIR, file.filename)).catch(() => undefined);
    await this.fileRepository.remove(file);

    return { deleted: true };
  }
}
