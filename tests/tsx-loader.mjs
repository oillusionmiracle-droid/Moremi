// Test-only TSX/alias support. No browser or production dependency on this loader.
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as pathResolve, extname } from "node:path";
import ts from "typescript";
const root=fileURLToPath(new URL("../",import.meta.url));
registerHooks({
  resolve(specifier,context,next){
    if(specifier.startsWith("@/") || (specifier.startsWith(".") && context.parentURL?.startsWith(pathToFileURL(root).href) && !context.parentURL.includes("node_modules"))){
      const base=specifier.startsWith("@/")?pathResolve(root,specifier.slice(2)):fileURLToPath(new URL(specifier,context.parentURL));
      for(const candidate of [base,base+".tsx",base+".ts",base+".mjs",base+"/index.tsx",base+"/index.ts"]){if(existsSync(candidate)&&extname(candidate))return{url:pathToFileURL(candidate).href,shortCircuit:true};}
    }
    return next(specifier,context);
  },
  load(url,context,next){
    if(/\.tsx?$/.test(url)&&!url.includes("node_modules"))return{format:"module",source:ts.transpileModule(readFileSync(fileURLToPath(url),"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,shortCircuit:true};
    return next(url,context);
  },
});
