import {readFile,writeFile,readdir,cp,unlink} from 'node:fs/promises';
async function walk(dir,prefix=''){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=prefix+e.name;if(e.isDirectory())result.push(...await walk(dir+'/'+e.name,path+'/'));else result.push(path)}return result}
const current=(await walk('dist')).sort();let previous=[];try{previous=JSON.parse(await readFile('.generated-pages.json','utf8'))}catch{}
for(const path of previous){if(!current.includes(path)&&/^(?:[a-z0-9-]+\.(?:html|css|js|json|xml|txt)|assets\/[a-zA-Z0-9_-]+\.(?:svg|png|jpg|webp))$/.test(path))await unlink(path).catch(()=>{})}
for(const path of current)await cp('dist/'+path,path,{recursive:true});await writeFile('.generated-pages.json',JSON.stringify(current,null,2));await writeFile('.nojekyll','');console.log('Exported static pages to repository root');
