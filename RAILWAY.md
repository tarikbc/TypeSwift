# Deploying TypeSwift to Railway

This guide explains how to deploy the TypeSwift application to Railway.

## Prerequisites

1. A [Railway](https://railway.app/) account
2. The TypeSwift repository cloned to your local machine

## Deployment Steps

### 1. Create a New Project in Railway

1. Log in to your Railway account
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select the TypeSwift repository

### 2. Configure Environment Variables

Railway will automatically detect the `.env.production` file, but you should set these variables in the Railway dashboard for better security:

1. Go to your project settings
2. Click on the "Variables" tab
3. Add the following variables:
   - `NODE_ENV`: `production`
   - `COOKIE_SECRET`: A secure random string (change from the default)

Railway will automatically provide a `DATABASE_URL` for the PostgreSQL database.

### 3. Configure Build Settings

Railway will use the configuration in `railway.toml` and `Procfile` to build and run the application.

### 4. Deploy

1. Railway will automatically deploy the application when you push changes to your repository
2. You can also manually trigger a deployment from the Railway dashboard

### 5. Access Your Application

1. Once deployed, Railway will provide a URL to access your application
2. You can also configure a custom domain in the Railway dashboard

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues, check:
1. The `DATABASE_URL` environment variable is correctly set by Railway
2. The database is properly initialized

### Build Failures

If the build fails, check:
1. The logs in the Railway dashboard
2. Ensure TypeScript is properly installed during the build process
3. Verify that all dependencies are correctly specified in package.json

## Scaling

Railway offers various scaling options:
1. Adjust the resources allocated to your service in the Railway dashboard
2. Scale your database as needed

## Monitoring

Railway provides basic monitoring capabilities:
1. View logs in the Railway dashboard
2. Set up alerts for critical events

## Costs

Railway charges based on resource usage. Monitor your usage in the Railway dashboard to avoid unexpected charges.
