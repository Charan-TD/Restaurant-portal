import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
// Compile only the pure parser, as menuItem.test.mjs does.
const source=await readFile(new URL('../src/features/insights/services/insightsParse.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseMetrics,parseEarnings,parseSettlement,parseDistribution,parseList,parseOrder}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const ok=(data)=>({success:true,data});
// The server's own examples, one per rider model.
const OWN_METRICS=ok({period:'7d',metrics:{total_orders:{value:305,change_percentage:6.6},total_sale_value:{amount:'71860.00',change_percentage:8.4},undelivered:{count:7,amount:'1660.00',percentage:2.3},cod:{amount:'29200.00',order_count:124,order_percentage:40.66},prepaid:{amount:'42660.00',order_count:181,order_percentage:59.34},your_earnings:{amount:'40084.20'}}});
const TD_METRICS=ok({period:'7d',metrics:{total_orders:{value:305,change_percentage:6.6},total_sale_value:{amount:'71860.00',change_percentage:8.4},undelivered:{count:7,amount:'1660.00',percentage:2.3},final_settled:{amount:'40084.20'}}});

test('a restaurant with its own riders gets six metrics: COD, prepaid and earnings',()=>{
  const m=parseMetrics(OWN_METRICS);
  assert.equal(m.model,'own');
  assert.equal(m.totalOrders.value,305);
  assert.deepEqual(m.cod,{amount:29200,orders:124,share:40.66});
  assert.deepEqual(m.prepaid,{amount:42660,orders:181,share:59.34});
  assert.equal(m.payout,40084.2);
  assert.equal(m.undelivered.count,7);
});
test('a restaurant on TrainDhaba riders gets four metrics: no COD or prepaid, final settled',()=>{
  const m=parseMetrics(TD_METRICS);
  assert.equal(m.model,'traindhaba');
  assert.equal(m.cod,undefined);
  assert.equal(m.prepaid,undefined);
  assert.equal(m.payout,40084.2);
  assert.equal(m.totalSale.amount,71860);
});
test('a missing change percentage stays null instead of becoming 0',()=>{
  const m=parseMetrics(ok({metrics:{total_orders:{value:0,change_percentage:null},total_sale_value:{amount:'0.00',change_percentage:null},undelivered:{count:0,amount:'0.00',percentage:0},final_settled:{amount:'0.00'}}}));
  assert.equal(m.totalOrders.change,null);
  assert.equal(m.totalSale.change,null);
});
test('earnings: own riders carry COD, prepaid and final earnings per item',()=>{
  const e=parseEarnings(ok({period:'7d',items:[{item_id:'a',item_name:'Chicken Dum Biryani',food_type:'NON_VEG',total_orders:92,unit_price:'320.00',undelivered:2,cod:'12360.00',prepaid:'17080.00',delivered_sale_value:'28800.00',final_earnings:'16444.80'}],summary:{total_orders:305,undelivered:7,cod:'29200.00',prepaid:'42660.00',delivered_sale_value:'70200.00',final_earnings:'40084.20'}}));
  assert.equal(e.model,'own');
  assert.equal(e.items[0].type,'Non-veg');
  assert.equal(e.items[0].cod,12360);
  assert.equal(e.items[0].final,16444.8);
  assert.equal(e.total.final,40084.2);
});
test('earnings: TrainDhaba riders carry final settled and no COD or prepaid',()=>{
  const e=parseEarnings(ok({period:'7d',items:[{item_id:'a',item_name:'Veg Thali',food_type:null,total_orders:5,unit_price:'180.00',undelivered:1,delivered_sale_value:'720.00',final_settled:'400.00'}],summary:{total_orders:5,undelivered:1,delivered_sale_value:'720.00',final_settled:'400.00'}}));
  assert.equal(e.model,'traindhaba');
  assert.equal(e.items[0].final,400);
  assert.equal(e.items[0].cod,0);
  assert.equal(e.items[0].type,'');
  assert.equal(e.total.final,400);
});
test('settlement breakdown: the payment split exists only for own riders',()=>{
  const own=parseSettlement(ok({period:'7d',total_orders:305,total_sale_value:'71860.00',payment_breakdown:{cod:{order_count:124,amount:'29200.00'},prepaid:{order_count:181,amount:'42660.00'}},undelivered:{order_count:7,amount:'1660.00'},delivered_sale_value:'70200.00',traindhaba_fee:'30115.80',your_earnings:'40084.20'}));
  assert.equal(own.model,'own');
  assert.deepEqual(own.cod,{orders:124,amount:29200});
  assert.equal(own.fee,30115.8);
  const td=parseSettlement(ok({period:'7d',total_orders:305,total_sale_value:'71860.00',undelivered:{order_count:7,amount:'1660.00'},delivered_sale_value:'70200.00',traindhaba_fee:'30115.80',your_earnings:'40084.20'}));
  assert.equal(td.model,'traindhaba');
  assert.equal(td.cod,undefined);
  assert.equal(td.undelivered.orders,7);
});
test('payment distribution is read with both splits',()=>{
  const d=parseDistribution(ok({period:'7d',total_orders:305,total_sale_value:'71860.00',payment_methods:{cod:{order_count:124,sale_value:'29200.00',order_percentage:40.66,sales_percentage:40.63,avg_per_order:'235.48'},prepaid:{order_count:181,sale_value:'42660.00',order_percentage:59.34,sales_percentage:59.37,avg_per_order:'235.69'}}}));
  assert.equal(d.cod.orders,124);
  assert.equal(d.prepaid.avgPerOrder,235.69);
  assert.equal(d.prepaid.salesShare,59.37);
});
test('orders list: items is a count, money is a number, paging comes from the server',()=>{
  const l=parseList(ok({orders:[{ord_id:'ORD-R7K2-583921',date_time:'2026-11-14T12:55:00.000+05:30',train:'16231 Mysuru Exp',station:'YPR',coach:'B4',seat:'29',items:3,amount:'60.00',payment:'PREPAID',status:'DELIVERED'}],pagination:{current_page:1,page_size:10,total_records:305,total_pages:31}}),1);
  assert.equal(l.rows[0].itemCount,3);
  assert.equal(l.rows[0].amount,60);
  assert.equal(l.rows[0].payment,'PREPAID');
  assert.equal(l.pagination.pages,31);
  assert.equal(l.summary.orders,305);
});
test('undelivered list: reason and settlement are null until the server records them',()=>{
  const l=parseList(ok({orders:[{ord_id:'ORD-1',date_time:'2026-11-14T12:17:00.000+05:30',train:null,station:null,coach:null,seat:null,amount:'600.00',payment:null,reason:null,settlement:null}],summary:{total_orders:7,total_amount:'1660.00',percentage_of_all_orders:2.3},pagination:{current_page:1,page_size:10,total_records:7,total_pages:1}}),1);
  assert.equal(l.rows[0].reason,null);
  assert.equal(l.rows[0].settlement,null);
  assert.equal(l.rows[0].payment,null);
  assert.equal(l.summary.amount,1660);
  assert.equal(l.summary.percentOfAll,2.3);
});
test('sale list keeps the item names; COD list reads a missing collector as null',()=>{
  const s=parseList(ok({orders:[{ord_id:'ORD-2',date_time:'x',items:[{item_name:'Dal Makhani',quantity:2},{item_name:'Curd Rice',quantity:1}],payment:'COD',sale_value:'60.00'}],summary:{total_orders:305,total_sale_value:'71860.00'},pagination:{current_page:1,page_size:10,total_records:305,total_pages:31}}),1);
  assert.deepEqual(s.rows[0].itemList,[{name:'Dal Makhani',quantity:2},{name:'Curd Rice',quantity:1}]);
  assert.equal(s.rows[0].amount,60);
  const c=parseList(ok({orders:[{ord_id:'ORD-3',amount:'235.00',collected_by:null,cash_status:null}],summary:{total_orders:124,total_amount:'29200.00'},pagination:{current_page:1,page_size:10,total_records:124,total_pages:13}}),1);
  assert.equal(c.rows[0].collectedBy,null);
});
test('an empty list still has one page',()=>{
  const l=parseList(ok({orders:[],summary:{total_orders:0,total_amount:'0.00'},pagination:{current_page:1,page_size:10,total_records:0,total_pages:0}}),1);
  assert.equal(l.rows.length,0);
  assert.equal(l.pagination.pages,1);
});
test('order details: delivered keeps earnings, undelivered is not paid',()=>{
  const body=(status,fee,earn,rider)=>ok({ord_id:'ORD-ABCD1234',status,date_time:'2026-11-14T15:47:00.000+05:30',passenger_details:{name:'Vikram P.',phone:'9876543210',train:{number:'11301',name:'Udyan Exp'},coach:'C4',seat:'26',delivery_station:{name:'Bangalore Cantt',code:'BNC'}},items:[{item_name:'Curd Rice',quantity:1,customer_price:'180.00',traindhaba_commission_amount:'77.22',restaurant_earning:'102.78'}],payment_and_earnings:{order_value:'420.00',payment:'COD',rider,traindhaba_fee:fee,your_earnings:earn},order_timeline:[{event:'ORDER_PLACED',label:'Order placed',timestamp:'2026-11-14T15:47:00.000+05:30'}]});
  const d=parseOrder(body('DELIVERED','180.18','239.82',{name:'Suresh'}),'ORD-ABCD1234');
  assert.equal(d.status,'DELIVERED');
  assert.equal(d.train,'11301 Udyan Exp');
  assert.equal(d.deliveryStation,'Bangalore Cantt (BNC)');
  assert.equal(d.rider,'Suresh');
  assert.equal(d.earning,239.82);
  assert.equal(d.items[0].earning,102.78);
  const u=parseOrder(body('UNDELIVERED','0.00','0.00',null),'ORD-ABCD1234');
  assert.equal(u.status,'UNDELIVERED');
  assert.equal(u.rider,null);
  assert.equal(u.earning,0);
});
