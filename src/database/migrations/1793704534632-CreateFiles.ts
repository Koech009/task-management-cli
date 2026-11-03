import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFiles1793704534632 implements MigrationInterface {
    name = 'CreateFiles1793704534632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`files\` (\`id\` varchar(36) NOT NULL, \`originalName\` varchar(255) NOT NULL, \`filename\` varchar(255) NOT NULL, \`mimeType\` varchar(100) NOT NULL, \`size\` int UNSIGNED NOT NULL, \`storagePath\` varchar(500) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`uploadedById\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_134735cc45672b90b366c20dc3\` (\`filename\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`files\` ADD CONSTRAINT \`FK_a525d85f0ac59aa9a971825e1af\` FOREIGN KEY (\`uploadedById\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`files\` DROP FOREIGN KEY \`FK_a525d85f0ac59aa9a971825e1af\``);
        await queryRunner.query(`DROP INDEX \`IDX_134735cc45672b90b366c20dc3\` ON \`files\``);
        await queryRunner.query(`DROP TABLE \`files\``);
    }

}
