import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
// Compile the framework-free import logic (no React, no app imports) into a temp folder.
const src=new URL('../src/features/menu/import/',import.meta.url),out=await mkdtemp(join(tmpdir(),'menu-import-'));
for(const f of await readdir(src)){
  if(!f.endsWith('.ts'))continue;
  const code=ts.transpileModule(await readFile(new URL(f,src),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from "(\.\/[^"]+)"/g,'from "$1.mjs"');
  await writeFile(join(out,f.replace('.ts','.mjs')),code);
}
const load=(n)=>import(pathToFileURL(join(out,`${n}.mjs`)).href);
const {parsePrice,parseNumber,parseFoodType,parseAvailability}=await load('parse');
const {detectSheet}=await load('detectColumns');
const {buildDraft,validateDraft}=await load('buildDraft');
const sheet=(rows)=>({name:'S',rows:rows.map((values,i)=>({sourceRow:i+1,values}))});

test('prices, numbers, food types and availability are read leniently',()=>{
  assert.equal(parsePrice('₹1,250.50'),1250.5);assert.equal(parsePrice('Rs. 40'),40);assert.equal(parsePrice('40/-'),40);
  assert.equal(parsePrice('1.250,50'),null);assert.equal(parsePrice('ask'),null);
  assert.equal(parseNumber('20 mins'),20);assert.equal(parseNumber('x'),null);
  assert.equal(parseFoodType('Non Veg'),'Non-veg');assert.equal(parseFoodType('VEG'),'Veg');assert.equal(parseFoodType('Egg'),'Egg');assert.equal(parseFoodType('??'),'');
  assert.equal(parseAvailability('No'),false);assert.equal(parseAvailability('Yes'),true);
});

test('clear vendor headings are matched automatically, Half/Full become sizes',()=>{
  const s=sheet([['S.No','Dish Name','Section','Half Plate','Full Plate'],[1,'Idli','Breakfast',30,50],[2,'Coffee','Beverages',null,35]]);
  const d=detectSheet(s);
  assert.equal(d.automatic,true);assert.equal(d.headerRow,1);assert.equal(d.mapping.name,1);assert.equal(d.mapping.category,2);
  const items=buildDraft(s,d.headerRow,d.mapping);
  assert.equal(items.length,2);assert.equal(items[0].price,50);assert.deepEqual(items[0].sizes,[{name:'Half Plate',price:30},{name:'Full Plate',price:50}]);
  // One size price is just the price.
  assert.equal(items[1].price,35);assert.deepEqual(items[1].sizes,[]);
});

test('a sheet with no headings is guessed from its values and needs confirming',()=>{
  const s=sheet([['Idli',40,'Breakfast'],['Dosa',60,'Breakfast'],['Tea',15,'Drinks'],['Poori',50,'Breakfast'],['Vada',30,'Breakfast'],['Juice',40,'Drinks']]);
  const d=detectSheet(s);
  assert.equal(d.automatic,false);assert.equal(d.headerRow,0);assert.equal(d.mapping.name,0);assert.equal(d.mapping.price,1);assert.equal(d.mapping.category,2);
  assert.equal(buildDraft(s,0,d.mapping).length,6);
});

test('missing prep time, category and price are reported; duplicates are caught',()=>{
  const s=sheet([['Name','Price'],['Idli',40],['idli',40],['Dosa','ask']]);
  const d=detectSheet(s),items=buildDraft(s,d.headerRow,d.mapping),issues=validateDraft(items);
  const has=(i,f)=>issues.some((x)=>x.itemId===items[i].id&&x.field===f);
  assert.ok(has(0,'category')&&has(0,'prepMinutes'));assert.ok(has(2,'price'));
  items.forEach((it)=>{it.category='Breakfast';it.prepMinutes=10;});
  const left=validateDraft(items);
  assert.equal(left.filter((x)=>x.message.includes('already')).length,1,'a repeated dish in one category is flagged once');
});

const {matchPhotos}=await load('photos');
const pic=(name)=>new File([new Uint8Array([1])],name,{type:'image/jpeg'});

test('every dish needs a food type and a photo before it can be sent',()=>{
  const item=buildDraft(sheet([['Name','Price'],['Idli',40]]),1,detectSheet(sheet([['Name','Price'],['Idli',40]])).mapping)[0];
  Object.assign(item,{category:'Breakfast',prepMinutes:10});
  const fields=validateDraft([item]).map((i)=>i.field).sort();
  assert.deepEqual(fields,['foodType','photo']);
  Object.assign(item,{foodType:'Veg',photo:pic('a.jpg')});
  assert.equal(validateDraft([item]).length,0);
});

test('photos are matched by the photo-file column, then by dish name; unclear names are reported',()=>{
  const s=sheet([['Name','Price','Photo File'],['Idli',40,'idli_1.jpg'],['Masala Dosa',60,''],['Poori',50,'']]);
  const d=detectSheet(s),items=buildDraft(s,d.headerRow,d.mapping);
  assert.equal(items[0].photoFile,'idli_1.jpg');
  const r=matchPhotos(items,[pic('IDLI_1.png'),pic('masala dosa.jpg'),pic('vada.jpg')]);
  assert.equal(r.matches.get(items[0].id).name,'IDLI_1.png');
  assert.equal(r.matches.get(items[1].id).name,'masala dosa.jpg');
  assert.deepEqual(r.unmatched,['vada.jpg']);
  assert.equal(matchPhotos(items,[pic('poori.jpg'),pic('poori.png')]).ambiguous.length,2);
});

const {emptyDraftItem,emptyAddon}=await load('buildDraft');

test('add-ons need a name and price, one name per dish, and one definition per category',()=>{
  const dish=(n,addons)=>emptyDraftItem({name:n,category:'Biryani',price:100,prepMinutes:10,foodType:'Veg',photo:pic('a.jpg'),addons});
  const a=dish('A',[emptyAddon({name:'Raita',price:20}),emptyAddon({name:'raita',price:20}),emptyAddon({name:'',price:null})]);
  const msgs=validateDraft([a]).map((i)=>i.message);
  assert.ok(msgs.some((m)=>m.includes('needs a name')));assert.ok(msgs.some((m)=>m.includes('price of 0')));assert.ok(msgs.some((m)=>m.includes('same name')));
  const ok=dish('A',[emptyAddon({name:'Raita',price:20})]),other=dish('B',[emptyAddon({name:'Raita',price:25})]);
  assert.ok(validateDraft([ok,other]).some((i)=>i.itemId===other.id&&i.field==='addons'));
  other.addons[0].price=20;
  assert.equal(validateDraft([ok,other]).length,0);
});
