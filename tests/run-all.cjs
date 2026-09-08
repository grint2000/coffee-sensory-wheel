const {spawnSync}=require('node:child_process');
const tests=['tests/data-store.cjs','tests/feature-failures.cjs','tests/workflow-tools.cjs','tests/workflow-integration.cjs','tests/reference-dom.cjs','tests/team.cjs','tests/service-worker.cjs','scripts/audit-reference.cjs'];
for(const file of tests){
 console.log('\nRunning '+file);
 const result=spawnSync(process.execPath,[file],{stdio:'inherit',env:{...process.env,NOEL_TEST_XLSX:'1'}});
 if(result.error){console.error(result.error.message);process.exit(1);}
 if(result.status!==0)process.exit(result.status || 1);
}
console.log('\nAll automated checks passed. Real-browser/device/Firebase access checks are not represented by this result.');
