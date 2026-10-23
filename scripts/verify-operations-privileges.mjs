import assert from 'node:assert/strict';

export async function verifyOperationsPrivileges(db) {
  const relations = [
    'admin_activity_feed',
    'content_documents',
    'content_document_versions',
    'case_revision_drafts',
    'case_revision_history',
    'media_assets',
    'media_cleanup_jobs',
  ];
  let checks = 0;
  for (const role of ['anon', 'authenticated']) {
    const {rows} = await db.query(
      "select has_sequence_privilege($1,'public.admin_activity_logs_id_seq','USAGE,SELECT,UPDATE') as allowed",
      [role],
    );
    assert.equal(rows[0].allowed, false, `${role} cannot advance the operation audit sequence`);
    checks++;
  }
  for (const relation of relations) {
    for (const role of ['anon', 'authenticated', 'service_role']) {
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) {
        const {rows} = await db.query('select has_table_privilege($1,$2,$3) as allowed', [role, `public.${relation}`, privilege]);
        const expected = role === 'service_role' || (role === 'authenticated' && privilege === 'SELECT');
        assert.equal(rows[0].allowed, expected, `${role} ${privilege} on ${relation}`);
        checks++;
      }
    }
  }
  // RLS does not govern TRUNCATE. Verify the database rejects it at the grant
  // boundary even with no user claim, before it can touch history or drafts.
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(() => db.exec('truncate public.case_revision_history'), {code: '42501'});
      checks++;
    } finally {
      await db.exec('reset role');
    }
  }
  console.log(`PASS ${checks} operations privilege assertions with Supabase default grants (anonymous denial, authenticated read-only, server access and TRUNCATE rejection).`);
}
