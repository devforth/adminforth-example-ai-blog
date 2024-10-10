import { AdminUser, AdminForthDataTypes } from 'adminforth';
import { randomUUID } from 'crypto';
import UploadPlugin from '@adminforth/upload';
import RichEditorPlugin from '@adminforth/rich-editor';
import ChatGptPlugin from '@adminforth/chat-gpt';
import slugify from 'slugify';


const blockDemoUsers = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser.email.includes('demo')) {
    return { ok: false, error: "You can't do this as demo@adminforth.dev" }
  }
  return { ok: true };
}

export default {
  table: 'post',
  dataSource: 'maindb',
  label: 'Posts',
  recordLabel: (r: any) => `📝 ${r.title}`,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      fillOnCreate: () => randomUUID(),
      showIn: ['filter', 'show'],
    },
    {
      name: 'title',
      required: true,
      showIn: ['list', 'create', 'edit', 'filter', 'show'],
      maxLength: 255,
      minLength: 3,
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'picture',
      showIn: ['list', 'create', 'edit', 'filter', 'show'],
    },
    {
      name: 'slug',
      showIn: ['filter', 'show'],
    },
    {
      name: 'content',
      showIn: ['create', 'edit', 'filter', 'show'],
      type: AdminForthDataTypes.RICHTEXT,
    },
    {
      name: 'createdAt',
      showIn: ['list', 'filter', 'show',],
      fillOnCreate: () => (new Date()).toISOString(),
    },
    {
      name: 'published',
      required: true,
    },
    {
      name: 'authorId',
      foreignResource: {
        resourceId: 'user',
      },
      showIn: ['filter', 'show'],
      fillOnCreate: ({ adminUser }: { adminUser: AdminUser }) => {
        return adminUser.dbUser.id;
      }
    }
  ],
  hooks: {
    create: {
      beforeSave: [
        blockDemoUsers,
        async ({ record, adminUser }: { record: any, adminUser: AdminUser }) => {
          record.slug = slugify(record.title, { lower: true });
          return { ok: true };
        },
      ]
    },
    edit: {
      beforeSave: [
        blockDemoUsers,
        async ({ record, adminUser }: { record: any, adminUser: AdminUser }) => {
          if (record.title) {
            record.slug = slugify(record.title, { lower: true });
          }
          return { ok: true };
        },
      ]
    },
    delete: {
      beforeSave: blockDemoUsers,
    },
  },
  plugins: [
    new UploadPlugin({
      pathColumnName: 'picture',
      s3Bucket: process.env.AWS_S3_BUCKET,
      s3Region: process.env.AWS_S3_REGION,
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm','webp'],
      maxFileSize: 1024 * 1024 * 20, // 20MB
      s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3ACL: 'public-read', // ACL which will be set to uploaded file
      s3Path: (
        { originalFilename, originalExtension }: {originalFilename: string, originalExtension: string }
      ) => `post-previews/${new Date().getFullYear()}/${randomUUID()}/${originalFilename}.${originalExtension}`,
      generation: {
        provider: 'openai-dall-e',
        countToGenerate: 2,
        openAiOptions: {
          model: 'dall-e-3',
          size: '1792x1024',
          apiKey: process.env.OPENAI_API_KEY,
        },
        fieldsForContext: ['title'],
        rateLimit: {
          limit: '5/2d', // up to 10 times per 2 days
          errorMessage: 'For demo purposes, you can only generate 10 images per 2 days.',
        }
      },
    }),
    new RichEditorPlugin({
      htmlFieldName: 'content',
      completion: {
        provider: 'openai-chat-gpt',
        params: {
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4o',
        },
        expert: {
          debounceTime: 250,
        },
        rateLimit: {
          limit: '100/1d',
        }
      }, 
      attachments: {
        attachmentResource: 'contentImage',
        attachmentFieldName: 'img',
        attachmentRecordIdFieldName: 'postId',
        attachmentResourceIdFieldName: 'resourceId',
      },
    }),
    new ChatGptPlugin({
      openAiApiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
      fieldName: 'title',
      expert: {
        debounceTime: 250,
      },
      rateLimit: {
        limit: '100/1d',
      }
    }),
  ]
}