const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const params = {
  minify: false,
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: 'dist',
  plugins: [nodeExternalsPlugin()],  
};

const buildEntry = (entryPoint) => {
  return build({
    ...params,
    entryPoints: [entryPoint],
  })
    .then(() => {
      console.log(`Build successful for ${entryPoint}`);
    })
    .catch((error) => {
      console.error(`Build failed for ${entryPoint}:`, error);
      process.exit(2);
    });
};

Promise.all([
  buildEntry('src/handlers/processor.ts'),
  buildEntry('src/handlers/dispatcher.ts'),
  buildEntry('src/handlers/health.ts'),
]).then(() => {
  console.log('Build process completed.');
}).catch((error) => {
  console.error('Build process failed:', error);
  process.exit(2);
});