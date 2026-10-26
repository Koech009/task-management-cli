import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjects1792737673500 implements MigrationInterface {
    name = 'CreateProjects1792737673500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`keyHash\` varchar(64) NOT NULL, \`expiresAt\` datetime NULL, \`revokedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_df3b25181df0b4b59bd93f16e1\` (\`keyHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`projects\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`createdById\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`projects\` ADD CONSTRAINT \`FK_f55144dc92df43cd1dad5d29b90\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`projects\` DROP FOREIGN KEY \`FK_f55144dc92df43cd1dad5d29b90\``);
        await queryRunner.query(`DROP TABLE \`projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_df3b25181df0b4b59bd93f16e1\` ON \`api_keys\``);
        await queryRunner.query(`DROP TABLE \`api_keys\``);
    }

}
