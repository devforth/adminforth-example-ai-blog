import express from 'express';
import AdminForth, { Filters, Sorts, AdminUser } from 'adminforth';
import userResource from './res/user.js';
import postResource from './res/post.js';
import contentImageResource from './res/content-image.js';
import httpProxy from 'http-proxy';

declare var process : {
  env: {
    DATABASE_URL: string
    NODE_ENV: string,
    AWS_S3_BUCKET: string,
    AWS_S3_REGION: string,
    APP_PORT: string,
  }
  argv: string[]
}

export const admin = new AdminForth({
  baseUrl: '/admin',
  auth: {
    usersResourceId: 'user',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'passwordHash',
    demoCredentials: "demo@adminforth.dev:demo", 
    loginPromptHTML: "Use email <b>demo@adminforth.dev</b> and password <b>demo</b> to login",
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM',
    timeFormat: 'HH:mm',
    emptyFieldPlaceholder: '-',
    styles: {
      colors: {
        light: {
          // color for links, icons etc.
          primary: 'rgb(47 37 227)',
          // color for sidebar and text
          sidebar: {main:'#EFF5F7', text:'#333'},
        },
      }
    },
    announcementBadge: (adminUser: AdminUser) => {
      return { 
        html: `
<svg xmlns="http://www.w3.org/2000/svg" style="display:inline; margin-top: -4px" width="16" height="16" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg> 
<a href="https://github.com/devforth/adminforth" style="font-weight: bold; text-decoration: underline" target="_blank">Star us on GitHub</a> to support a project!`,
        closable: true,
        // title: 'Support us for free',
      }
    }
  },
  dataSources: [{
    id: 'maindb',
    url:  process.env.DATABASE_URL?.replace('file:', 'sqlite://'),
  }],
  resources: [
    userResource,
    postResource,
    contentImageResource,
  ],
  menu: [
    {
      homepage: true,
      label: 'Posts',
      icon: 'flowbite:home-solid',
      resourceId: 'post',
    },
    { type: 'gap' },
    { type: 'divider' },
    { type: 'heading', label: 'SYSTEM' },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'user',
    }
  ],
});


if (import.meta.url === `file://${process.argv[1]}`) {
  // if script is executed directly e.g. node index.ts or npm start

  const app = express()
  app.use(express.json());
  const port = process.env.APP_PORT || 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  if (process.env.NODE_ENV === 'development') {
    await admin.bundleNow({ hotReload: true });
  }
  console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

  // api to server recent posts
  app.get('/api/posts', async (req, res) => {
    const { offset = 0, limit = 100, slug = null } = req.query;
    const posts = await admin.resource('post').list(
      [Filters.EQ('published', true), ...(slug ? [Filters.LIKE('slug', slug)] : [])],
      limit,
      offset,
      Sorts.DESC('createdAt'),
    );
    const authorIds = [...new Set(posts.map((p: any) => p.authorId))];
    const authors = (await admin.resource('user').list(Filters.IN('id', authorIds)))
      .reduce((acc: any, a: any) => {acc[a.id] = a; return acc;}, {});
    posts.forEach((p: any) => {
      const author = authors[p.authorId];
      p.author = { 
        publicName: author.publicName, 
        avatar: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${author.avatar}`
      };
      p.picture = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${p.picture}`;
    });
    res.json(posts);
  });

  // here we proxy all non-/admin requests to nuxt instance http://localhost:3000
  // this is done for demo purposes, in production you should do this using high-performance reverse proxy like traefik or nginx
  app.use((req, res, next) => {
    if (!req.url.startsWith('/admin')) {
      const proxy = httpProxy.createProxyServer();
      proxy.on('error', function (err, req, res) {
        res.send(`No response from Nuxt at http://localhost:3000, did you start it? ${err}`)
      });
      proxy.web(req, res, { target: 'http://localhost:3000' });
    } else {
      next();
    }
  });

  // serve after you added all api
  admin.express.serve(app)

  admin.discoverDatabases();

  app.listen(port, () => {
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}\n`)
  });
}