import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { dataSource } from './config';

dotenv.config();

interface LawsuitSeedRow {
    readonly caseNumberPart: string | null;
    readonly decisionDate: string;
    readonly pp: string | null;
    readonly js: string | null;
    readonly receivedByGugatanAt: string | null;
    readonly pbtDate: string | null;
    readonly bhtDate: string | null;
    readonly description: string | null;
    readonly classification: string;
}

function deriveStatus(row: LawsuitSeedRow): string {
    return row.receivedByGugatanAt ? 'RECEIVED_BY_GUGATAN' : 'DRAFT';
}

function buildCaseNumber(part: string): string {
    const cleaned = part.replace(/\/G$/i, '');
    return `${cleaned}/Pdt.G/2026/PA.Bjm`;
}

const lawsuitRows: ReadonlyArray<LawsuitSeedRow> = [
    { decisionDate: '2026-04-20', caseNumberPart: '455',    pp: '08f0c79a-acb1-469a-bad9-b000e0610925', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-20 00:00:00', pbtDate: '2026-04-17', bhtDate: '2026-05-05', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '456',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: '2026-04-18', bhtDate: '2026-05-05', description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '461',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: '2026-04-17', bhtDate: '2026-05-05', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '465',    pp: '51f8052c-318a-4dc2-9db6-bb678e547fcb', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: '2026-04-18', bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '468',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-19 00:00:00', pbtDate: '2026-04-18', bhtDate: '2026-05-05', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '469',    pp: '4740876d-5aa4-4cd2-8d99-2f3748f7f096', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '472',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: '2026-04-17', bhtDate: '2026-05-05', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '486',    pp: '51f8052c-318a-4dc2-9db6-bb678e547fcb', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: null,          bhtDate: '2026-04-16', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '524',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: null,          bhtDate: '2026-04-16', description: 'Cabut',    classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '549',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-17 00:00:00', pbtDate: null,          bhtDate: '2026-04-16', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '405',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: '2026-04-21', bhtDate: '2026-05-06', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '410',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-20 00:00:00', pbtDate: '2026-04-21', bhtDate: '2026-05-06', description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '451',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-20 00:00:00', pbtDate: null,          bhtDate: '2026-04-20', description: 'Cabut',    classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '482',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-20 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '499',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: '2026-04-22', bhtDate: '2026-05-07', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-20', caseNumberPart: '510',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: '2026-04-21', bhtDate: '2026-05-06', description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-20', caseNumberPart: '520',    pp: '49f02763-f0cb-4b88-beda-62ad82aa896c', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-20 00:00:00', pbtDate: null,          bhtDate: '2026-04-20', description: 'Cabut',    classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-21', caseNumberPart: '1680/G', pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: '2026-05-06', description: 'NO hadir', classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-21', caseNumberPart: '445',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: '2026-04-22', bhtDate: '2026-05-07', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-21', caseNumberPart: '466',    pp: '4740876d-5aa4-4cd2-8d99-2f3748f7f096', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-22 00:00:00', pbtDate: null,          bhtDate: '2026-04-21', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-21', caseNumberPart: '471',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-21', caseNumberPart: '475',    pp: '4740876d-5aa4-4cd2-8d99-2f3748f7f096', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-22 00:00:00', pbtDate: null,          bhtDate: '2026-04-21', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-21', caseNumberPart: '485',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-22 00:00:00', pbtDate: null,          bhtDate: '2026-04-21', description: 'Cabut',    classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-21', caseNumberPart: '494',    pp: '4740876d-5aa4-4cd2-8d99-2f3748f7f096', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-22 00:00:00', pbtDate: null,          bhtDate: '2026-04-21', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-21', caseNumberPart: '498',    pp: '4740876d-5aa4-4cd2-8d99-2f3748f7f096', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-21', caseNumberPart: '507',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-22 00:00:00', pbtDate: null,          bhtDate: '2026-04-21', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-21', caseNumberPart: '519',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-21', caseNumberPart: '557',    pp: '4740876d-5aa4-4cd2-8d99-2f3748f7f096', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-22 00:00:00', pbtDate: null,          bhtDate: '2026-04-21', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-21', caseNumberPart: '487',    pp: 'ceebc9e4-d3c7-446a-a6a7-ef4d720e5137', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: '2026-04-22', bhtDate: '2026-05-07', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-22', caseNumberPart: '540',    pp: '6a07e463-f5a2-47d2-887e-9d9a01217c9e', js: '1a2e1c78-d303-4acd-85f0-fbaad1127a65', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: '2026-04-22', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-22', caseNumberPart: '578',    pp: '9d024341-ebe7-44a4-9332-9eec82bddca2', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: '2026-04-22', description: 'Cabut',    classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-22', caseNumberPart: '570',    pp: '9d024341-ebe7-44a4-9332-9eec82bddca2', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: '2026-04-22', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-22', caseNumberPart: '413',    pp: '152b6370-8abd-4197-8b6a-fff78a7e31f0', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: '2026-04-22', bhtDate: '2026-05-07', description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-22', caseNumberPart: '447',    pp: '152b6370-8abd-4197-8b6a-fff78a7e31f0', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-22', caseNumberPart: '479',    pp: '9d024341-ebe7-44a4-9332-9eec82bddca2', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-22', caseNumberPart: '517',    pp: '6a07e463-f5a2-47d2-887e-9d9a01217c9e', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-22', caseNumberPart: '521',    pp: '9d024341-ebe7-44a4-9332-9eec82bddca2', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-22', caseNumberPart: '544',    pp: '152b6370-8abd-4197-8b6a-fff78a7e31f0', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: '2026-04-22', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '484',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '493',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '508',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '514',    pp: '51f8052c-318a-4dc2-9db6-bb678e547fcb', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: '2026-05-08', description: 'hadir',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '483',    pp: '6a07e463-f5a2-47d2-887e-9d9a01217c9e', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-23 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '1578',   pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '397',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-24 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '419',    pp: '08f0c79a-acb1-469a-bad9-b000e0610925', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-24 00:00:00', pbtDate: null,          bhtDate: '2026-04-23', description: 'Cabut',    classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '452',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '459',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-24 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '488',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '51f8052c-318a-4dc2-9db6-bb678e547fcb', receivedByGugatanAt: '2026-04-24 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '500',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '525',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '527',    pp: '03101380-375f-43ba-8705-d05c456ce468', js: '6615af37-5ec7-437e-b069-c91c74d61530', receivedByGugatanAt: '2026-04-24 00:00:00', pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '531',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    { decisionDate: '2026-04-23', caseNumberPart: '541',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI GUGAT' },
    { decisionDate: '2026-04-23', caseNumberPart: '551',    pp: null,                                    js: null,                                    receivedByGugatanAt: null,                   pbtDate: null,          bhtDate: null,          description: null,       classification: 'CERAI TALAK' },
    // Last entry in ledger (2026-04-24 group marker, no case number) — skipped
];

async function seedLawsuits() {
    await dataSource.initialize();

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const classificationNames = [
            ...new Set(lawsuitRows.map((r) => r.classification)),
        ];

        const classifications: { id: string; name: string }[] =
            await queryRunner.query(
                `SELECT id, name FROM document_classifications
                 WHERE name IN (?) AND deleted_at IS NULL`,
                [classificationNames],
            );

        const classificationMap = new Map(
            classifications.map((c) => [c.name, c.id]),
        );

        const missing = classificationNames.filter(
            (n) => !classificationMap.has(n),
        );
        if (missing.length > 0) {
            throw new Error(
                `Classifications not found in DB: ${missing.join(', ')}`,
            );
        }

        let inserted = 0;
        let skipped = 0;

        for (const row of lawsuitRows) {
            if (!row.caseNumberPart) continue;

            const id = crypto.randomUUID();
            const caseNumber = buildCaseNumber(row.caseNumberPart);
            const status = deriveStatus(row);
            const classificationId = classificationMap.get(row.classification);

            const result = await queryRunner.query(
                `INSERT IGNORE INTO lawsuits
                 (id, case_number, decision_date, type, status,
                  document_classification_id, classification,
                  received_by_gugatan_at, pbt_date, bht_date,
                  pp_id, js_id, description, created_at, updated_at)
                 VALUES (?, ?, ?, 'gugatan', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    id,
                    caseNumber,
                    row.decisionDate,
                    status,
                    classificationId,
                    row.classification,
                    row.receivedByGugatanAt,
                    row.pbtDate,
                    row.bhtDate,
                    row.pp,
                    row.js,
                    row.description,
                ],
            );

            if (result?.affectedRows === 0) {
                skipped += 1;
                console.log(`  SKIPPED (duplicate): ${caseNumber}`);
            } else {
                inserted += 1;
            }
        }

        await queryRunner.commitTransaction();
        console.log(`\nLawsuit seeding completed.`);
        console.log(`  Inserted : ${inserted}`);
        console.log(`  Skipped  : ${skipped} (duplicate case_number)`);
    } catch (error) {
        console.error('Error during lawsuit seeding:', error);
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

seedLawsuits();
