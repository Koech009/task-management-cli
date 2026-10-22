import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshSessions1792602335921 implements MigrationInterface {
    name = 'CreateRefreshSessions1792602335921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`refresh_sessions\` (\`id\` varchar(36) NOT NULL, \`tokenHash\` varchar(64) NOT NULL, \`userId\` varchar(36) NOT NULL, \`familyId\` varchar(36) NOT NULL, \`expiresAt\` datetime NOT NULL, \`revokedAt\` datetime NULL, \`replacedBySessionId\` varchar(36) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2cc521fed1a42c97ac78b1ffb6\` (\`tokenHash\`), INDEX \`IDX_7456184993049cee6e5b3df722\` (\`familyId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`refresh_sessions\` ADD CONSTRAINT \`FK_78744bff965517952df6c02da76\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`refresh_sessions\` DROP FOREIGN KEY \`FK_78744bff965517952df6c02da76\``);
        await queryRunner.query(`DROP INDEX \`IDX_7456184993049cee6e5b3df722\` ON \`refresh_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_2cc521fed1a42c97ac78b1ffb6\` ON \`refresh_sessions\``);
        await queryRunner.query(`DROP TABLE \`refresh_sessions\``);
    }

}
