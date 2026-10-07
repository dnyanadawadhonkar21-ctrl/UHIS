const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, 'node_modules', '.prisma', 'client', 'index.js');
let content = fs.readFileSync(indexJsPath, 'utf8');

// 1. PatientScalarFieldEnum
if (!content.includes("uhisId: 'uhisId'")) {
  content = content.replace(
    "exports.Prisma.PatientScalarFieldEnum = {\n  id: 'id',\n  userId: 'userId',\n  abhaId: 'abhaId',",
    "exports.Prisma.PatientScalarFieldEnum = {\n  id: 'id',\n  userId: 'userId',\n  uhisId: 'uhisId',\n  abhaId: 'abhaId',"
  );
  console.log('✅ Updated PatientScalarFieldEnum');
}

// 2. inlineSchema
if (!content.includes('uhisId            String   @unique')) {
  content = content.replace(
    'model Patient {\\n  id                String   @id @default(uuid())\\n  userId            String   @unique\\n  abhaId            String   @unique',
    'model Patient {\\n  id                String   @id @default(uuid())\\n  userId            String   @unique\\n  uhisId            String   @unique\\n  abhaId            String   @unique'
  );
  console.log('✅ Updated inlineSchema');
}

// 3. runtimeDataModel
const searchMarker = '"Patient":{"dbName":null,"fields":[';
const abhaFieldStr = '{"name":"userId","kind":"scalar","isList":false,"isRequired":true,"isUnique":true,"isId":false,"isReadOnly":true,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false},';
const uhisFieldStr = '{"name":"uhisId","kind":"scalar","isList":false,"isRequired":true,"isUnique":true,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false},';

if (!content.includes('"name":"uhisId"')) {
  content = content.replace(
    searchMarker + abhaFieldStr,
    searchMarker + abhaFieldStr + uhisFieldStr
  );
  console.log('✅ Updated runtimeDataModel');
}

fs.writeFileSync(indexJsPath, content, 'utf8');
console.log('Done patching .prisma/client/index.js');
