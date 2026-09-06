// Run the same TypeScript model/renderer modules in Node as in Vite.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { transpileModule, ModuleKind, JsxEmit } from 'typescript';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of ['.ts', '.tsx']) {
        const url = new URL(specifier + extension, context.parentURL);
        if (existsSync(url)) return nextResolve(url.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.tsx?(\?|$)/.test(url)) {
      return {
        format: 'module', shortCircuit: true,
        source: transpileModule(readFileSync(new URL(url), 'utf8'), {
          compilerOptions: { module: ModuleKind.ESNext, jsx: JsxEmit.ReactJSX },
          fileName: new URL(url).pathname,
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});
