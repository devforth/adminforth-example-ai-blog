import AdminForth, { AdminForthDataTypes } from 'adminforth';
import { randomUUID } from 'crypto';
import UploadPlugin from '@adminforth/upload';

const blockDemoUsers = async ({ record, adminUser, resource }) => {
  console.log('adminUser', adminUser.dbUser);
  if (adminUser.dbUser.email.includes('demo')) {
    return { ok: false, error: "You can't do this as demo@adminforth.dev" }
  }
  return { ok: true };
}

export default {
  dataSource: 'maindb',
  table: 'user',
  label: 'Users',
  recordLabel: (r: any) => `👤 ${r.email}`,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      fillOnCreate: () => randomUUID(),
      showIn: ['list', 'filter', 'show'],
    },
    {
      name: 'email',
      required: true,
      isUnique: true,
      enforceLowerCase: true,
      validation: [
        AdminForth.Utils.EMAIL_VALIDATOR,
      ],
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'createdAt',
      type: AdminForthDataTypes.DATETIME,
      showIn: ['list', 'filter', 'show'],
      fillOnCreate: () => (new Date()).toISOString(),
    },
    {
      name: 'password',
      virtual: true,
      required: { create: true },
      editingNote: { edit: 'Leave empty to keep password unchanged' },
      type: AdminForthDataTypes.STRING,
      showIn: ['create', 'edit'],
      masked: true,
    },
    { name: 'passwordHash', backendOnly: true, showIn: [] },
    { 
      name: 'publicName',
      type: AdminForthDataTypes.STRING,
    },
    { name: 'avatar' },
  ],
  hooks: {
    create: {
      beforeSave: [
        blockDemoUsers,
        async ({ record, adminUser, resource }) => {
            record.passwordHash = await AdminForth.Utils.generatePasswordHash(record.password);
            return { ok: true };
        }
      ],
    },
    edit: {
      beforeSave: [
        blockDemoUsers,
        async ({ record, adminUser, resource}) => {
            if (record.password) {
                record.passwordHash = await AdminForth.Utils.generatePasswordHash(record.password);
            }
            return { ok: true }
        },
      ]
    },
    delete: {
      beforeSave: blockDemoUsers,
    },
  },
  plugins: [
    new UploadPlugin({
      pathColumnName: 'avatar',
      s3Bucket: process.env.AWS_S3_BUCKET,
      s3Region: process.env.AWS_S3_REGION,
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm','webp'],
      maxFileSize: 1024 * 1024 * 20, // 20MB
      s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3ACL: 'public-read', // ACL which will be set to uploaded file
      s3Path: (
        { originalFilename, originalExtension }: {originalFilename: string, originalExtension: string }
      ) => `user-avatars/${new Date().getFullYear()}/${randomUUID()}/${originalFilename}.${originalExtension}`,
      generation: {
        provider: 'openai-dall-e',
        countToGenerate: 2,
        openAiOptions: {
          model: 'dall-e-3',
          size: '1024x1024',
          apiKey: process.env.OPENAI_API_KEY,
        },
        rateLimit: {
          limit: '5/2d', // up to 10 times per 2 days
          errorMessage: 'For demo purposes, you can only generate 10 images per 2 days.',
        }
      },
    }),
  ],
}