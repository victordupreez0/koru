// Inline Babel plugin: rewrite `import.meta.env` -> `process.env` so service
// modules that read Vite envs work under Jest. We don't need the full Vite
// pipeline in tests — just enough to substitute the API base URL.
const replaceImportMetaEnv = ({ types: t }) => ({
  visitor: {
    MemberExpression(path) {
      const obj = path.node.object;
      if (
        t.isMetaProperty(obj) &&
        obj.meta && obj.meta.name === 'import' &&
        obj.property && obj.property.name === 'meta' &&
        path.node.property && path.node.property.name === 'env'
      ) {
        path.replaceWith(
          t.memberExpression(t.identifier('process'), t.identifier('env'))
        );
      }
    },
  },
});

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [replaceImportMetaEnv],
};
