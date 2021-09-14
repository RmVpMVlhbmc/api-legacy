# API Collection

## Usage

### Local deployment

1. Install dependencies (`yarn install` or `npm install`)
2. Set environment variable (bash: `export DEVELOPMENT=true` or cmd: `set DEVELOPMENT true` or PowerShell: `$env:DEVELOPMENT='true'`)
3. Start server (`node src/api.mjs`)

### Serverless deployment (Netlify)

1. Install Netlify CLI (`yarn global add netlify-cli` or `npm --global install netlify-cli`)
2. Bundle source code to distributable file (`netlify-cli functions:build --source src`)
3. Deploy it (`netlify-cli deploy --prod --site SITE_ID --dir static --functions dist`)

## License

This project is licensed under GNU Affero General Public License Version 3.