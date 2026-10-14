import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
// Compile only the pure model, as validation.test.mjs does.
const source=await readFile(new URL('../src/features/menu/models/menuItem.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ["']zod["']/g,`from "${import.meta.resolve('zod')}"`);
const {menuItemFormSchema,emptyMenuItemForm,toMenuItemPayload,fromMenuItemRow,toMenuItemForm,isLowStock}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const jpg=new File(['x'],'dish.jpg',{type:'image/jpeg'});
const valid=()=>({...emptyMenuItemForm(),foodType:'Non-veg',name:' Chicken Biryani ',category:'Biryani',subCategory:'Chicken Biryani',price:250,preparationMinutes:25});
const ok=(change)=>menuItemFormSchema.safeParse({...valid(),...change}).success;
test('name, category, price, preparation time and food type are required',()=>{assert.equal(ok({}),true);for(const change of [{category:' '},{subCategory:''},{name:'  '},{price:null},{price:0},{preparationMinutes:null},{preparationMinutes:0},{foodType:''},{foodType:'veg'}])assert.equal(ok(change),false,JSON.stringify(change))});
test('numbers match the backend: whole, non-negative; tax may be decimal',()=>{for(const change of [{price:12.5},{quantity:-1},{lowStockThreshold:1.5},{taxRate:-1},{taxRate:null}])assert.equal(ok(change),false,JSON.stringify(change));assert.equal(ok({taxRate:2.5}),true)});
test('offer price is optional and must be below the price',()=>{assert.equal(ok({discountedPrice:null}),true);assert.equal(ok({discountedPrice:200}),true);const r=menuItemFormSchema.safeParse({...valid(),discountedPrice:250});assert.equal(r.success,false);assert.ok(r.error.issues.some(i=>i.path.join('.')==='discountedPrice'))});
test('pictures are optional JPG or WEBP files',()=>{assert.equal(ok({images:[jpg]}),true);assert.equal(ok({images:[new File(["x"],"d.png",{type:"image/png"})]}),false);assert.equal(ok({images:[jpg,jpg]}),false)});
test('payload uses backend field names and food_served keys',()=>{const p=toMenuItemPayload({...valid(),description:'',category:' Rice '});assert.deepEqual(p,{name:'Chicken Biryani',description:null,category_id:'Rice',price:250,discounted_price:null,tax_rate:0,preparation_time_minutes:25,quantity:0,low_stock_threshold:0,owner_is_available:true,food_served:['non_veg']})});
test('rows are read back, including numeric strings',()=>{const item=fromMenuItemRow({id:'a',name:'Dosa',description:null,price:90,tax_rate:'5.00',preparation_time_minutes:10,owner_is_available:false,category_id:null,img_urls:['https://x.test/a.jpg'],quantity:2,low_stock_threshold:3,admin_is_available:false,admin_item_inactive_reason:{reason:'Hygiene check'},discounted_price:null,food_served:['veg']});assert.equal(item.taxRate,5);assert.equal(item.foodType,'Veg');assert.equal(item.available,false);assert.equal(item.adminInactiveReason,'Hygiene check');assert.deepEqual(item.images,['https://x.test/a.jpg']);assert.equal(isLowStock(item),true);assert.equal(toMenuItemForm(item).foodType,'Veg')});
test('low stock needs a threshold above 0',()=>{assert.equal(isLowStock({quantity:0,lowStockThreshold:0}),false)});
