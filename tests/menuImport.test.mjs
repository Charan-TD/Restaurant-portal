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
const {parsePrice,parseNumber,parseFoodType,parseAvailability,parseNamedPrices}=await load('parse');
const {detectSheet}=await load('detectColumns');
const {buildDraft,validateDraft,newQtyTypes}=await load('buildDraft');
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

const pic=(name)=>new File([new Uint8Array([1])],name,{type:'image/jpeg'});

test('every dish needs a food type; a photo is optional',()=>{
  const item=buildDraft(sheet([['Name','Price'],['Idli',40]]),1,detectSheet(sheet([['Name','Price'],['Idli',40]])).mapping)[0];
  Object.assign(item,{category:'Breakfast',prepMinutes:10});
  const fields=validateDraft([item]).map((i)=>i.field).sort();
  assert.deepEqual(fields,['foodType']);
  Object.assign(item,{foodType:'Veg',photo:pic('a.jpg')});
  assert.equal(validateDraft([item]).length,0);
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

test('the vendor sample (Food / Dish, Cost, Category?, Food Choice, Extra Info) is read without help',()=>{
  const s=sheet([['Food / Dish','Cost','Category?','Food Choice','Extra Info'],['Veg Thali','₹120','Meals','Veg','Rice, dal, curry, curd'],['Chicken Meals','₹ 210','Meals','Non-Veg','Chicken curry with rice'],['Egg Omelette',60,'Sides','egg','Double egg'],['Mushroom Curry',null,'Curries','Veg','Missing price'],['Chicken 65','Two hundred','Starters','Non Veg','Bad price']]);
  const d=detectSheet(s);
  assert.equal(d.automatic,true);assert.equal(d.headerRow,1);
  assert.deepEqual([d.mapping.name,d.mapping.price,d.mapping.category,d.mapping.foodType,d.mapping.description],[0,1,2,3,4]);
  const items=buildDraft(s,d.headerRow,d.mapping);
  assert.deepEqual(items.map(i=>i.foodType),['Veg','Non-veg','Egg','Veg','Non-veg']);
  assert.equal(items[3].price,null);assert.equal(items[4].price,null);
});

test('headings are also understood by the words in them; codes and serials are ignored',()=>{
  const s=sheet([['Sl No','Item Code','Name of the Dish','Item Rate','Item Category','Dish Description'],[1,'A1','Idli','40','Tiffin','Soft rice cakes'],[2,'A2','Dosa','60','Tiffin','Crisp crepe']]);
  const d=detectSheet(s);
  assert.equal(d.mapping.name,2);assert.equal(d.mapping.price,3);assert.equal(d.mapping.category,4);assert.equal(d.mapping.description,5);
});

test('quantity and add-on columns become sizes and add-ons',()=>{
  assert.deepEqual(parseNamedPrices('Half:120, Full:220'),[{name:'Half',price:120},{name:'Full',price:220}]);
  assert.deepEqual(parseNamedPrices('Raita (₹20); Papad 10 / Extra cheese'),[{name:'Raita',price:20},{name:'Papad',price:10},{name:'Extra cheese',price:null}]);
  const s=sheet([['Dish','Price','Qty','Add-ons'],['Biryani',null,'Half:180, Full:300','Raita:20, Salan 15'],['Curry','90 / 160','Half / Full',null],['Tea',15,'Cup',null]]);
  const d=detectSheet(s),items=buildDraft(s,d.headerRow,d.mapping);
  assert.equal(d.mapping.quantity,2);assert.equal(d.mapping.addons,3);
  assert.deepEqual(items[0].sizes,[{name:'Half',price:180},{name:'Full',price:300}]);assert.equal(items[0].price,300);
  assert.deepEqual(items[0].addons.map(a=>[a.name,a.price]),[['Raita',20],['Salan',15]]);
  assert.deepEqual(items[1].sizes,[{name:'Half',price:90},{name:'Full',price:160}]);assert.equal(items[1].price,160);
  // One quantity is not a size.
  assert.deepEqual(items[2].sizes,[]);assert.equal(items[2].price,15);
});

test('unnamed columns are read from their values: food type, availability, prep time, photo, sizes, add-ons',()=>{
  const s=sheet([['Dish','Price','A','B','C','D','E','F'],
    ['Idli',40,'Veg','Yes','10 min','idli.jpg','Small:30, Large:50','Chutney:10, Sambar 15'],
    ['Omelette',50,'Egg','No','5 mins','omelette.png','Small:40, Large:60','Cheese:20'],
    ['Kebab',150,'Non veg','Yes','20 min','kebab.jpg','Half:90, Full:150','Mint dip:10, Onion 5']]);
  const d=detectSheet(s);
  assert.deepEqual([d.mapping.foodType,d.mapping.available,d.mapping.prepMinutes,d.mapping.photoFile,d.mapping.quantity,d.mapping.addons],[2,3,4,5,6,7]);
});

test('a data row holding "Veg" is not taken for a heading row',()=>{
  const s=sheet([['Idli',40,'Breakfast','Veg'],['Dosa',null,'Breakfast','Veg'],['Tea',15,'Drinks','Veg'],['Omelette',50,'Breakfast','Egg']]);
  const d=detectSheet(s);
  assert.equal(d.headerRow,0);assert.equal(buildDraft(s,d.headerRow,d.mapping).length,4);
  assert.equal(d.mapping.name,0);assert.equal(d.mapping.price,1);assert.equal(d.mapping.foodType,3);
});

test('sizes the restaurant does not have are new quantity types, not errors',()=>{
  const s=sheet([['Dish','Price','Category','Food Type','Prep Time','Qty'],['Biryani',300,'Rice','Non Veg',20,'Half:180, Family Pack:500'],['Pulao',200,'Rice','Veg',15,'half:120, Jumbo:250, family pack:400']]);
  const d=detectSheet(s),items=buildDraft(s,d.headerRow,d.mapping);
  assert.deepEqual(validateDraft(items).filter(i=>i.field==='sizes'),[]);
  // Known names in any case are skipped; each new name is listed once, as first written.
  assert.deepEqual(newQtyTypes(items,['Half','Full']),['Family Pack','Jumbo']);
  items[0].sizes[0].name=' ';
  assert.equal(validateDraft(items).find(i=>i.field==='sizes')?.message,'Every size needs a name.');
});

test('"Product" and a "Food" column of Veg / Non Veg: the name is Product; one row per size becomes sizes',()=>{
  const s=sheet([['Product','Group','Portion','Selling Rate','Optional Add-ons','Food'],
    ['Plain Dosa','Tiffins','Regular',70,'Extra Sambar, Chutney','Veg'],['Plain Dosa','Tiffins','Ghee',95,'Extra Sambar, Chutney','Veg'],
    ['Chicken Biryani','Rice Specials','Half',160,'Raita, Salan','Non Veg'],['Chicken Biryani','Rice Specials','Full',280,'Raita, Salan','Non Veg'],
    ['Tea','Drinks','Cup',15,null,'Veg']]);
  const d=detectSheet(s),items=buildDraft(s,d.headerRow,d.mapping);
  assert.equal(d.mapping.name,0);assert.equal(d.mapping.foodType,5);
  assert.deepEqual(items.map(i=>i.name),['Plain Dosa','Chicken Biryani','Tea']);
  assert.deepEqual(items[0].sizes,[{name:'Regular',price:70},{name:'Ghee',price:95}]);assert.equal(items[0].price,95);
  assert.deepEqual(items[1].addons.map(a=>a.name),['Raita','Salan']);assert.equal(items[1].foodType,'Non-veg');
  // A dish with one row keeps its plain price.
  assert.deepEqual(items[2].sizes,[]);assert.equal(items[2].price,15);
});

test('"Cheese +50" is one add-on; "Size Details" holds sizes; a negative size price is reported',()=>{
  assert.deepEqual(parseNamedPrices('Cheese +50, Olives +30'),[{name:'Cheese',price:50},{name:'Olives',price:30}]);
  assert.deepEqual(parseNamedPrices('Raita + Papad'),[{name:'Raita',price:null},{name:'Papad',price:null}]);
  const s=sheet([['Food Name','Category / Group','Price (INR)','Size Details','Add-on Choices','Type'],
    ['Veg Pizza','Pizza','₹250','Small: 150 | Medium: 250 | Large: 400','Cheese +50, Olives +30','Veg'],
    ['Paneer Roll','Wraps',140,'Regular: 140 | Jumbo: -20','Cheese +25','Veg']]);
  const d=detectSheet(s),items=buildDraft(s,d.headerRow,d.mapping);
  assert.equal(d.mapping.quantity,3);assert.equal(d.mapping.addons,4);
  assert.deepEqual(items[0].sizes.map(x=>x.name),['Small','Medium','Large']);
  assert.deepEqual(items[0].addons.map(a=>[a.name,a.price]),[['Cheese',50],['Olives',30]]);
  assert.ok(validateDraft(items).some(i=>i.message==='A size price cannot be negative.'));
});
