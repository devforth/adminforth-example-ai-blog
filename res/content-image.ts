
import { AdminForthDataTypes } from 'adminforth';
import { randomUUID } from 'crypto';
import UploadPlugin from '@adminforth/upload';

const blockDemoUsers = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser.email.includes('demo')) {
    return { ok: false, error: "You can't do this as demo@adminforth.dev" }
  }
  return { ok: true };
}

export default {
  table: 'contentImage',
  dataSource: 'maindb',
  label: 'Content Images',
  recordLabel: (r: any) => `🖼️ ${r.img}`,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      fillOnCreate: () => randomUUID(),
    },
    {
      name: 'createdAt',
      type: AdminForthDataTypes.DATETIME,
      fillOnCreate: () => (new Date()).toISOString(),
    },
    {
      name: 'img',
      type: AdminForthDataTypes.STRING,
      required: true,
    },
    {
      name: 'postId',
      foreignResource: {
        resourceId: 'post',
      },
      showIn: ['list', 'filter', 'show'],
    },
    {
      name: 'resourceId',
    }
  ],
  plugins: [
    new UploadPlugin({
      pathColumnName: 'img',
      s3Bucket: process.env.AWS_S3_BUCKET,
      s3Region: process.env.AWS_S3_REGION,
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm','webp'],
      maxFileSize: 1024 * 1024 * 20, // 20MB
      s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3ACL: 'public-read', // ACL which will be set to uploaded file
      s3Path: (
        { originalFilename, originalExtension }: {originalFilename: string, originalExtension: string }
      ) => `post-content/${new Date().getFullYear()}/${randomUUID()}/${originalFilename}.${originalExtension}`,
    }),
  ],
  hooks: {
    create: {
      beforeSave: blockDemoUsers,
    },
    edit: {
      beforeSave: blockDemoUsers,
    },
    delete: {
      beforeSave: blockDemoUsers,
    },
  },
}